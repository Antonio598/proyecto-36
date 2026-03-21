import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subaccounts = await prisma.subaccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { doctors: true, services: true, appointments: true }
        }
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
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const subaccount = await prisma.subaccount.create({
      data: { name },
    });

    return NextResponse.json(subaccount, { status: 201 });
  } catch (error) {
    console.error('Error creating subaccount:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
