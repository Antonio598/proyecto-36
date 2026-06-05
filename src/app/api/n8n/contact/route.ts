export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, contactedAt } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { phone_accountId: { phone: phone.toString().trim(), accountId: account.id } },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found for this phone and account.' }, { status: 404 });
    }

    const contactTime = contactedAt ? new Date(contactedAt) : new Date();
    if (isNaN(contactTime.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid contactedAt date format.' }, { status: 400 });
    }

    // Deactivate previous active logs for this patient
    await (prisma as any).contactLog.updateMany({
      where: { patientId: patient.id, isActive: true },
      data: { isActive: false },
    });

    // Create new active log
    await (prisma as any).contactLog.create({
      data: {
        patientId: patient.id,
        accountId: account.id,
        contactedAt: contactTime,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, patientName: patient.fullName, contactedAt: contactTime.toISOString() }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/contact:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
