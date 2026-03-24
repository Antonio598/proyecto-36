export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get('phone');
    const id = searchParams.get('id');
    phone = (phone || id)?.toString() || null;

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
    let { fullName, phone, email, notes, id, cedula_pasaporte, edad } = body;
    phone = (phone || id)?.toString();

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'fullName and phone are required' }, { status: 400 });
    }

    phone = phone.trim();
    if (!phone) {
       return NextResponse.json({ success: false, error: 'phone or id must not be empty' }, { status: 400 });
    }

    const patientData = {
      fullName,
      phone,
      email: email || null,
      notes: notes || null,
      cedula_pasaporte: cedula_pasaporte || null,
      edad: edad ? parseInt(edad, 10) : null,
    };

    // Upsert para crear o actualizar basándose en el num. de teléfono
    const patient = await prisma.patient.upsert({
      where: { phone },
      update: {
         ...patientData,
         // Prevenir sobrescribir con null si no lo enviaron y ya existe:
         fullName: patientData.fullName,
         email: patientData.email !== null ? patientData.email : undefined,
         notes: patientData.notes !== null ? patientData.notes : undefined,
         cedula_pasaporte: patientData.cedula_pasaporte !== null ? patientData.cedula_pasaporte : undefined,
         edad: patientData.edad !== null ? patientData.edad : undefined,
      },
      create: patientData,
    });

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/patients POST:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
