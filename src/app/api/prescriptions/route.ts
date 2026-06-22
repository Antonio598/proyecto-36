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

    if (!patientId && !consultationRecordId) {
      return NextResponse.json({ error: 'patientId or consultationRecordId required' }, { status: 400 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(consultationRecordId ? { consultationRecordId } : {}),
      },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, fullName: true } },
        consultationRecord: { select: { id: true, visitDate: true, diagnosis: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { patientId, subaccountId, doctorId, consultationRecordId, medications, notes } = body;

    if (!patientId || !subaccountId) {
      return NextResponse.json({ error: 'patientId and subaccountId are required' }, { status: 400 });
    }

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: 'medications array is required and must not be empty' }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        subaccountId,
        doctorId: doctorId || null,
        consultationRecordId: consultationRecordId || null,
        medications,
        notes: notes || null,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, fullName: true } },
        consultationRecord: { select: { id: true, visitDate: true } },
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
