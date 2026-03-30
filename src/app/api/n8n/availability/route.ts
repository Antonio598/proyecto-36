export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format, addDays } from 'date-fns';

const PANAMA_TZ = 'America/Panama';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const subaccountId = searchParams.get('subaccountId');
    const doctorId = searchParams.get('doctorId');
    const calendarId = searchParams.get('calendarId');

    let startDateUTC: Date;
    let endDateUTC: Date;
    let daysToGenerateInPanama: string[] = [];

    if (dateStr) {
      if (isNaN(new Date(dateStr).getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
      }
      startDateUTC = fromZonedTime(`${dateStr}T00:00:00`, PANAMA_TZ);
      endDateUTC = fromZonedTime(`${dateStr}T23:59:59`, PANAMA_TZ);
      daysToGenerateInPanama.push(dateStr);
    } else {
      const nowInPanama = toZonedTime(new Date(), PANAMA_TZ);
      const todayStr = format(nowInPanama, 'yyyy-MM-dd');
      startDateUTC = fromZonedTime(`${todayStr}T00:00:00`, PANAMA_TZ);
      
      const futureDate = addDays(nowInPanama, 30);
      const futureDateStr = format(futureDate, 'yyyy-MM-dd');
      endDateUTC = fromZonedTime(`${futureDateStr}T23:59:59`, PANAMA_TZ);

      for (let i = 0; i <= 30; i++) {
        daysToGenerateInPanama.push(format(addDays(nowInPanama, i), 'yyyy-MM-dd'));
      }
    }

    let whereClause: any = {
      status: { notIn: ['CANCELLED'] },
      startTime: { gte: startDateUTC },
      endTime: { lte: endDateUTC },
      subaccount: { accountId: account.id },
    };

    if (calendarId) {
      whereClause.calendarId = calendarId;
    } else {
      if (subaccountId) whereClause.subaccountId = subaccountId;
      if (doctorId) whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: { id: true, startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // --- Inject Blockers based on AvailabilityRules ---
    let rulesWhere: any = {};
    if (calendarId) {
      rulesWhere.calendarId = calendarId;
    } else if (subaccountId) {
      // Find rules for that subaccount or any calendar in that subaccount
      rulesWhere.OR = [
        { subaccountId: subaccountId },
        { calendar: { subaccountId: subaccountId } }
      ];
    } else {
       rulesWhere.OR = [
         { subaccount: { accountId: account.id } },
         { calendar: { subaccount: { accountId: account.id } } }
       ];
    }

    const rules = await prisma.availabilityRule.findMany({
      where: rulesWhere,
      orderBy: { createdAt: 'desc' } // prioritize newer rules if multiple exist
    });

    const fakeAppointments = [];

    for (const dayStr of daysToGenerateInPanama) {
      const dayDate = fromZonedTime(`${dayStr}T12:00:00`, PANAMA_TZ);
      const dayOfWeek = toZonedTime(dayDate, PANAMA_TZ).getDay();

      const dayRule = rules.find(r => r.dayOfWeek === dayOfWeek);

      const dayStartUTC = fromZonedTime(`${dayStr}T00:00:00`, PANAMA_TZ);
      const dayEndUTC = fromZonedTime(`${dayStr}T23:59:59`, PANAMA_TZ);

      if (!dayRule) {
        // Fully closed day
        fakeAppointments.push({
          id: `blocked-full-${dayStr}`,
          startTime: dayStartUTC,
          endTime: dayEndUTC,
        });
      } else {
        // Block before start
        const workStartUTC = fromZonedTime(`${dayStr}T${dayRule.startTime}:00`, PANAMA_TZ);
        if (workStartUTC > dayStartUTC) {
          fakeAppointments.push({
             id: `blocked-morning-${dayStr}`,
             startTime: dayStartUTC,
             endTime: workStartUTC
          });
        }
        // Block after end
        const workEndUTC = fromZonedTime(`${dayStr}T${dayRule.endTime}:00`, PANAMA_TZ);
        if (workEndUTC < dayEndUTC) {
           fakeAppointments.push({
              id: `blocked-evening-${dayStr}`,
              startTime: workEndUTC,
              endTime: dayEndUTC
           });
        }
      }
    }

    const allData = [...appointments, ...fakeAppointments].sort((a, b) => {
       return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return NextResponse.json({ success: true, data: allData });
  } catch (error) {
    console.error('Error in n8n/availability GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
