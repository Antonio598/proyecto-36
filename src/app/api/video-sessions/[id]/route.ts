export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { patientId, doctorId, notes, amount, paymentStatus, status, endedAt } = body;

    const data: any = {};
    if (patientId  !== undefined) data.patientId = patientId || null;
    if (doctorId   !== undefined) data.doctorId  = doctorId  || null;
    if (notes      !== undefined) data.notes = notes;
    if (amount     !== undefined) data.amount = amount !== '' ? parseFloat(amount) : null;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (status     !== undefined) data.status = status;
    if (endedAt    !== undefined) data.endedAt = endedAt ? new Date(endedAt) : null;
    if (status === 'CLOSED' && !endedAt) data.endedAt = new Date();

    const session = await (prisma as any).videoSession.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctor:  { select: { id: true, name: true } },
        consultation: { select: { id: true } },
      },
    });

    // Auto-create Transaction when amount is set and payment is marked PAID
    if (paymentStatus === 'PAID' && session.amount && session.subaccountId) {
      const existing = await prisma.transaction.findFirst({
        where: { description: `VideoSession:${id}` }
      });
      if (!existing) {
        await prisma.transaction.create({
          data: {
            accountId,
            subaccountId: session.subaccountId,
            amount: session.amount,
            type: 'TELECONSULTA',
            status: 'PAID',
            description: `VideoSession:${id}`,
          }
        });
      }
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('[video-sessions PUT]', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (prisma as any).videoSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[video-sessions DELETE]', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
