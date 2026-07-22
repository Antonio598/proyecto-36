export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTeleconsultaRequestEmail } from '@/lib/mail';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const body = await request.json();
    const { doctorId, patientName, patientPhone, reason, preferredDate, preferredTime } = body;

    if (!patientName || !patientPhone) {
      return NextResponse.json({ error: 'Nombre y teléfono son requeridos' }, { status: 400 });
    }

    // Verify account exists
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });

    // Fetch doctor's subaccountId for the subaccount relation
    let subaccountId: string | null = null;
    if (doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { subaccountId: true },
      });
      subaccountId = doctor?.subaccountId ?? null;
    }

    const roomName = `galenus-${accountId.slice(0, 8)}-${Date.now().toString(36)}`;
    const roomUrl  = `https://meet.jit.si/${roomName}`;

    const notes = [
      reason        ? `Motivo: ${reason}` : null,
      preferredDate ? `Fecha preferida: ${preferredDate}${preferredTime ? ` a las ${preferredTime}` : ''}` : null,
    ].filter(Boolean).join('\n');

    const session = await (prisma as any).videoSession.create({
      data: {
        accountId,
        subaccountId,
        doctorId: doctorId || null,
        patientName,
        patientPhone,
        roomUrl,
        roomName,
        status: 'PENDING',
        notes: notes || null,
      },
      include: {
        doctor: { select: { id: true, name: true } },
      },
    });

    // Send email notification to account admins (fire-and-forget)
    ;(async () => {
      try {
        const accountWithAdmins = await prisma.account.findUnique({
          where: { id: accountId },
          include: { users: { where: { role: { in: ['ADMIN', 'RECEPTIONIST'] } } } },
        });
        const adminEmails = accountWithAdmins?.users.map(u => u.email).filter(Boolean) ?? [];
        for (const email of adminEmails) {
          await sendTeleconsultaRequestEmail({
            to: email,
            patientName,
            patientPhone,
            doctorName: session.doctor?.name,
            reason:        body.reason,
            preferredDate: body.preferredDate,
            preferredTime: body.preferredTime,
          });
        }
      } catch (mailErr) {
        console.error('[agendareunion mail]', mailErr);
      }
    })();

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error('[agendareunion POST]', error?.message || error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
