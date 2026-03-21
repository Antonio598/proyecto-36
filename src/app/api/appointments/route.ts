export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    let phone = searchParams.get('phone');
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');
    
    phone = (phone || id)?.toString() || null;

    let whereClause: any = {};

    if (phone) {
      whereClause.patient = { phone };
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
        professional: {
          select: { id: true, name: true, email: true },
        },
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
    const { patientId, serviceId, professionalId, startTime, endTime, notes, status, subaccountId, calendarId, doctorId, isBlocker } = body;

    if (!startTime) {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
    }

    let price = 0;
    let finalDurationMinutes = 30;

    if (!isBlocker) {
      if (!patientId || !serviceId) {
        return NextResponse.json(
          { error: 'patientId and serviceId are required for regular appointments' },
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

    const overlappingWhere: any = {
       status: { notIn: ['CANCELLED'] },
       OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          }
       ]
    };
    if (calendarId) overlappingWhere.calendarId = calendarId;

    const overlappingAppt = await prisma.appointment.findFirst({
      where: overlappingWhere
    });

    if (overlappingAppt) {
      return NextResponse.json(
        { error: 'El espacio está ocupado en el calendario de este médico.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: isBlocker ? undefined : patientId,
        serviceId: isBlocker ? undefined : serviceId,
        professionalId: professionalId || null,
        subaccountId: subaccountId || null,
        calendarId: calendarId || null,
        doctorId: doctorId || null,
        isBlocker: isBlocker || false,
        startTime: start,
        endTime: end,
        notes,
        totalPrice: price,
        status: status || 'CONFIRMED',
      },
      include: {
        patient: true,
        service: true,
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
