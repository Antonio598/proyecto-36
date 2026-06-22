export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId,
        ...(subaccountId ? { subaccountId } : {}),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(startDate || endDate ? {
          transactionDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate + 'T23:59:59Z') } : {}),
          }
        } : {}),
      },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, fullName: true, phone: true } },
            service: { select: { id: true, name: true } },
            doctor: { select: { id: true, name: true } },
          }
        },
        subaccount: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
