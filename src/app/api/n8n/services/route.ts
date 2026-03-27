export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const doctorId = searchParams.get('doctorId');

    let whereClause: any = {
      isActive: true,
      // Scope to this account's subaccounts
      subaccount: { accountId: account.id },
    };

    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    if (doctorId) {
      whereClause.configurations = { some: { doctorId } };
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        configurations: {
          include: { doctor: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Error in n8n/services GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
