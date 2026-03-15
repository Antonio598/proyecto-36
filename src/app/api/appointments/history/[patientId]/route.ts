export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        service: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
