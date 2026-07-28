export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPacienteUser } from '@/lib/pacienteAuth';

export async function GET(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!user.patientId) return NextResponse.json({ error: 'Vincula tu expediente primero' }, { status: 403 });

    const consultas = await prisma.consultationRecord.findMany({
      where: { patientId: user.patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: { select: { startTime: true, service: { select: { name: true } } } },
        prescriptions: { select: { id: true, issuedAt: true } },
        medicalFiles: { select: { id: true, fileName: true, fileType: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json(consultas);
  } catch (error) {
    console.error('[paciente/consultas]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
