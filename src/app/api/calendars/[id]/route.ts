import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { id } = await params;
    
    await prisma.calendar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
