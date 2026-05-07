export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, addDays, addMinutes, isBefore, isAfter } from 'date-fns';

const PANAMA_TZ = 'America/Panama';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr    = searchParams.get('date');
    const subaccountId = searchParams.get('subaccountId');
    const doctorId   = searchParams.get('doctorId');
    const calendarId = searchParams.get('calendarId');
    const serviceId  = searchParams.get('serviceId');
    const durationParam = searchParams.get('duration');

    const nowInPanama = toZonedTime(new Date(), PANAMA_TZ);
    const todayStr    = format(nowInPanama, 'yyyy-MM-dd');

    let daysToGenerate: string[] = [];
    let startDateUTC: Date;
    let endDateUTC: Date;

    if (dateStr) {
      if (isNaN(new Date(dateStr).getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
      }
      startDateUTC = fromZonedTime(`${dateStr}T00:00:00`, PANAMA_TZ);
      endDateUTC   = fromZonedTime(`${dateStr}T23:59:59`, PANAMA_TZ);
      daysToGenerate.push(dateStr);
    } else {
      startDateUTC = fromZonedTime(`${todayStr}T00:00:00`, PANAMA_TZ);
      const futureDate = addDays(nowInPanama, 30);
      endDateUTC = fromZonedTime(`${format(futureDate, 'yyyy-MM-dd')}T23:59:59`, PANAMA_TZ);
      for (let i = 0; i <= 30; i++) {
        daysToGenerate.push(format(addDays(nowInPanama, i), 'yyyy-MM-dd'));
      }
    }

    // --- Slot duration ---
    let slotDuration = durationParam ? parseInt(durationParam) : 60;
    if (serviceId) {
      let svcConfig = null;
      if (calendarId) {
        svcConfig = await prisma.serviceConfiguration.findUnique({
          where: { serviceId_calendarId: { serviceId, calendarId } },
          select: { durationMinutes: true }
        });
      }
      if (svcConfig) {
        slotDuration = svcConfig.durationMinutes;
      } else {
        const svc = await prisma.service.findUnique({ where: { id: serviceId }, select: { durationMinutes: true } });
        if (svc) slotDuration = svc.durationMinutes;
      }
    }

    // --- Resolve subaccountId + doctorId from calendarId ---
    let targetSubaccountId = subaccountId;
    let targetDoctorId = doctorId || null;
    if (calendarId) {
      const cal = await prisma.calendar.findUnique({
        where: { id: calendarId },
        select: { subaccountId: true, doctorId: true }
      });
      if (cal) {
        targetSubaccountId = cal.subaccountId;
        targetDoctorId = cal.doctorId;
      }
    }

    // --- Fetch existing appointments + blockers ---
    const timeRange = { startTime: { lt: endDateUTC }, endTime: { gt: startDateUTC } };

    let appointmentsData: { startTime: Date; endTime: Date }[] = [];

    if (calendarId) {
      const [calAppts, doctorNullCalAppts, sedeBlockers] = await Promise.all([
        // 1. All appointments in this specific calendar
        prisma.appointment.findMany({
          where: {
            ...timeRange,
            status: { notIn: ['CANCELLED'] },
            calendarId,
            subaccount: { accountId: account.id },
          },
          select: { startTime: true, endTime: true },
        }),
        // 2. Appointments for the same doctor saved WITHOUT calendarId
        //    (created before the calendarId-fix was deployed)
        targetDoctorId
          ? prisma.appointment.findMany({
              where: {
                ...timeRange,
                status: { notIn: ['CANCELLED'] },
                doctorId: targetDoctorId,
                calendarId: null,
                isBlocker: false,
              },
              select: { startTime: true, endTime: true },
            })
          : Promise.resolve([]),
        // 3. Subaccount-level blockers (block all doctors in the sede)
        targetSubaccountId
          ? prisma.appointment.findMany({
              where: {
                ...timeRange,
                status: { notIn: ['CANCELLED'] },
                subaccountId: targetSubaccountId,
                calendarId: null,
                isBlocker: true,
              },
              select: { startTime: true, endTime: true },
            })
          : Promise.resolve([]),
      ]);
      appointmentsData = [...calAppts, ...doctorNullCalAppts, ...sedeBlockers];
    } else {
      const where: any = {
        ...timeRange,
        status: { notIn: ['CANCELLED'] },
        subaccount: { accountId: account.id },
      };
      if (targetSubaccountId) where.subaccountId = targetSubaccountId;
      if (doctorId) where.doctorId = doctorId;
      appointmentsData = await prisma.appointment.findMany({ where, select: { startTime: true, endTime: true } });
    }

    // --- Fetch availability rules ---
    const allRules = await prisma.availabilityRule.findMany({
      where: {
        OR: [
          { calendar: { subaccount: { accountId: account.id } } },
          { subaccount: { accountId: account.id } },
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const freeSlots: any[] = [];
    const nowUTC = new Date();

    for (const dayStr of daysToGenerate) {
      const isToday  = dayStr === todayStr;
      const dayDate  = fromZonedTime(`${dayStr}T12:00:00`, PANAMA_TZ);
      const dayOfWeek = toZonedTime(dayDate, PANAMA_TZ).getDay();
      const dayStartUTC = fromZonedTime(`${dayStr}T00:00:00`, PANAMA_TZ);
      const dayEndUTC   = fromZonedTime(`${dayStr}T23:59:59`, PANAMA_TZ);

      // Pick the right rules for this day
      let dayRules: typeof allRules = [];
      if (calendarId) {
        // Only use rules specific to this calendar — no subaccount fallback.
        // If no rules exist for this day, the doctor is simply closed that day.
        dayRules = allRules.filter(r => r.calendarId === calendarId && r.dayOfWeek === dayOfWeek);
      } else if (targetSubaccountId) {
        dayRules = allRules.filter(r => r.subaccountId === targetSubaccountId && r.dayOfWeek === dayOfWeek);
      } else {
        dayRules = allRules.filter(r => r.dayOfWeek === dayOfWeek);
      }

      if (dayRules.length === 0) continue; // clinic closed this day

      // Appointments that touch this day
      const dayAppts = appointmentsData.filter(a =>
        isBefore(a.startTime, dayEndUTC) && isAfter(a.endTime, dayStartUTC)
      );

      for (const rule of dayRules) {
        let pointer  = fromZonedTime(`${dayStr}T${rule.startTime}:00`, PANAMA_TZ);
        const workEnd = fromZonedTime(`${dayStr}T${rule.endTime}:00`, PANAMA_TZ);

        while (isBefore(pointer, workEnd)) {
          const slotEnd = addMinutes(pointer, slotDuration);

          // Slot would go past closing time
          if (isAfter(slotEnd, workEnd)) break;

          // Skip past slots
          if (isToday && !isAfter(pointer, nowUTC)) {
            pointer = addMinutes(pointer, slotDuration);
            continue;
          }

          // Check for overlap with any appointment or blocker
          const blocking = dayAppts.find(a =>
            isBefore(pointer, a.endTime) && isAfter(slotEnd, a.startTime)
          );

          if (!blocking) {
            freeSlots.push({
              date:           dayStr,
              startTime:      pointer.toISOString(),
              endTime:        slotEnd.toISOString(),
              startTimeLocal: formatInTimeZone(pointer, PANAMA_TZ, 'yyyy-MM-dd HH:mm:ss'),
              endTimeLocal:   formatInTimeZone(slotEnd,  PANAMA_TZ, 'yyyy-MM-dd HH:mm:ss'),
            });
            // Advance by the full slot duration (no overlapping slots)
            pointer = addMinutes(pointer, slotDuration);
          } else {
            // Jump to the end of the blocking appointment to avoid useless iterations
            pointer = blocking.endTime > pointer ? blocking.endTime : addMinutes(pointer, 15);
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
