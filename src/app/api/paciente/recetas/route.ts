export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPacienteUser } from '@/lib/pacienteAuth';

export async function GET(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!user.patientId) return NextResponse.json({ error: 'Vincula tu expediente primero' }, { status: 403 });

    const recetas = await prisma.prescription.findMany({
      where: { patientId: user.patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        consultationRecord: { select: { id: true, visitDate: true, diagnosis: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json(recetas);
  } catch (error) {
    console.error('[paciente/recetas]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
