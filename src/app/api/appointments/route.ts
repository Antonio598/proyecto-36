export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateQuery = searchParams.get('date');
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');

    let whereClause: any = {
      status: { notIn: ['CANCELLED'] } // Only active by default
    };

    if (dateQuery) {
      const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);
      whereClause.startTime = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }
    
    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }
    
    if (calendarId) {
      whereClause.calendarId = calendarId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        service: true,
      },
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
    const { fromZonedTime } = require('date-fns-tz');
    const start = fromZonedTime(naiveLocalTime, 'America/Panama');
    
    let end: Date;
    if (isBlocker) {
      if (!endTime) {
        return NextResponse.json({ error: 'endTime is required for blockers' }, { status: 400 });
      }
      end = fromZonedTime(endTime.substring(0, 19), 'America/Panama');
    } else {
      end = new Date(start.getTime() + finalDurationMinutes * 60000);
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
