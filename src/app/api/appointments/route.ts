export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get('phone');
    const id = searchParams.get('id');
    phone = (phone || id)?.toString() || null;

    let whereClause = {};

    if (phone) {
      whereClause = {
        patient: {
          phone: phone,
        },
      };
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
    const { patientId, serviceId, professionalId, startTime, notes } = body;

    // Basic Validation
    if (!patientId || !serviceId || !startTime) {
      return NextResponse.json(
        { error: 'patientId, serviceId, and startTime are required' },
        { status: 400 }
      );
    }

    // Get Service details to calculate endTime and totalPrice
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const naiveLocalTime = startTime.substring(0, 19);
    const { fromZonedTime } = require('date-fns-tz');
    const start = fromZonedTime(naiveLocalTime, 'America/Panama');
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Basic Overlap validation check
    const overlappingAppt = await prisma.appointment.findFirst({
      where: {
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          }
        ]
      }
    });

    if (overlappingAppt) {
      return NextResponse.json(
        { error: 'Time slot is already booked or overlaps with an existing appointment.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        serviceId,
        professionalId: professionalId || null,
        startTime: start,
        endTime: end,
        notes,
        totalPrice: service.price,
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

