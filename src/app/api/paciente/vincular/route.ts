export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPacienteUser } from '@/lib/pacienteAuth';

export async function POST(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });

    const phoneClean = phone.toString().trim();
    const patient = await prisma.patient.findFirst({ where: { phone: phoneClean } });

    if (!patient) {
      return NextResponse.json({ found: false });
    }

    await (prisma as any).patientUser.update({
      where: { id: user.id },
      data: { phone: phoneClean, patientId: patient.id },
    });

    return NextResponse.json({
      found: true,
      patient: { id: patient.id, fullName: patient.fullName, phone: patient.phone },
    });
  } catch (error) {
    console.error('[paciente/vincular POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getPacienteUser(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await (prisma as any).patientUser.update({
      where: { id: user.id },
      data: { phone: null, patientId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[paciente/vincular DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
