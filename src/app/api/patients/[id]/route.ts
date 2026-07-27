export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, email, notes, cedula_pasaporte, edad } = body;

    // Check phone uniqueness within the same account
    if (phone) {
      const current = await prisma.patient.findUnique({ where: { id }, select: { accountId: true } });
      if (current?.accountId) {
        const conflict = await prisma.patient.findUnique({
          where: { phone_accountId: { phone, accountId: current.accountId } },
        });
        if (conflict && conflict.id !== id) {
          return NextResponse.json({ error: 'Ya existe otro paciente con ese teléfono' }, { status: 409 });
        }
      }
    }

    const data: any = {};
    if (fullName          !== undefined) data.fullName          = fullName;
    if (phone             !== undefined) data.phone             = phone;
    if (email             !== undefined) data.email             = email || null;
    if (notes             !== undefined) data.notes             = notes || null;
    if (cedula_pasaporte  !== undefined) data.cedula_pasaporte  = cedula_pasaporte || null;
    if (edad              !== undefined) data.edad              = edad ? parseInt(String(edad)) : null;

    const patient = await prisma.patient.update({ where: { id }, data });
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.patient.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
