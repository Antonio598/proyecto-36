import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';

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

  // useChat v6 sends UIMessages (with `parts`); streamText needs ModelMessages (with `content`)
  const coreMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai('gpt-4o'),
    messages: coreMessages,
    system: `Eres el Asistente de Recepción Virtual de la Clínica. Eres amable, profesional y altamente eficiente. 
    Tu trabajo es ayudar a los pacientes a agendar citas médicas, añadir servicios al catálogo, registrar médicos y responder sus dudas de forma inteligente.
    
    INFORMACIÓN DE CONTEXTO ACTUAL:
    - ID de Sede Actual: ${subaccountId || 'No especificado (pide al usuario que seleccione su sede si es necesario, aunque debería venir automático)'}
    - ID de Cuenta: ${accountId || 'No especificado'}

    REGLAS ESTRICTAS:
    1. NUNCA inventes información. Usa getServices para conocer el catálogo real de servicios de esta sede.
    2. Antes de agendar, usa searchPatient para ver si el paciente ya existe por su teléfono.
    3. Si pide un turno, usa SIEMPRE checkAvailability para ver qué horas están libres para el servicio seleccionado.
    4. NUNCA confirmes una cita sin haber usado bookAppointment exitosamente.
    5. Solo puedes gestionar datos de la sede ${subaccountId} y la cuenta ${accountId}.
    6. Sé corto y conciso. Estás en un widget pequeño de chat flotante. Usa un tono servicial.
    7. Al crear un médico, SIEMPRE se le debe asignar un calendario por defecto (el sistema lo hace automáticamente si usas addDoctor).`,

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
        description: 'Obtiene la lista de médicos registrados en la sede actual.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!subaccountId) return { error: 'No hay una sede seleccionada.' };
          try {
            return await prisma.doctor.findMany({
              where: { subaccountId },
              select: { id: true, name: true }
            });
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
        description: 'Consulta los horarios disponibles un día para un servicio y sede específicos.',
        inputSchema: z.object({
          date: z.string().describe('Fecha en formato YYYY-MM-DD'),
          serviceId: z.string().describe('ID del servicio seleccionado'),
        }),
        execute: async ({ date, serviceId }) => {
          if (!subaccountId) return { error: 'ID de sede no disponible.' };
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          try {
            // Pasamos el subaccountId para que la API de disponibilidad filtre correctamente
            const url = `${baseUrl}/api/availability?date=${date}&service_id=${serviceId}&subaccountId=${subaccountId}`;
            const res = await fetch(url);
            if (!res.ok) return { error: 'No se pudo obtener disponibilidad (API error)' };
            const data = await res.json();
            return { date, availableSlots: data.availableSlots };
          } catch (e: any) {
            return { error: 'Error de red al consultar disponibilidad.', details: e.message };
          }
        },
      },

      bookAppointment: {
        description: 'Agenda una nueva cita médica en la sede actual.',
        inputSchema: z.object({
          fullName: z.string().describe('Nombre completo del paciente.'),
          phone: z.string().describe('Teléfono de contacto.'),
          serviceId: z.string().describe('ID del servicio.'),
          startTime: z.string().describe('Inicio de cita (ISO8601 local, ej: 2024-11-20T10:00:00). NO INCLUIR Z.'),
          notes: z.string().optional().describe('Notas o motivo de consulta.'),
        }),
        execute: async ({ fullName, phone, serviceId, startTime, notes }) => {
          if (!subaccountId || !accountId) return { error: 'Contexto incompleto (sede o cuenta faltante).' };
          try {
            const naiveLocalTime = startTime.substring(0, 19); 
            const { fromZonedTime } = require('date-fns-tz');
            const start = fromZonedTime(naiveLocalTime, 'America/Panama');

            // 1. Asegurar Paciente (Scoped by Account)
            let patient = await prisma.patient.findFirst({ 
              where: { phone: phone.toString(), accountId } 
            });

            if (!patient) {
              patient = await prisma.patient.create({
                data: { fullName, phone: phone.toString(), accountId, notes: 'Creado por Asistente IA' }
              });
            }

            // 2. Obtener Servicio
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            if (!service) return { error: 'Servicio no encontrado.' };

            // 3. Buscar Calendario/Médico disponible en esta sede
            // Tomamos el primer calendario activo de la sede por simplicidad
            const calendar = await prisma.calendar.findFirst({ 
              where: { subaccountId },
              include: { doctor: true }
            });

            if (!calendar) return { error: 'No hay calendarios configurados en esta sede para agendar.' };

            const end = new Date(start.getTime() + service.durationMinutes * 60000);
            
            const appointment = await prisma.appointment.create({
              data: {
                patientId: patient.id,
                serviceId: service.id,
                subaccountId,
                calendarId: calendar.id,
                doctorId: calendar.doctorId,
                startTime: start,
                endTime: end,
                totalPrice: service.price,
                status: 'CONFIRMED',
                notes: notes || 'Agendado por Chatbot OpenAI'
              }
            });

            return { success: true, message: '¡Cita confirmada correctamente!', appointment };
          } catch (error: any) {
            console.error('Booking error:', error);
            return { error: 'No se pudo agendar la cita.', details: error.message };
          }
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
