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
    const { id } = await params;
    const body = await request.json();
    const { name, videoUrl } = body;

    const subaccount = await prisma.subaccount.update({
      where: { id, ...(accountId ? { accountId } : {}) },
      data: {
        ...(name ? { name } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl || null } : {}),
      },
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
