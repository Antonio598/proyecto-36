export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (phone) {
      const patient = await prisma.patient.findUnique({
        where: { phone },
      });
      return NextResponse.json(patient ? { success: true, data: patient } : { success: false, error: 'Patient not found' });
    }

    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error in n8n/patients GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, email, notes } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'fullName and phone are required' }, { status: 400 });
    }

    // Identificar si existe el paciente primero para evitar duplicados
    const existingPatient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (existingPatient) {
      return NextResponse.json({ success: false, error: 'Patient with this phone already exists', data: existingPatient }, { status: 409 });
    }

    const newPatient = await prisma.patient.create({
      data: {
        fullName,
        phone,
        email,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: newPatient }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/patients POST:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

