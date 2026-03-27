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
      const accountSubaccounts = await prisma.subaccount.findMany({
        where: { accountId },
        select: { id: true },
      });
      where.subaccountId = { in: accountSubaccounts.map(s => s.id) };
    }

    const calendars = await prisma.calendar.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subaccount: true,
        doctor: true,
        _count: { select: { appointments: true, configurations: true } }
      }
    });
    return NextResponse.json(calendars);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, subaccountId, doctorId } = body;

    if (!name || !subaccountId || !doctorId) {
      return NextResponse.json({ error: 'Name, subaccountId, and doctorId are required' }, { status: 400 });
    }

    const calendar = await prisma.calendar.create({
      data: { name, subaccountId, doctorId },
      include: { subaccount: true, doctor: true }
    });

    return NextResponse.json(calendar, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
