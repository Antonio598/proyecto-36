export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime } from 'date-fns-tz';

const PANAMA_TZ = 'America/Panama';

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const body = await request.json();
    let { phone, startTime, id, subaccountId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !startTime) {
      return NextResponse.json({ success: false, error: 'phone and startTime are required' }, { status: 400 });
    }

    phone = phone.trim();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone or id must not be empty' }, { status: 400 });
    }

    // 1. Find Patient scoped to this account
    const patient = await prisma.patient.findUnique({
      where: { phone_accountId: { phone, accountId: account.id } },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found based on phone number' }, { status: 404 });
    }

    // 2. Find specific active appointment
    // Change: Interpret startTime as Panama time strictly
    const naiveStartTime = (startTime as string).replace('Z', '').split('+')[0];
    const targetStart = fromZonedTime(naiveStartTime, PANAMA_TZ);
    let whereClause: any = {
      patientId: patient.id,
      startTime: targetStart,
      status: { notIn: ['CANCELLED'] },
    };
    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    const appointment = await prisma.appointment.findFirst({ where: whereClause });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Active appointment not found for this patient at the specified time' }, { status: 404 });
    }

    // 3. Mark as cancelled
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
      include: {
        patient: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/cancel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
