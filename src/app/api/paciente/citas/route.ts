export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPacienteUser } from '@/lib/pacienteAuth';

export async function GET(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!user.patientId) return NextResponse.json({ error: 'Vincula tu expediente primero' }, { status: 403 });

    const citas = await prisma.appointment.findMany({
      where: { patientId: user.patientId },
      include: { service: { select: { name: true, price: true, colorCode: true } } },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(citas);
  } catch (error) {
    console.error('[paciente/citas]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
