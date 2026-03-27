import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const subaccountId = searchParams.get('subaccountId');

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'serviceId is required' }, { status: 400 });
    }

    let whereClause: any = {
      serviceId,
      // Scope to this account's subaccounts
      subaccount: { accountId: account.id },
    };
    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    const configurations = await prisma.serviceConfiguration.findMany({
      where: whereClause,
      include: { calendar: true, subaccount: true, doctor: true },
    });

    const calendars = configurations.map((config) => ({
      calendarId: config.calendarId,
      calendarName: config.calendar?.name,
      doctorId: config.doctorId,
      doctorName: config.doctor?.name,
      subaccountId: config.subaccountId,
      subaccountName: config.subaccount?.name,
      price: config.price,
      durationMinutes: config.durationMinutes,
    }));

    return NextResponse.json({ success: true, data: calendars });
  } catch (error) {
    console.error('Error in n8n/calendars GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
