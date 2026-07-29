export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const consultationRecordId = searchParams.get('consultationRecordId');
    const subaccountId = searchParams.get('subaccountId');

    if (!patientId && !consultationRecordId) {
      return NextResponse.json({ error: 'patientId or consultationRecordId required' }, { status: 400 });
    }

    if (patientId) {
      const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
      if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const files = await prisma.medicalFile.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(consultationRecordId ? { consultationRecordId } : {}),
        ...(subaccountId ? { subaccountId } : {}),
      },
      include: { doctor: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching medical files:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
