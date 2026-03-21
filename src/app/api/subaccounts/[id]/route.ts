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
    const { name } = body;

    const subaccount = await prisma.subaccount.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(subaccount);
  } catch (error) {
    console.error('Error updating subaccount:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.subaccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subaccount:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
