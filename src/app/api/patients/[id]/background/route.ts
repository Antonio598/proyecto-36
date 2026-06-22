export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const background = await prisma.patientBackground.findFirst({
      where: {
        patientId,
        ...(subaccountId ? { subaccountId } : {}),
      },
    });

    return NextResponse.json(background || null);
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: patientId } = await params;
    const body = await request.json();
    const { subaccountId, bloodType, allergies, chronicConditions, surgicalHistory, familyHistory, currentMedications } = body;

    if (!subaccountId) return NextResponse.json({ error: 'subaccountId is required' }, { status: 400 });

    const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const background = await prisma.patientBackground.upsert({
      where: { patientId_subaccountId: { patientId, subaccountId } },
      update: {
        bloodType: bloodType ?? undefined,
        allergies: allergies ?? undefined,
        chronicConditions: chronicConditions ?? undefined,
        surgicalHistory: surgicalHistory ?? undefined,
        familyHistory: familyHistory ?? undefined,
        currentMedications: currentMedications ?? undefined,
      },
      create: {
        patientId,
        subaccountId,
        bloodType: bloodType || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        surgicalHistory: surgicalHistory || null,
        familyHistory: familyHistory || null,
        currentMedications: currentMedications || null,
      },
    });

    return NextResponse.json(background);
  } catch (error) {
    console.error('Error saving background:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
