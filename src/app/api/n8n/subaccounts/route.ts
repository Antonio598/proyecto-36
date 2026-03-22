export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // No query params needed for this one, simply lists all active or available subaccounts/sedes
    const subaccounts = await prisma.subaccount.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: subaccounts });
  } catch (error) {
    console.error('Error in n8n/subaccounts GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
