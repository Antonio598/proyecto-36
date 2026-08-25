import { openai } from '@ai-sdk/openai';
import { streamText, stepCountIs } from 'ai';
import { z } from 'zod';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addMinutes, isBefore, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import prisma from '@/lib/prisma';
import { sendAppointmentEmail } from '@/lib/mail';

const PANAMA_TZ = 'America/Panama';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    stopWhen: stepCountIs(15),
    system: `Eres el Asistente de Recepción Virtual de la Clínica. Eres amable, profesional y altamente eficiente.

    CONTEXTO:
    - Fecha y hora actual (Panamá): ${new Date().toLocaleString('es-PA', { timeZone: 'America/Panama', dateStyle: 'full', timeStyle: 'short' })}
    - Fecha ISO hoy: ${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Panama' })}
    - Sede actual: ${subaccountId}
    - Cuenta: ${accountId}

    FLUJO OBLIGATORIO PARA AGENDAR:
    1. Recopila del usuario: nombre, teléfono, correo (opcional), servicio deseado y fecha preferida.
    2. Cuando tengas todos esos datos, llama en este orden:
       a. searchPatient (con teléfono o nombre)
       b. getServices → obtén el serviceId exacto del servicio solicitado
       c. getDoctors → obtén el calendarId del médico adecuado
       d. checkAvailability (SIEMPRE pasa el calendarId del médico, NUNCA lo omitas)
       e. Muestra los horarios disponibles al usuario y espera que elija uno
       f. bookAppointment con el horario elegido
    3. NO llames ninguna tool hasta tener nombre, teléfono, servicio y fecha. Si falta algo, PREGUNTA al usuario primero.

    FLUJO PARA EDITAR/CANCELAR/REAGENDAR:
    1. Pide el nombre o teléfono del paciente.
    2. Llama searchPatient, luego la tool correspondiente.

    REGLAS CRÍTICAS:
    - checkAvailability: el parámetro calendarId es OBLIGATORIO. Siempre pásalo desde getDoctors.
    - SIEMPRE genera una respuesta de texto visible al usuario después de cada tool call.
    - Si una tool falla, informa al usuario con texto y detente.
    - Solo gestiona datos de sede ${subaccountId} y cuenta ${accountId}.
    - Respuestas cortas y directas. Widget pequeño.`,

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
          serviceId: z.string().describe('ID del servicio (de getServices)'),
          calendarId: z.string().describe('calendarId del médico (de getDoctors). OBLIGATORIO.'),
        }),
        execute: async ({ date, serviceId, calendarId }) => {
          console.log('[checkAvailability]', { date, serviceId, calendarId, subaccountId });
          if (!subaccountId) return { error: 'ID de sede no disponible.' };
          try {
            const svc = await prisma.service.findUnique({ where: { id: serviceId }, select: { durationMinutes: true } });
            const slotDuration = svc?.durationMinutes || 60;

            const dayStartUTC = fromZonedTime(`${date}T00:00:00`, PANAMA_TZ);
            const dayEndUTC   = fromZonedTime(`${date}T23:59:59`, PANAMA_TZ);
            const dayOfWeek   = toZonedTime(fromZonedTime(`${date}T12:00:00`, PANAMA_TZ), PANAMA_TZ).getDay();

            // Smart fallback: calendar with own rules → closed on missing days.
            // Calendar with zero rules → inherit subaccount schedule.
            const calendarHasOwnRules = await prisma.availabilityRule.count({ where: { calendarId } }) > 0;
            let rules = await prisma.availabilityRule.findMany({ where: { calendarId, dayOfWeek } });
            if (rules.length === 0 && !calendarHasOwnRules) {
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
                { calendarId, subaccountId },
                { subaccountId, isBlocker: true, calendarId: null },
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
                OR: [{ calendarId, subaccountId }, { subaccountId, isBlocker: true, calendarId: null }],
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

            // 4. Send confirmation emails (fire-and-forget para no bloquear la respuesta)
            (async () => {
              try {
                const sede = await prisma.subaccount.findUnique({ where: { id: subaccountId }, select: { name: true } });
                const sedeName   = sede?.name;
                const doctorName = calendar.doctor?.name;
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
                    sedeName,
                    doctorName,
                    date: dateStr,
                    startTime: startStr,
                    endTime: endStr,
                    isOwner: false,
                  });
                }

                const account = await prisma.account.findUnique({
                  where: { id: accountId },
                  include: { users: { where: { role: { in: ['ADMIN', 'RECEPTIONIST'] } } } }
                });
                for (const user of account?.users ?? []) {
                  if (user.email) {
                    await sendAppointmentEmail({
                      to: user.email,
                      subject: 'Nueva Cita Agendada (Asistente IA)',
                      patientName: fullName,
                      serviceName: service.name,
                      sedeName,
                      doctorName,
                      date: dateStr,
                      startTime: startStr,
                      endTime: endStr,
                      isOwner: true,
                    });
                  }
                }
              } catch (mailErr) {
                console.error('[mail] Error enviando correos desde agente:', mailErr);
              }
            })();

            return {
              success: true,
              message: `¡Cita confirmada! ${formatInTimeZone(start, PANAMA_TZ, "EEEE d 'de' MMMM")} de ${formatInTimeZone(start, PANAMA_TZ, 'HH:mm')} a ${formatInTimeZone(end, PANAMA_TZ, 'HH:mm')} con Dr(a). ${calendar.doctor?.name ?? 'el doctor'}.`,
              appointmentId: appointment.id,
            };
          } catch (error: any) {
            console.error('Booking error:', error);
            return { error: 'No se pudo agendar la cita.', details: error.message };
          }
        }
      },

      updatePatient: {
        description: 'Edita los datos de un paciente existente (nombre, teléfono, email, cédula, edad, notas). Usa searchPatient primero para obtener el id.',
        inputSchema: z.object({
          patientId: z.string().describe('ID del paciente (de searchPatient).'),
          fullName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          cedula_pasaporte: z.string().optional(),
          edad: z.number().optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ patientId, fullName, phone, email, cedula_pasaporte, edad, notes }) => {
          try {
            const data: any = {};
            if (fullName !== undefined) data.fullName = fullName;
            if (phone !== undefined) data.phone = phone;
            if (email !== undefined) data.email = email;
            if (cedula_pasaporte !== undefined) data.cedula_pasaporte = cedula_pasaporte;
            if (edad !== undefined) data.edad = edad;
            if (notes !== undefined) data.notes = notes;

            if (Object.keys(data).length === 0) return { error: 'No se proporcionaron campos para actualizar.' };

            const updated = await prisma.patient.update({
              where: { id: patientId },
              data,
              select: { id: true, fullName: true, phone: true, email: true, cedula_pasaporte: true, edad: true, notes: true }
            });
            return { success: true, message: 'Paciente actualizado correctamente.', patient: updated };
          } catch (e: any) {
            return { error: 'Error al actualizar paciente.', details: e.message };
          }
        },
      },

      getPatientAppointments: {
        description: 'Obtiene las citas activas (pendientes y confirmadas) de un paciente.',
        inputSchema: z.object({
          patientId: z.string().describe('ID del paciente (de searchPatient).'),
        }),
        execute: async ({ patientId }) => {
          try {
            const appts = await prisma.appointment.findMany({
              where: {
                patientId,
                subaccountId,
                status: { notIn: ['CANCELLED'] },
              },
              include: { service: { select: { name: true } }, doctor: { select: { name: true } } },
              orderBy: { startTime: 'asc' },
              take: 10,
            });
            return appts.map(a => ({
              id: a.id,
              status: a.status,
              service: a.service?.name,
              doctor: a.doctor?.name,
              startTime: formatInTimeZone(a.startTime, PANAMA_TZ, "yyyy-MM-dd HH:mm"),
              endTime:   formatInTimeZone(a.endTime,   PANAMA_TZ, "HH:mm"),
              notes: a.notes,
            }));
          } catch (e: any) {
            return { error: 'Error al obtener citas.', details: e.message };
          }
        },
      },

      cancelAppointment: {
        description: 'Cancela una cita. Usa getPatientAppointments para obtener el appointmentId.',
        inputSchema: z.object({
          appointmentId: z.string().describe('ID de la cita a cancelar.'),
        }),
        execute: async ({ appointmentId }) => {
          try {
            const appt = await prisma.appointment.update({
              where: { id: appointmentId },
              data: { status: 'CANCELLED' },
              include: {
                patient:    { select: { fullName: true, email: true } },
                service:    { select: { name: true } },
                subaccount: { select: { name: true } },
                doctor:     { select: { name: true } },
              }
            });

            (async () => {
              try {
                const sedeName   = appt.subaccount?.name;
                const doctorName = appt.doctor?.name;
                const dateStr  = formatInTimeZone(appt.startTime, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
                const startStr = formatInTimeZone(appt.startTime, PANAMA_TZ, 'HH:mm');
                const endStr   = formatInTimeZone(appt.endTime,   PANAMA_TZ, 'HH:mm');
                if (appt.patient?.email) {
                  await sendAppointmentEmail({ to: appt.patient.email, subject: 'Cita Cancelada - Galenus AI', patientName: appt.patient.fullName, serviceName: appt.service?.name || '', sedeName, doctorName, date: dateStr, startTime: startStr, endTime: endStr, isOwner: false, type: 'CANCEL' });
                }
                const account = await prisma.account.findUnique({ where: { id: accountId }, include: { users: { where: { role: { in: ['ADMIN', 'RECEPTIONIST'] } } } } });
                for (const u of account?.users ?? []) {
                  if (u.email) await sendAppointmentEmail({ to: u.email, subject: 'Cita Cancelada', patientName: appt.patient?.fullName || '', serviceName: appt.service?.name || '', sedeName, doctorName, date: dateStr, startTime: startStr, endTime: endStr, isOwner: true, type: 'CANCEL' });
                }
              } catch {}
            })();

            return { success: true, message: 'Cita cancelada correctamente.' };
          } catch (e: any) {
            return { error: 'Error al cancelar cita.', details: e.message };
          }
        },
      },

      rescheduleAppointment: {
        description: 'Reagenda una cita a un nuevo horario. Verifica disponibilidad con checkAvailability antes de llamar esta función.',
        inputSchema: z.object({
          appointmentId: z.string().describe('ID de la cita (de getPatientAppointments).'),
          newStartTime: z.string().describe('Nuevo inicio en formato local Panama: 2025-06-10T09:00:00 (sin Z).'),
        }),
        execute: async ({ appointmentId, newStartTime }) => {
          try {
            const appt = await prisma.appointment.findUnique({
              where: { id: appointmentId },
              include: {
                service:    true,
                patient:    { select: { fullName: true, email: true } },
                subaccount: { select: { name: true } },
                doctor:     { select: { name: true } },
              }
            });
            if (!appt) return { error: 'Cita no encontrada.' };

            const newStart = fromZonedTime(newStartTime.substring(0, 19), PANAMA_TZ);
            const duration = appt.endTime.getTime() - appt.startTime.getTime();
            const newEnd   = new Date(newStart.getTime() + duration);

            const conflict = await prisma.appointment.findFirst({
              where: {
                id: { not: appointmentId },
                status: { notIn: ['CANCELLED'] },
                startTime: { lt: newEnd },
                endTime:   { gt: newStart },
                OR: [{ calendarId: appt.calendarId }, { subaccountId, isBlocker: true }],
              }
            });
            if (conflict) return { error: 'Ese horario ya está ocupado.' };

            await prisma.appointment.update({
              where: { id: appointmentId },
              data: { startTime: newStart, endTime: newEnd },
            });

            (async () => {
              try {
                const sedeName   = appt.subaccount?.name;
                const doctorName = appt.doctor?.name;
                const dateStr  = formatInTimeZone(newStart, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
                const startStr = formatInTimeZone(newStart, PANAMA_TZ, 'HH:mm');
                const endStr   = formatInTimeZone(newEnd,   PANAMA_TZ, 'HH:mm');
                if (appt.patient?.email) {
                  await sendAppointmentEmail({ to: appt.patient.email, subject: 'Cita Reagendada - Galenus AI', patientName: appt.patient.fullName, serviceName: appt.service?.name || '', sedeName, doctorName, date: dateStr, startTime: startStr, endTime: endStr, isOwner: false, type: 'RESCHEDULE' });
                }
                const account = await prisma.account.findUnique({ where: { id: accountId }, include: { users: { where: { role: { in: ['ADMIN', 'RECEPTIONIST'] } } } } });
                for (const u of account?.users ?? []) {
                  if (u.email) await sendAppointmentEmail({ to: u.email, subject: 'Cita Reagendada', patientName: appt.patient?.fullName || '', serviceName: appt.service?.name || '', sedeName, doctorName, date: dateStr, startTime: startStr, endTime: endStr, isOwner: true, type: 'RESCHEDULE' });
                }
              } catch {}
            })();

            return { success: true, message: `Cita reagendada para el ${formatInTimeZone(newStart, PANAMA_TZ, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}.` };
          } catch (e: any) {
            return { error: 'Error al reagendar.', details: e.message };
          }
        },
      },
    },
  });

  return result.toTextStreamResponse();
}
