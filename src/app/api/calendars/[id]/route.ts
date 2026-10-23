import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.calendar.findUnique({
      where: { id },
      include: { subaccount: { select: { accountId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.subaccount?.accountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, subaccountId, doctorId } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (subaccountId) dataToUpdate.subaccountId = subaccountId;
    if (doctorId) dataToUpdate.doctorId = doctorId;

    const calendar = await prisma.calendar.update({
      where: { id },
      data: dataToUpdate,
      include: { subaccount: true, doctor: true }
    });

    return NextResponse.json(calendar);
  } catch (error) {
    console.error('Error updating calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.calendar.findUnique({
      where: { id },
      include: { subaccount: { select: { accountId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.subaccount?.accountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.calendar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
