import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    let where: any = {};
    if (subaccountId) {
      where.subaccountId = subaccountId;
    } else if (accountId) {
      // Filter to doctors in this account's subaccounts
      const accountSubaccounts = await prisma.subaccount.findMany({
        where: { accountId },
        select: { id: true },
      });
      where.subaccountId = { in: accountSubaccounts.map(s => s.id) };
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subaccount: true,
        _count: { select: { calendars: true, services: true } }
      }
    });
    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, subaccountId } = body;

    if (!name || !subaccountId) {
      return NextResponse.json({ error: 'Name and subaccountId are required' }, { status: 400 });
    }

    const doctor = await prisma.doctor.create({
      data: { name, subaccountId },
      include: { subaccount: true }
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
