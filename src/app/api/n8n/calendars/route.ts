import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const subaccountId = searchParams.get('subaccountId');

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'serviceId is required' }, { status: 400 });
    }

    let whereClause: any = { serviceId };
    if (subaccountId) {
       whereClause.subaccountId = subaccountId;
    }

    const configurations = await prisma.serviceConfiguration.findMany({
      where: whereClause,
      include: {
        calendar: true,
        subaccount: true,
        doctor: true
      }
    });

    const calendars = configurations.map(config => ({
       calendarId: config.calendarId,
       calendarName: config.calendar?.name,
       doctorId: config.doctorId,
       doctorName: config.doctor?.name,
       subaccountId: config.subaccountId,
       subaccountName: config.subaccount?.name,
       price: config.price,
       durationMinutes: config.durationMinutes
    }));

    return NextResponse.json({ success: true, data: calendars });

  } catch (error) {
    console.error('Error in n8n/calendars GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
