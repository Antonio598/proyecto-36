export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const subaccounts = await prisma.subaccount.findMany({
      where: accountId ? { accountId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { doctors: true, services: true, appointments: true } }
      }
    });
    return NextResponse.json(subaccounts);
  } catch (error) {
    console.error('Error fetching subaccounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { _count: { select: { subaccounts: true } } }
      });
      
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      if (account.maxSubaccounts !== null && account._count.subaccounts >= account.maxSubaccounts) {
        return NextResponse.json(
          { error: `Límite de sedes alcanzado (${account.maxSubaccounts}). Para aumentar tu límite, por favor contacta a soporte.` },
          { status: 403 }
        );
      }
    }

    const subaccount = await prisma.subaccount.create({
      data: { name, ...(accountId ? { accountId } : {}) },
    });

    return NextResponse.json(subaccount, { status: 201 });
  } catch (error) {
    console.error('Error creating subaccount:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
