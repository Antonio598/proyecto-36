export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPacienteUser } from '@/lib/pacienteAuth';

export async function GET(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!user.patientId) return NextResponse.json({ error: 'Vincula tu expediente primero' }, { status: 403 });

    const teleconsultas = await (prisma as any).videoSession.findMany({
      where: { patientId: user.patientId },
      include: { doctor: { select: { id: true, name: true } } },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(teleconsultas);
  } catch (error) {
    console.error('[paciente/teleconsultas]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
