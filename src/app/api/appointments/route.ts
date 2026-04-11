export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

import { parseISO, format } from 'date-fns';
import { sendAppointmentEmail } from '@/lib/mail';
import { es } from 'date-fns/locale/es';
export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const dateQuery = searchParams.get('date');
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');

    let whereClause: any = {
      status: { notIn: ['CANCELLED'] }
    };

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (dateQuery) {
      const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);
      whereClause.startTime = { gte: startOfDay, lt: endOfDay };
    }

    if (subaccountId) {
      // Validate ownership
      const sub = await prisma.subaccount.findFirst({
        where: { id: subaccountId, accountId }
      });
      if (!sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      whereClause.subaccountId = subaccountId;
    } else {
      // Scope to this account's subaccounts
      const accountSubaccounts = await prisma.subaccount.findMany({
        where: { accountId },
        select: { id: true },
      });
      whereClause.subaccountId = { in: accountSubaccounts.map(s => s.id) };
    }

    if (calendarId) {
      whereClause.calendarId = calendarId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: { patient: true, service: true },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, serviceId, professionalId, startTime, endTime, notes, status, subaccountId, calendarId, doctorId, isBlocker, repeatCount } = body;

    if (!startTime) {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
    }

    let price = 0;
    let finalDurationMinutes = 30;

    if (!isBlocker) {
      if (!patientId || !serviceId) {
        return NextResponse.json(
          { error: 'patientId and serviceId are required para citas normales' },
          { status: 400 }
        );
      }

      const defaultConfig = await prisma.serviceConfiguration.findFirst({
        where: {
          serviceId,
          ...(calendarId ? { calendarId } : {}),
          ...(subaccountId ? { subaccountId } : {})
        }
      });

      if (defaultConfig) {
        price = defaultConfig.price;
        finalDurationMinutes = defaultConfig.durationMinutes;
      } else {
        const genericService = await prisma.service.findUnique({
          where: { id: serviceId },
        });
        if (!genericService) {
          return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        price = genericService.price;
        finalDurationMinutes = genericService.durationMinutes;
      }
    }

    const naiveLocalTime = startTime.substring(0, 19);
    const { fromZonedTime, toZonedTime } = require('date-fns-tz');
    const start = fromZonedTime(naiveLocalTime, 'America/Panama');
    const panamaDate = toZonedTime(start, 'America/Panama');
    
    let end: Date;
    if (isBlocker) {
      if (!endTime) {
        return NextResponse.json({ error: 'endTime is required for blockers' }, { status: 400 });
      }
      end = fromZonedTime(endTime.substring(0, 19), 'America/Panama');
    } else {
      end = new Date(start.getTime() + finalDurationMinutes * 60000);
    }

    // 1. Fetch AvailabilityRules to enforce the Sede's schedule
    // First try subaccount-level rules, then fall back to calendar-level rules
    const requestedDayOfWeek = panamaDate.getDay();
    let rules = await prisma.availabilityRule.findMany({
       where: {
          subaccountId: subaccountId || undefined,
          calendarId: null,
          dayOfWeek: requestedDayOfWeek
       }
    });

    // Fallback: check calendar-level rules if no subaccount-level rules exist
    if (rules.length === 0 && calendarId) {
      rules = await prisma.availabilityRule.findMany({
        where: {
          calendarId,
          dayOfWeek: requestedDayOfWeek
        }
      });
    }

    // Second fallback: any calendar in this subaccount
    if (rules.length === 0 && subaccountId) {
      const calendarsInSede = await prisma.calendar.findMany({
        where: { subaccountId },
        select: { id: true }
      });
      if (calendarsInSede.length > 0) {
        rules = await prisma.availabilityRule.findMany({
          where: {
            calendarId: { in: calendarsInSede.map(c => c.id) },
            dayOfWeek: requestedDayOfWeek
          }
        });
      }
    }

    if (rules.length === 0 && !isBlocker) {
       return NextResponse.json({ error: 'La clínica está cerrada en este día, no hay horarios disponibles.' }, { status: 400 });
    }

    if (rules.length > 0 && !isBlocker) {
       const rule = rules[0];
       const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
       const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
       const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

       // Both start and end must be within workStart and workEnd
       if (start < workStart || end > workEnd) {
          return NextResponse.json({ error: `El horario debe estar dentro de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
       }
    }

    // Determine how many times to repeat
    const numRepeats = repeatCount ? Math.min(Math.max(parseInt(repeatCount.toString(), 10), 1), 7) : 1;
    let createdCount = 0;
    let mainAppointment = null;

    for (let i = 0; i < numRepeats; i++) {
        const iterStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const iterEnd = new Date(end.getTime() + i * 24 * 60 * 60 * 1000);

        const overlappingWhere: any = {
           status: { notIn: ['CANCELLED'] },
           OR: [
              {
                startTime: { lt: iterEnd },
                endTime: { gt: iterStart },
              }
           ]
        };
        if (calendarId) overlappingWhere.calendarId = calendarId;

        const overlappingAppt = await prisma.appointment.findFirst({
          where: overlappingWhere
        });

        if (overlappingAppt && !isBlocker) {
           // Si no es bloqueador y choca, abortar cita única
           return NextResponse.json(
             { error: 'El espacio está ocupado en el calendario de este médico.' },
             { status: 409 }
           );
        }

        // Si es bloqueador, creamos si no choca contra sí mismo, o lo forzamos.
        // Omitiremos creación si choca contra otra cosa solo si queremos ser estrictos,
        // pero "isBlocker" normalmente pisa el tiempo sin importar qué (salvo que ya esté ocupado).
        // Aqui bloquearemos pase lo que pase para obligar. (A menos que haya otra cita ya ocupándolo)
        // Por seguridad, si ya hay una cita allí, no bloqueamos encima para no romper.
        if (!overlappingAppt || isBlocker) { // block anyway or create event
          const appt = await prisma.appointment.create({
            data: {
              patientId: isBlocker ? undefined : patientId,
              serviceId: isBlocker ? undefined : serviceId,
              professionalId: professionalId || null,
              subaccountId: subaccountId || null,
              calendarId: calendarId || null,
              doctorId: doctorId || null,
              isBlocker: isBlocker || false,
              startTime: iterStart,
              endTime: iterEnd,
              notes,
              totalPrice: price,
              status: status || 'CONFIRMED',
            },
          });
          createdCount++;
          if (i === 0) mainAppointment = appt;
        }
    }

    // --- Enviar correos de notificación ---
    try {
      if (mainAppointment && !isBlocker) {
        // Obtener detalles del paciente, servicio y administradores
        const [fullPatient, fullService] = await Promise.all([
          prisma.patient.findUnique({ where: { id: patientId } }),
          prisma.service.findUnique({ where: { id: serviceId } })
        ]);

        let adminEmails: string[] = [];
        if (mainAppointment.subaccountId) {
          const sub = await prisma.subaccount.findUnique({ 
            where: { id: mainAppointment.subaccountId },
            include: { account: { include: { users: { where: { role: 'ADMIN' } } } } }
          });
          adminEmails = sub?.account?.users.map(u => u.email).filter(Boolean) as string[] || [];
        }

        if (fullPatient && fullService) {
          const dateStr = format(mainAppointment.startTime, "EEEE d 'de' MMMM", { locale: es });
          const startStr = format(mainAppointment.startTime, "HH:mm");
          const endStr = format(mainAppointment.endTime, "HH:mm");

          // 1. Enviar al Paciente si tiene correo
          if (fullPatient.email) {
            await sendAppointmentEmail({
              to: fullPatient.email,
              subject: 'Confirmación de tu Cita - Master Haven',
              patientName: fullPatient.fullName,
              serviceName: fullService.name,
              date: dateStr,
              startTime: startStr,
              endTime: endStr,
              isOwner: false
            });
          }

          // 2. Enviar a los administradores de la cuenta
          for (const email of adminEmails) {
            await sendAppointmentEmail({
              to: email,
              subject: 'Nueva Cita Recibida',
              patientName: fullPatient.fullName,
              serviceName: fullService.name,
              date: dateStr,
              startTime: startStr,
              endTime: endStr,
              isOwner: true
            });
          }
        }
      }
    } catch (mailError) {
      console.error('Error in email notification flow:', mailError);
      // No bloqueamos la respuesta aunque falle el correo
    }

    // Return the primary appointment created (i=0) or success message
    if (numRepeats === 1 && mainAppointment) {
      return NextResponse.json(mainAppointment, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Success', created: createdCount }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
