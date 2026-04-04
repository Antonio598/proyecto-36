export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format, addDays, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';

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
    const serviceId = searchParams.get('serviceId');
    const durationParam = searchParams.get('duration');

    let startDateUTC: Date;
    let endDateUTC: Date;
    let daysToGenerateInPanama: string[] = [];

    const nowInPanama = toZonedTime(new Date(), PANAMA_TZ);
    const todayStr = format(nowInPanama, 'yyyy-MM-dd');

    if (dateStr) {
      if (isNaN(new Date(dateStr).getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
      }
      startDateUTC = fromZonedTime(`${dateStr}T00:00:00`, PANAMA_TZ);
      endDateUTC = fromZonedTime(`${dateStr}T23:59:59`, PANAMA_TZ);
      daysToGenerateInPanama.push(dateStr);
    } else {
      startDateUTC = fromZonedTime(`${todayStr}T00:00:00`, PANAMA_TZ);
      
      const futureDate = addDays(nowInPanama, 30);
      const futureDateStr = format(futureDate, 'yyyy-MM-dd');
      endDateUTC = fromZonedTime(`${futureDateStr}T23:59:59`, PANAMA_TZ);

      for (let i = 0; i <= 30; i++) {
        daysToGenerateInPanama.push(format(addDays(nowInPanama, i), 'yyyy-MM-dd'));
      }
    }

    // --- Get Duration ---
    let slotDuration = durationParam ? parseInt(durationParam) : 60; // Increased default to 60 min
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service) {
        slotDuration = service.durationMinutes;
      }
    }

    // --- Fetch Appointments (Blockers) ---
    // Change: Find any appointment that OVERLAPS with the requested range
    let whereClause: any = {
      status: { notIn: ['CANCELLED'] },
      startTime: { lt: endDateUTC },
      endTime: { gt: startDateUTC },
      subaccount: { accountId: account.id },
    };

    let targetSubaccountId = subaccountId;

    if (calendarId) {
      whereClause.calendarId = calendarId;
      // Fetch calendar to get its subaccountId for strict rule filtering
      const cal = await prisma.calendar.findUnique({ 
        where: { id: calendarId },
        select: { subaccountId: true }
      });
      if (cal) targetSubaccountId = cal.subaccountId;
    } else {
      if (subaccountId) whereClause.subaccountId = subaccountId;
      if (doctorId) whereClause.doctorId = doctorId;
    }

    const appointmentsData = await prisma.appointment.findMany({
      where: whereClause,
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // --- Fetch Availability Rules ---
    // Scope rules by account to prevent leakage
    const rulesWhere: any = {
      OR: [
        { calendar: { subaccount: { accountId: account.id } } },
        { subaccount: { accountId: account.id } }
      ]
    };

    const allRules = await prisma.availabilityRule.findMany({
      where: rulesWhere,
      orderBy: { createdAt: 'desc' }
    });

    const freeSlots = [];
    const nowUTC = new Date();

    for (const dayStr of daysToGenerateInPanama) {
      const isToday = dayStr === todayStr;
      const dayDate = fromZonedTime(`${dayStr}T12:00:00`, PANAMA_TZ);
      const dayOfWeek = toZonedTime(dayDate, PANAMA_TZ).getDay();

      const dayStartUTC = fromZonedTime(`${dayStr}T00:00:00`, PANAMA_TZ);
      const dayEndUTC = fromZonedTime(`${dayStr}T23:59:59`, PANAMA_TZ);

      // Find best rules for day
      let dayRules = [];
      if (calendarId) {
        // 1. Precise calendar rule
        dayRules = allRules.filter(r => r.calendarId === calendarId && r.dayOfWeek === dayOfWeek);
        // 2. Fallback to its specific subaccount rule
        if (dayRules.length === 0 && targetSubaccountId) {
          dayRules = allRules.filter(r => r.subaccountId === targetSubaccountId && !r.calendarId && r.dayOfWeek === dayOfWeek);
        }
      } else if (targetSubaccountId) {
        // Rules for this specific subaccount
        dayRules = allRules.filter(r => r.subaccountId === targetSubaccountId && r.dayOfWeek === dayOfWeek);
      } else {
        // General account rules if no context provided (broad)
        dayRules = allRules.filter(r => r.dayOfWeek === dayOfWeek);
      }

      // Filter appointments that overlap the 24h window of this specific day
      const dayAppointments = appointmentsData.filter(appt => {
        return (isBefore(appt.startTime, dayEndUTC) && isAfter(appt.endTime, dayStartUTC));
      });

      for (const rule of dayRules) {
        let currentPointer = fromZonedTime(`${dayStr}T${rule.startTime}:00`, PANAMA_TZ);
        const workEndTime = fromZonedTime(`${dayStr}T${rule.endTime}:00`, PANAMA_TZ);

        // Generate discrete slots
        while (isBefore(currentPointer, workEndTime)) {
          const slotEnd = addMinutes(currentPointer, slotDuration);
          
          if (isAfter(slotEnd, workEndTime)) break;

          // Check if slot is in the past
          if (isToday && isBefore(currentPointer, nowUTC)) {
            currentPointer = addMinutes(currentPointer, 30);
            continue;
          }

          // Check for overlaps with appointments
          const isBusy = dayAppointments.some(appt => {
            return (isBefore(currentPointer, appt.endTime) && isAfter(slotEnd, appt.startTime));
          });

          if (!isBusy) {
            freeSlots.push({
              startTime: currentPointer,
              endTime: slotEnd,
              startTimeLocal: format(toZonedTime(currentPointer, PANAMA_TZ), 'yyyy-MM-dd HH:mm:ss'),
              endTimeLocal: format(toZonedTime(slotEnd, PANAMA_TZ), 'yyyy-MM-dd HH:mm:ss'),
              type: 'available',
              date: dayStr
            });
            const increment = Math.min(30, slotDuration);
            currentPointer = addMinutes(currentPointer, increment);
          } else {
            currentPointer = addMinutes(currentPointer, 15);
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: freeSlots.length, data: freeSlots });
  } catch (error) {
    console.error('Error in n8n/availability GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
