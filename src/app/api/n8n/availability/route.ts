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

    // --- Get Duration ---
    let slotDuration = durationParam ? parseInt(durationParam) : 60; // Increased default to 60 min
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service) {
        slotDuration = service.durationMinutes;
      }
    }

    // --- Fetch Appointments (Blockers) ---
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

    const appointmentsData = await prisma.appointment.findMany({
      where: whereClause,
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // --- Fetch Availability Rules ---
    const rulesWhere: any = {};
    if (calendarId) {
      rulesWhere.OR = [
        { calendarId: calendarId },
        { subaccountId: { not: null }, calendarId: null }
      ];
    } else if (subaccountId) {
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

    const allRules = await prisma.availabilityRule.findMany({
      where: rulesWhere,
      orderBy: { createdAt: 'desc' }
    });

    const freeSlots = [];
    const nowUTC = new Date();

    for (const dayStr of daysToGenerateInPanama) {
      const dayDate = fromZonedTime(`${dayStr}T12:00:00`, PANAMA_TZ);
      const dayOfWeek = toZonedTime(dayDate, PANAMA_TZ).getDay();

      // Find best rules for day
      let dayRules = [];
      if (calendarId) {
        dayRules = allRules.filter(r => r.calendarId === calendarId && r.dayOfWeek === dayOfWeek);
        if (dayRules.length === 0) {
          dayRules = allRules.filter(r => r.subaccountId && !r.calendarId && r.dayOfWeek === dayOfWeek);
        }
      } else {
        dayRules = allRules.filter(r => r.dayOfWeek === dayOfWeek);
      }

      const dayAppointments = appointmentsData.filter(appt => {
        const apptDateStr = format(toZonedTime(appt.startTime, PANAMA_TZ), 'yyyy-MM-dd');
        return apptDateStr === dayStr;
      });

      for (const rule of dayRules) {
        let currentPointer = fromZonedTime(`${dayStr}T${rule.startTime}:00`, PANAMA_TZ);
        const workEndTime = fromZonedTime(`${dayStr}T${rule.endTime}:00`, PANAMA_TZ);

        // Generate discrete slots
        while (isBefore(currentPointer, workEndTime)) {
          const slotEnd = addMinutes(currentPointer, slotDuration);
          
          if (isAfter(slotEnd, workEndTime)) break;

          // Check if slot is in the past
          if (isBefore(currentPointer, nowUTC)) {
            currentPointer = addMinutes(currentPointer, 30); // Increment pointer by small interval
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
              type: 'available',
              date: dayStr
            });
            // Jump by duration or fixed interval? 
            // Usually we jump by duration to avoid overlapping slots, OR we jump by a fixed interval (like 30 mins) to show more start times.
            // Let's use 30 minutes as a standard start time interval if duration is >= 30, otherwise use duration.
            const increment = Math.min(30, slotDuration);
            currentPointer = addMinutes(currentPointer, increment);
          } else {
            // If busy, we should move the pointer past the appointment or increment?
            // To be safe, increment by a small amount or jump to end of blocking appt.
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
