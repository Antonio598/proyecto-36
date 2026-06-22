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
    const subaccountId = searchParams.get('subaccountId');

    if (!patientId && !subaccountId) {
      return NextResponse.json({ error: 'patientId or subaccountId required' }, { status: 400 });
    }

    // Validate patient belongs to this account
    if (patientId) {
      const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
      if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const records = await prisma.consultationRecord.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(subaccountId ? { subaccountId } : {}),
      },
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, startTime: true, service: { select: { name: true } } } },
        prescriptions: { select: { id: true, issuedAt: true } },
        medicalFiles: { select: { id: true, fileName: true, fileType: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { patientId, subaccountId, doctorId, appointmentId, visitDate, chiefComplaint, diagnosis, observations, treatmentPlan, isVirtual } = body;

    if (!patientId || !subaccountId) {
      return NextResponse.json({ error: 'patientId and subaccountId are required' }, { status: 400 });
    }

    // Validate patient belongs to this account
    const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const record = await prisma.consultationRecord.create({
      data: {
        patientId,
        subaccountId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        chiefComplaint: chiefComplaint || null,
        diagnosis: diagnosis || null,
        observations: observations || null,
        treatmentPlan: treatmentPlan || null,
        isVirtual: isVirtual || false,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, startTime: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
