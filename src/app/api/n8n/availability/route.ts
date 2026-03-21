export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const subaccountId = searchParams.get('subaccountId');
    const doctorId = searchParams.get('doctorId');
    const calendarId = searchParams.get('calendarId');

    let startDate, endDate;

    if (dateStr) {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
      }
      startDate = startOfDay(parsedDate);
      endDate = endOfDay(parsedDate);
    } else {
      startDate = startOfDay(new Date());
      // Check 30 days ahead
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); 
    }

    let whereClause: any = {
      status: { notIn: ['CANCELLED'] },
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    };

    if (calendarId) {
       whereClause.calendarId = calendarId;
    } else {
       if (subaccountId) whereClause.subaccountId = subaccountId;
       if (doctorId) whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error in n8n/availability GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
