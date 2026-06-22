export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const record = await prisma.consultationRecord.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true, phone: true, email: true, cedula_pasaporte: true, edad: true } },
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, startTime: true, service: { select: { name: true } } } },
        prescriptions: {
          include: { doctor: { select: { id: true, name: true } } },
          orderBy: { issuedAt: 'desc' },
        },
        medicalFiles: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify account ownership via patient
    const patient = await prisma.patient.findFirst({ where: { id: record.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { chiefComplaint, diagnosis, observations, treatmentPlan, visitDate, doctorId, isVirtual } = body;

    const existing = await prisma.consultationRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: existing.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.consultationRecord.update({
      where: { id },
      data: {
        chiefComplaint: chiefComplaint !== undefined ? chiefComplaint : existing.chiefComplaint,
        diagnosis: diagnosis !== undefined ? diagnosis : existing.diagnosis,
        observations: observations !== undefined ? observations : existing.observations,
        treatmentPlan: treatmentPlan !== undefined ? treatmentPlan : existing.treatmentPlan,
        visitDate: visitDate ? new Date(visitDate) : existing.visitDate,
        doctorId: doctorId !== undefined ? doctorId : existing.doctorId,
        isVirtual: isVirtual !== undefined ? isVirtual : existing.isVirtual,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        prescriptions: true,
        medicalFiles: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating consultation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.consultationRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: existing.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.consultationRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
