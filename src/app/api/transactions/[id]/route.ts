export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, description } = body;

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.accountId !== accountId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status === 'PAID' ? { updatedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error patching transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
