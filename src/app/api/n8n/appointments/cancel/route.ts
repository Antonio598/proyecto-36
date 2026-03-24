export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone, startTime, id, subaccountId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !startTime) {
      return NextResponse.json({ success: false, error: 'phone and startTime are required' }, { status: 400 });
    }

    phone = phone.replace(/\D/g, '');
    if (!phone) {
       return NextResponse.json({ success: false, error: 'phone must contain at least one numeric digit' }, { status: 400 });
    }

    // 1. Find Patient
    const patient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found based on phone number' }, { status: 404 });
    }

    // 2. Find specific active appointment
    const targetStart = new Date(startTime);
    let whereClause: any = {
      patientId: patient.id,
      startTime: targetStart,
      status: { notIn: ['CANCELLED'] }
    };
    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    const appointment = await prisma.appointment.findFirst({
      where: whereClause
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Active appointment not found for this patient at the specified time' }, { status: 404 });
    }

    // 3. Mark as cancelled
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
      include: {
        patient: { select: { fullName: true, phone: true }},
        service: { select: { name: true }}
      }
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/cancel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

