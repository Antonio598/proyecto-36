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

    const phoneClean = phone.toString().trim();

    const contactTime = contactedAt ? new Date(contactedAt) : new Date();
    if (isNaN(contactTime.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid contactedAt date format.' }, { status: 400 });
    }

    // Try to find existing patient by phone in this account
    const patient = await prisma.patient.findUnique({
      where: { phone_accountId: { phone: phoneClean, accountId: account.id } },
    });

    // Find existing ContactLog for this phone+account
    const existing = await (prisma as any).contactLog.findFirst({
      where: { phone: phoneClean, accountId: account.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const updateData: any = { lastSeenAt: contactTime };

      // If log wasn't linked to a patient but now we found one, associate it
      if (!existing.patientId && patient) {
        updateData.patientId = patient.id;
      }

      // Only reset contactedAt if follow-up cycle hasn't started
      if (!existing.followUp1SentAt) {
        updateData.contactedAt = contactTime;
        updateData.isActive = true;
      }

      await (prisma as any).contactLog.update({
        where: { id: existing.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        alreadySaved: true,
        patientName: patient?.fullName ?? null,
        isPatient: !!patient,
        contactedAt: existing.followUp1SentAt
          ? existing.contactedAt.toISOString()
          : contactTime.toISOString(),
        lastSeenAt: contactTime.toISOString(),
      });
    }

    // Create new ContactLog — works with or without a patient
    await (prisma as any).contactLog.create({
      data: {
        phone: phoneClean,
        accountId: account.id,
        patientId: patient?.id ?? null,
        contactedAt: contactTime,
        lastSeenAt: contactTime,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      alreadySaved: false,
      patientName: patient?.fullName ?? null,
      isPatient: !!patient,
      contactedAt: contactTime.toISOString(),
      lastSeenAt: contactTime.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/contact:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
