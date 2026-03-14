import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-pro'),
    messages,
    system: `Eres el Asistente de Recepción Virtual de la Clínica. Eres amable, profesional y altamente eficiente. 
Tu trabajo es ayudar a los pacientes a agendar citas médicas, responder sus dudas sobre los servicios, o verificar si una cita existe.

REGLAS ESTRICTAS QUE DEBES OBEDECER:
1. NUNCA inventes información (no alucines precios, doctores ni servicios). Usa \`getServices\` para conocer el catálogo real de la clínica antes de ofrecer servicios.
2. Si el usuario pide agendar o buscar algo, \`searchPatient\` primero para encontrarlo por nombre o teléfono si te lo dan.
3. Si el paciente pide un turno, usa SIEMPRE \`checkAvailability\` para ver qué horas están libres ESE día, o pregúntale qué fecha busca.
4. NUNCA confirmes una cita sin haber usado la herramienta \`bookAppointment\`. Debes pedirle al usuario su: Nombre completo, Teléfono, Servicio deseado y Fecha/hora antes de llamar la función.
5. Sé corto y conciso en tus respuestas. Estás en un widget pequeño de chat flotante.`,
    
    tools: {
      getServices: tool({
        description: 'Obtiene la lista completa de servicios activos en la clínica, incluyendo su ID, nombre, descripción, duración y precio.',
        parameters: z.object({}),
        execute: async () => {
          const services = await prisma.service.findMany({
            where: { isActive: true },
            select: { id: true, name: true, durationMinutes: true, price: true }
          });
          return services as any;
        },
      }),

      searchPatient: tool({
        description: 'Busca a un paciente en la base de datos por su número de teléfono o nombre. Útil para verificar si ya está registrado o sus citas pendientes.',
        parameters: z.object({
          phone: z.string().optional().describe('El número de teléfono del paciente (10 dígitos).'),
          name: z.string().optional().describe('El nombre completo o parcial del paciente.'),
        }),
        execute: async ({ phone, name }: { phone?: string; name?: string }) => {
          if (!phone && !name) return { error: 'Debes proveer al menos teléfono o nombre.' };
          
          const patient = await prisma.patient.findFirst({
            where: {
              ...(phone ? { phone } : {}),
              ...(name ? { fullName: { contains: name, mode: 'insensitive' } } : {})
            },
            include: {
              appointments: {
                where: { status: { in: ['PENDING', 'CONFIRMED'] } },
                include: { service: true }
              }
            }
          });
          
          return (patient ? patient : { message: 'Paciente no encontrado, deberás crearlo (no te preocupes, bookAppointment lo crea automáticamente si no existe).' }) as any;
        },
      }),

      checkAvailability: tool({
        description: 'Obtiene las horas de turno (citas) que están disponibles en un día específico para que se lo ofrezcas al usuario.',
        parameters: z.object({
          date: z.string().describe('Fecha a consultar en formato YYYY-MM-DD. Ej: "2024-11-20"'),
          serviceId: z.string().describe('El ID del servicio escogido por el paciente.'),
        }),
        execute: async ({ date, serviceId }: { date: string; serviceId: string }) => {
          // LLamamos a la lógica nativa del endpoint interno pero de lado del servidor para reusabilidad exacta.
          // Como los headers y Request son abstractos, simularemos un URL fetch interno rápido.
          const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL ? \`https://\${process.env.NEXT_PUBLIC_VERCEL_URL}\` : 'http://localhost:3000';
          try {
             const res = await fetch(\`\${baseUrl}/api/availability?date=\${date}&service_id=\${serviceId}\`);
             if (!res.ok) return { error: 'No se pudo obtener disponibilidad' };
             const data = await res.json();
             return { date, availableSlots: data.availableSlots } as any;
          } catch(e) {
             console.log(e)
             return { error: 'Error del servidor al buscar turnos.' } as any;
          }
        },
      }),

      bookAppointment: tool({
         description: 'Programa y guarda la cita finalmente en la base de datos. Requiere toda la información del paciente y la cita.',
         parameters: z.object({
           fullName: z.string().describe('Nombre completo del paciente.'),
           phone: z.string().describe('Número de teléfono del paciente (obligatorio).'),
           serviceId: z.string().describe('El ID de base de datos del servicio escogido.'),
           startTime: z.string().describe('Fecha y hora exactas de inicio de la cita en formato ISO8601 (ej. "2024-11-20T10:00:00.000Z"). Debe estar ya calculada base 0 UTC.'),
           notes: z.string().optional().describe('Cualquier nota adicional que el paciente te haya mencionado.'),
         }),
         execute: async ({ fullName, phone, serviceId, startTime, notes }: { fullName: string; phone: string; serviceId: string; startTime: string; notes?: string }) => {
           // Usamos la logica transaccional nativa
           try {
             const start = new Date(startTime);
             
             // 1. Validar y Crear Paciente
             let patient = await prisma.patient.findUnique({ where: { phone } });
             if (!patient) {
               patient = await prisma.patient.create({
                 data: { fullName, phone, notes: 'Creado vía IA Chatbot' }
               });
             }

             // 2. Obtener Duración
             const service = await prisma.service.findUnique({ where: { id: serviceId }});
             if (!service) return { error: 'Servicio no encontrado' };

             // 3. Crear cita
             const end = new Date(start.getTime() + service.durationMinutes * 60000);
             const appointment = await prisma.appointment.create({
               data: {
                 patientId: patient.id,
                 serviceId: service.id,
                 startTime: start,
                 endTime: end,
                 totalPrice: service.price,
                 status: 'CONFIRMED', // Las del chatbot son automáticas
                 notes: notes || 'Agendado por IA'
               }
             });

             return { success: true, message: '¡Cita confirmada en la base de datos!', appointment } as any;
           } catch (error: any) {
             console.error('Bot booking error:', error);
             return { error: 'La cita fue rechazada por la base de datos.', details: error.message } as any;
           }
         }
      })
    },
    maxSteps: 5, // Permitirá a la IA hacer chain of thought con múltiples herramientas antes de responder
  });

  return result.toDataStreamResponse();
}
