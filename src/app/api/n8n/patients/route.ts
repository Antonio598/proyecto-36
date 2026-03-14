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
