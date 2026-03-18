export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone, fullName, serviceId, startTime, notes, id } = body;
    phone = phone || id;

    if (!phone || !fullName || !serviceId || !startTime) {
      return NextResponse.json({ success: false, error: 'phone, fullName, serviceId, and startTime are required' }, { status: 400 });
    }

    // 1. Verify Service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ success: false, error: 'Service invalid or inactive' }, { status: 400 });
    }

    // 2. Resolve Patient (Find or Create by Phone)
    let patient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          phone,
          fullName,
          notes: 'Auto-created via n8n integration',
        }
      });
    }

    const naiveLocalTime = startTime.substring(0, 19);
    const { fromZonedTime } = require('date-fns-tz');
    const start = fromZonedTime(naiveLocalTime, 'America/Panama');
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // 3. Overlap Check
    const overlappingAppt = await prisma.appointment.findFirst({
      where: {
        status: { notIn: ['CANCELLED'] },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } }
        ]
      }
    });

    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'Time slot is already booked.' }, { status: 409 });
    }

    // 4. Create Appt
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        serviceId: service.id,
        startTime: start,
        endTime: end,
        notes: notes || null,
        totalPrice: service.price,
      },
      include: {
        patient: { select: { fullName: true, phone: true }},
        service: { select: { name: true }}
      }
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/appointments/book:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

