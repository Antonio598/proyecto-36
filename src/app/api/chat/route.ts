import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),
    messages,
    system: 'Eres el Asistente de Recepción Virtual de la Clínica. Eres amable, profesional y altamente eficiente. Tu trabajo es ayudar a los pacientes a agendar citas médicas, responder sus dudas sobre los servicios, o verificar si una cita existe.\n\nREGLAS ESTRICTAS:\n1. NUNCA inventes información. Usa getServices para conocer el catálogo real.\n2. Si el usuario pide agendar o buscar algo, usa searchPatient primero.\n3. Si pide un turno, usa SIEMPRE checkAvailability para ver qué horas están libres.\n4. NUNCA confirmes una cita sin haber usado bookAppointment. Pídele: Nombre completo, Teléfono, Servicio deseado y Fecha/hora.\n5. Sé corto y conciso. Estás en un widget pequeño de chat flotante.',

    tools: {
      getServices: {
        description: 'Obtiene la lista completa de servicios activos en la clínica.',
        inputSchema: z.object({}),
        execute: async () => {
          const services = await prisma.service.findMany({
            where: { isActive: true },
            select: { id: true, name: true, durationMinutes: true, price: true }
          });
          return services;
        },
      },

      searchPatient: {
        description: 'Busca a un paciente por teléfono o nombre.',
        inputSchema: z.object({
          phone: z.string().optional().describe('Teléfono del paciente.'),
          name: z.string().optional().describe('Nombre completo o parcial del paciente.'),
        }),
        execute: async ({ phone, name }: { phone?: string; name?: string }) => {
          if (!phone && !name) return { error: 'Debes proveer al menos teléfono o nombre.' };

          const patient = await prisma.patient.findFirst({
            where: {
              ...(phone ? { phone } : {}),
              ...(name ? { fullName: { contains: name, mode: 'insensitive' as const } } : {})
            },
            include: {
              appointments: {
                where: { status: { in: ['PENDING', 'CONFIRMED'] } },
                include: { service: true }
              }
            }
          });

          return patient || { message: 'Paciente no encontrado. bookAppointment lo crea automáticamente.' };
        },
      },

      checkAvailability: {
        description: 'Consulta horarios disponibles para un día específico.',
        inputSchema: z.object({
          date: z.string().describe('Fecha en formato YYYY-MM-DD'),
          serviceId: z.string().describe('ID del servicio escogido'),
        }),
        execute: async ({ date, serviceId }: { date: string; serviceId: string }) => {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          try {
            const url = baseUrl + '/api/availability?date=' + date + '&service_id=' + serviceId;
            const res = await fetch(url);
            if (!res.ok) return { error: 'No se pudo obtener disponibilidad' };
            const data = await res.json();
            return { date, availableSlots: data.availableSlots };
          } catch (e) {
            console.log(e);
            return { error: 'Error del servidor al buscar turnos.' };
          }
        },
      },

      bookAppointment: {
        description: 'Programa y guarda la cita en la base de datos.',
        inputSchema: z.object({
          fullName: z.string().describe('Nombre completo del paciente.'),
          phone: z.string().describe('Teléfono del paciente.'),
          serviceId: z.string().describe('ID del servicio escogido.'),
          startTime: z.string().describe('Inicio de la cita en ISO8601 (ej. 2024-11-20T10:00:00.000Z).'),
          notes: z.string().optional().describe('Notas adicionales.'),
        }),
        execute: async ({ fullName, phone, serviceId, startTime, notes }: { fullName: string; phone: string; serviceId: string; startTime: string; notes?: string }) => {
          try {
            const start = new Date(startTime);

            let patient = await prisma.patient.findUnique({ where: { phone } });
            if (!patient) {
              patient = await prisma.patient.create({
                data: { fullName, phone, notes: 'Creado vía IA Chatbot' }
              });
            }

            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            if (!service) return { error: 'Servicio no encontrado' };

            const end = new Date(start.getTime() + service.durationMinutes * 60000);
            const appointment = await prisma.appointment.create({
              data: {
                patientId: patient.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
                totalPrice: service.price,
                status: 'CONFIRMED',
                notes: notes || 'Agendado por IA'
              }
            });

            return { success: true, message: 'Cita confirmada!', appointment };
          } catch (error: any) {
            console.error('Bot booking error:', error);
            return { error: 'La cita fue rechazada.', details: error.message };
          }
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
