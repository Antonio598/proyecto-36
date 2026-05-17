import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addMinutes, isBefore, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import prisma from '@/lib/prisma';
import { sendAppointmentEmail } from '@/lib/mail';

const PANAMA_TZ = 'America/Panama';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, subaccountId, accountId } = await req.json();

  if (!subaccountId || !accountId) {
    return new Response(
      JSON.stringify({ error: 'Falta contexto de sede o cuenta. Por favor recarga la página.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: `Eres el Asistente de Recepción Virtual de la Clínica. Eres amable, profesional y altamente eficiente. 
    Tu trabajo es ayudar a los pacientes a agendar citas médicas, añadir servicios al catálogo, registrar médicos y responder sus dudas de forma inteligente.
    
    INFORMACIÓN DE CONTEXTO ACTUAL:
    - ID de Sede Actual: ${subaccountId || 'No especificado (pide al usuario que seleccione su sede si es necesario, aunque debería venir automático)'}
    - ID de Cuenta: ${accountId || 'No especificado'}

    REGLAS ESTRICTAS:
    1. NUNCA inventes información. Usa getServices para conocer los servicios reales de esta sede.
    2. Usa getDoctors para obtener los médicos y su calendarId antes de agendar.
    3. Usa checkAvailability (con calendarId del médico elegido) para verificar horarios libres.
    4. Usa bookAppointment pasando SIEMPRE el calendarId y doctorId del médico elegido.
    5. NUNCA confirmes una cita sin que bookAppointment retorne success:true.
    6. Solo puedes gestionar datos de la sede ${subaccountId} y la cuenta ${accountId}.
    7. Sé corto y conciso. Widget pequeño de chat. Tono servicial.`,

    tools: {
      getServices: {
        description: 'Obtiene la lista completa de servicios activos en la sede actual.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!subaccountId) return { error: 'No hay una sede seleccionada en el contexto del chat.' };
          try {
            const services = await prisma.service.findMany({
              where: { subaccountId, isActive: true },
              select: { id: true, name: true, durationMinutes: true, price: true }
            });
            return services;
          } catch (e: any) {
            return { error: 'Error al obtener servicios', details: e.message };
          }
        },
      },

      getDoctors: {
        description: 'Obtiene los médicos de la sede con su calendarId. Usa ese calendarId al llamar checkAvailability y bookAppointment.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!subaccountId) return { error: 'No hay una sede seleccionada.' };
          try {
            const doctors = await prisma.doctor.findMany({
              where: { subaccountId },
              select: {
                id: true,
                name: true,
                calendars: { select: { id: true, name: true }, take: 1 }
              }
            });
            return doctors.map(d => ({
              id: d.id,
              name: d.name,
              calendarId: d.calendars[0]?.id ?? null,
            }));
          } catch (e: any) {
            return { error: 'Error al obtener médicos', details: e.message };
          }
        },
      },

      addService: {
        description: 'Añade un nuevo servicio al catálogo de la sede.',
        inputSchema: z.object({
          name: z.string().describe('Nombre del servicio (ej: Limpieza Dental).'),
          durationMinutes: z.number().describe('Duración estimada en minutos.'),
          price: z.number().describe('Precio del servicio.'),
        }),
        execute: async ({ name, durationMinutes, price }) => {
          if (!subaccountId) return { error: 'Contexto de sede faltante.' };
          try {
            const service = await prisma.service.create({
              data: { name, durationMinutes, price, subaccountId }
            });
            return { success: true, message: '¡Servicio añadido exitosamente!', service };
          } catch (e: any) {
            return { error: 'Error al crear servicio', details: e.message };
          }
        },
      },

      addDoctor: {
        description: 'Registra un nuevo médico y le crea un calendario automático en esta sede.',
        inputSchema: z.object({
          name: z.string().describe('Nombre completo del médico.'),
        }),
        execute: async ({ name }) => {
          if (!subaccountId) return { error: 'Contexto de sede faltante.' };
          try {
            const doctor = await prisma.doctor.create({
              data: { name, subaccountId }
            });
            // Crear el primer calendario para este médico
            const calendar = await prisma.calendar.create({
              data: { 
                name: `Calendario de ${name}`, 
                subaccountId, 
                doctorId: doctor.id 
              }
            });
            return { success: true, message: `Médico ${name} registrado con su calendario.`, doctor, calendarId: calendar.id };
          } catch (e: any) {
            return { error: 'Error al crear médico', details: e.message };
          }
        },
      },

      searchPatient: {
        description: 'Busca a un paciente por teléfono o nombre en la cuenta actual.',
        inputSchema: z.object({
          phone: z.string().optional().describe('Teléfono del paciente.'),
          name: z.string().optional().describe('Nombre del paciente.'),
        }),
        execute: async ({ phone, name }) => {
          if (!accountId) return { error: 'No hay una cuenta identificada.' };
          try {
            const patient = await prisma.patient.findFirst({
              where: {
                accountId,
                OR: [
                  ...(phone ? [{ phone: phone.toString() }] : []),
                  ...(name ? [{ fullName: { contains: name, mode: 'insensitive' as const } }] : [])
                ]
              },
              include: {
                appointments: {
                  where: { subaccountId, status: { in: ['PENDING', 'CONFIRMED'] } },
                  include: { service: true },
                  take: 3,
                  orderBy: { startTime: 'desc' }
                }
              }
            });
            return patient || { message: 'Paciente no encontrado. Usa bookAppointment para registrarlo al agendar.' };
          } catch (e: any) {
            return { error: 'Error en búsqueda de paciente', details: e.message };
          }
        },
      },

      checkAvailability: {
        description: 'Consulta horarios libres para un día, servicio y médico (calendarId). Pasa el calendarId obtenido de getDoctors.',
        inputSchema: z.object({
          date: z.string().describe('Fecha en formato YYYY-MM-DD'),
          serviceId: z.string().describe('ID del servicio'),
          calendarId: z.string().optional().describe('calendarId del médico (de getDoctors)'),
        }),
        execute: async ({ date, serviceId, calendarId }) => {
          if (!subaccountId) return { error: 'ID de sede no disponible.' };
          try {
            const svc = await prisma.service.findUnique({ where: { id: serviceId }, select: { durationMinutes: true } });
            const slotDuration = svc?.durationMinutes || 60;

            const dayStartUTC = fromZonedTime(`${date}T00:00:00`, PANAMA_TZ);
            const dayEndUTC   = fromZonedTime(`${date}T23:59:59`, PANAMA_TZ);
            const dayOfWeek   = toZonedTime(fromZonedTime(`${date}T12:00:00`, PANAMA_TZ), PANAMA_TZ).getDay();

            // Use calendar-specific rules, fall back to subaccount rules
            let rules = calendarId
              ? await prisma.availabilityRule.findMany({ where: { calendarId, dayOfWeek } })
              : [];
            if (rules.length === 0) {
              rules = await prisma.availabilityRule.findMany({ where: { subaccountId, calendarId: null, dayOfWeek } });
            }
            if (rules.length === 0) return { date, availableSlots: [], message: 'El médico no tiene disponibilidad ese día.' };

            // Appointments blocking this calendar
            const apptWhere: any = {
              status: { notIn: ['CANCELLED'] },
              startTime: { lt: dayEndUTC },
              endTime:   { gt: dayStartUTC },
            };
            if (calendarId) {
              apptWhere.OR = [
                { calendarId },
                { subaccountId, isBlocker: true },
              ];
            } else {
              apptWhere.subaccountId = subaccountId;
            }
            const appts = await prisma.appointment.findMany({ where: apptWhere, select: { startTime: true, endTime: true } });

            const nowUTC = new Date();
            const isToday = date === format(toZonedTime(nowUTC, PANAMA_TZ), 'yyyy-MM-dd');
            const slots: string[] = [];

            for (const rule of rules) {
              let pointer  = fromZonedTime(`${date}T${rule.startTime}:00`, PANAMA_TZ);
              const workEnd = fromZonedTime(`${date}T${rule.endTime}:00`, PANAMA_TZ);
              while (isBefore(pointer, workEnd)) {
                const slotEnd = addMinutes(pointer, slotDuration);
                if (isAfter(slotEnd, workEnd)) break;
                if (isToday && !isAfter(pointer, nowUTC)) { pointer = addMinutes(pointer, slotDuration); continue; }
                const blocking = appts.find(a => isBefore(pointer, a.endTime) && isAfter(slotEnd, a.startTime));
                if (!blocking) {
                  slots.push(formatInTimeZone(pointer, PANAMA_TZ, 'HH:mm'));
                  pointer = addMinutes(pointer, slotDuration);
                } else {
                  pointer = blocking.endTime > pointer ? blocking.endTime : addMinutes(pointer, 15);
                }
              }
            }
            return { date, availableSlots: slots };
          } catch (e: any) {
            return { error: 'Error al consultar disponibilidad.', details: e.message };
          }
        },
      },

      bookAppointment: {
        description: 'Agenda una cita. Requiere calendarId y doctorId del médico (obtenidos de getDoctors) y un horario libre (de checkAvailability).',
        inputSchema: z.object({
          fullName: z.string().describe('Nombre completo del paciente.'),
          phone: z.string().describe('Teléfono de contacto.'),
          email: z.string().optional().describe('Correo electrónico del paciente para enviarle confirmación.'),
          serviceId: z.string().describe('ID del servicio.'),
          calendarId: z.string().describe('calendarId del médico (de getDoctors).'),
          doctorId: z.string().describe('ID del médico (de getDoctors).'),
          startTime: z.string().describe('Inicio de cita en formato local Panama: 2025-06-10T09:00:00 (sin Z).'),
          notes: z.string().optional().describe('Notas o motivo de consulta.'),
        }),
        execute: async ({ fullName, phone, email, serviceId, calendarId, doctorId, startTime, notes }) => {
          if (!subaccountId || !accountId) return { error: 'Contexto incompleto.' };
          try {
            const start = fromZonedTime(startTime.substring(0, 19), PANAMA_TZ);

            // 1. Upsert patient
            let patient = await prisma.patient.findFirst({ where: { phone: phone.toString(), accountId } });
            if (!patient) {
              patient = await prisma.patient.create({
                data: { fullName, phone: phone.toString(), email: email || null, accountId, notes: 'Creado por Asistente IA' }
              });
            } else if (email && !patient.email) {
              patient = await prisma.patient.update({ where: { id: patient.id }, data: { email } });
            }

            // 2. Get service
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            if (!service) return { error: 'Servicio no encontrado.' };

            // 3. Get calendar & doctor name
            const calendar = await prisma.calendar.findUnique({
              where: { id: calendarId },
              include: { doctor: true }
            });
            if (!calendar) return { error: 'Calendario no encontrado. Usa getDoctors para obtener el calendarId correcto.' };

            // Check slot not already taken
            const conflict = await prisma.appointment.findFirst({
              where: {
                status: { notIn: ['CANCELLED'] },
                startTime: { lt: new Date(start.getTime() + service.durationMinutes * 60000) },
                endTime:   { gt: start },
                OR: [{ calendarId }, { subaccountId, isBlocker: true }],
              }
            });
            if (conflict) return { error: 'Ese horario ya está ocupado. Elige otro con checkAvailability.' };

            const end = new Date(start.getTime() + service.durationMinutes * 60000);

            const appointment = await prisma.appointment.create({
              data: {
                patientId: patient.id,
                serviceId: service.id,
                subaccountId,
                calendarId,
                doctorId,
                startTime: start,
                endTime: end,
                totalPrice: service.price,
                status: 'CONFIRMED',
                notes: notes || 'Agendado por Asistente IA',
              }
            });

            // 4. Send confirmation emails
            try {
              const dateStr  = formatInTimeZone(start, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
              const startStr = formatInTimeZone(start, PANAMA_TZ, 'HH:mm');
              const endStr   = formatInTimeZone(end,   PANAMA_TZ, 'HH:mm');

              const patientEmail = email || patient.email;
              if (patientEmail) {
                await sendAppointmentEmail({
                  to: patientEmail,
                  subject: 'Confirmación de tu Cita - Galenus AI',
                  patientName: fullName,
                  serviceName: service.name,
                  date: dateStr,
                  startTime: startStr,
                  endTime: endStr,
                  isOwner: false,
                });
              }

              const account = await prisma.account.findUnique({
                where: { id: accountId },
                include: { users: { where: { role: 'ADMIN' } } }
              });
              for (const user of account?.users ?? []) {
                if (user.email) {
                  await sendAppointmentEmail({
                    to: user.email,
                    subject: 'Nueva Cita Agendada (Asistente IA)',
                    patientName: fullName,
                    serviceName: service.name,
                    date: dateStr,
                    startTime: startStr,
                    endTime: endStr,
                    isOwner: true,
                  });
                }
              }
            } catch (mailErr) {
              console.error('Error enviando correos desde agente:', mailErr);
            }

            return {
              success: true,
              message: `¡Cita confirmada! ${formatInTimeZone(start, PANAMA_TZ, "EEEE d 'de' MMMM")} de ${formatInTimeZone(start, PANAMA_TZ, 'HH:mm')} a ${formatInTimeZone(end, PANAMA_TZ, 'HH:mm')} con Dr(a). ${calendar.doctor.name}.`,
              appointmentId: appointment.id,
            };
          } catch (error: any) {
            console.error('Booking error:', error);
            return { error: 'No se pudo agendar la cita.', details: error.message };
          }
        }
      }
    },
  });

  return result.toTextStreamResponse();
}
