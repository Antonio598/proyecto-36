export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { phone, oldStartTime, newStartTime } = body;

    if (!phone || !oldStartTime || !newStartTime) {
      return NextResponse.json({ success: false, error: 'phone, oldStartTime, and newStartTime are required' }, { status: 400 });
    }

    // 1. Find Patient
    const patient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found based on phone number' }, { status: 404 });
    }

    // 2. Find specific active appointment
    const oldStart = new Date(oldStartTime);
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        startTime: oldStart,
        status: { notIn: ['CANCELLED'] } // Only reschedule active ones
      },
      include: { service: true }
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Active appointment not found for this patient at the old start time' }, { status: 404 });
    }

    // 3. Overlap Check for new time
    const newStart = new Date(newStartTime);
    const newEnd = new Date(newStart.getTime() + appointment.service.durationMinutes * 60000);

    const overlappingAppt = await prisma.appointment.findFirst({
      where: {
        id: { not: appointment.id }, // Ignore self
        status: { notIn: ['CANCELLED'] },
        OR: [
          { startTime: { lt: newEnd }, endTime: { gt: newStart } }
        ]
      }
    });

    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'New time slot overlaps with another appointment' }, { status: 409 });
    }

    // 4. Apply Reschedule
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: newStart,
        endTime: newEnd,
      },
      include: {
        patient: { select: { fullName: true, phone: true }},
        service: { select: { name: true }}
      }
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/reschedule:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

