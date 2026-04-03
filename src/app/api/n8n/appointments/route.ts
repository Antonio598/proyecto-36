export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');
    const doctorId = searchParams.get('doctorId');
    const serviceId = searchParams.get('serviceId');
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const PANAMA_TZ = 'America/Panama';

    let whereClause: any = {
      // Basic security: ensure appointments belong to the account via subaccounts
      subaccount: { accountId: account.id }
    };

    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    if (calendarId) {
      whereClause.calendarId = calendarId;
    }
    
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (phone) {
      whereClause.patient = { phone: phone.trim() };
    }

    if (status) {
      whereClause.status = status;
    } else {
      // Default: exclude cancelled appointments if not explicitly requested
      whereClause.status = { not: 'CANCELLED' };
    }

    // Date filtering (America/Panama timezone interpretation)
    if (date) {
      // Specific day
      const startOfDay = fromZonedTime(`${date}T00:00:00`, PANAMA_TZ);
      const endOfDay = fromZonedTime(`${date}T23:59:59`, PANAMA_TZ);
      whereClause.startTime = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      // Date range
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = fromZonedTime(`${startDate}T00:00:00`, PANAMA_TZ);
      }
      if (endDate) {
        whereClause.startTime.lte = fromZonedTime(`${endDate}T23:59:59`, PANAMA_TZ);
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            fullName: true,
            phone: true,
            email: true,
            cedula_pasaporte: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true
          }
        },
        calendar: {
           select: {
             id: true,
             name: true
           }
        }
      },
      orderBy: { startTime: 'asc' },
      take: Math.min(limit, 100),
    });

    // Convert results to Panama Time for the response
    const formattedAppointments = appointments.map(appt => ({
      ...appt,
      startTime: formatInTimeZone(appt.startTime, PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      endTime: formatInTimeZone(appt.endTime, PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      startTimeLocal: formatInTimeZone(appt.startTime, PANAMA_TZ, "yyyy-MM-dd HH:mm:ss"),
    }));

    return NextResponse.json({ success: true, data: formattedAppointments });
  } catch (error) {
    console.error('Error in n8n/appointments/GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
