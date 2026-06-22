export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: { select: { id: true, fullName: true, phone: true, email: true, cedula_pasaporte: true, edad: true } },
        consultationRecord: { select: { id: true, visitDate: true, diagnosis: true, chiefComplaint: true } },
        subaccount: { select: { id: true, name: true } },
      },
    });

    if (!prescription) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: prescription.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { medications, notes, doctorId } = body;

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: existing.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        medications: medications !== undefined ? medications : existing.medications,
        notes: notes !== undefined ? notes : existing.notes,
        doctorId: doctorId !== undefined ? doctorId : existing.doctorId,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: existing.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
