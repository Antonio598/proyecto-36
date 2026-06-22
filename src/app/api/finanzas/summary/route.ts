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

    const where: any = {
      accountId,
      ...(subaccountId ? { subaccountId } : {}),
      ...(startDate || endDate ? {
        transactionDate: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59Z') } : {}),
        }
      } : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
    });

    const totalPaid = transactions
      .filter(t => t.status === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = transactions
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWaived = transactions
      .filter(t => t.status === 'WAIVED')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by day
    const byDayMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.status !== 'PAID') continue;
      const day = tx.transactionDate.toISOString().split('T')[0];
      byDayMap[day] = (byDayMap[day] || 0) + tx.amount;
    }
    const byDay = Object.entries(byDayMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by type
    const byType: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.status !== 'PAID') continue;
      byType[tx.type] = (byType[tx.type] || 0) + tx.amount;
    }

    return NextResponse.json({
      totalPaid,
      totalPending,
      totalWaived,
      count: transactions.length,
      countPaid: transactions.filter(t => t.status === 'PAID').length,
      countPending: transactions.filter(t => t.status === 'PENDING').length,
      byDay,
      byType,
    });
  } catch (error) {
    console.error('Error fetching finanzas summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
