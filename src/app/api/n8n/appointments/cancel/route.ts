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
    // Robust date parsing (detect UTC 'Z' or offset, otherwise fallback to Panama local)
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('Z') || /[\+\-]\d{2}:\d{2}$/.test(dateStr)) {
        return new Date(dateStr);
      }
      return fromZonedTime(dateStr.substring(0, 19), PANAMA_TZ);
    };

    const targetStart = parseDate(startTime);
    if (!targetStart) return NextResponse.json({ success: false, error: 'Invalid startTime' }, { status: 400 });

    // Use a 5-minute window centered on the target time to be extremely robust
    const rangeStart = new Date(targetStart.getTime() - 5 * 60000);
    const rangeEnd = new Date(targetStart.getTime() + 5 * 60000);

    // IMPORTANT: We REMOVE the subaccountId filter from the search phase
    // because n8n might send the wrong subaccountId for the existing appointment.
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        startTime: { gte: rangeStart, lte: rangeEnd },
        status: { notIn: ['CANCELLED'] },
      },
      orderBy: { startTime: 'asc' }
    });

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
