import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    const patientId = params.patientId;

    const history = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        service: {
          select: { name: true, price: true, colorCode: true }
        },
        professional: {
          select: { name: true }
        }
      },
      orderBy: { startTime: 'desc' },
    });

    // Calculate Lifetime Value
    const totalSpent = history
      .filter((appt: any) => appt.status === 'COMPLETED' || appt.status === 'CONFIRMED')
      .reduce((sum: number, appt: any) => sum + (appt.totalPrice || 0), 0);

    return NextResponse.json({
      history,
      summary: {
        totalAppointments: history.length,
        totalSpent
      }
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
