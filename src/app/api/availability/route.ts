export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseISO, format, addMinutes, startOfDay, endOfDay, isBefore, isAfter, isEqual } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const dateParam = searchParams.get('date');

    if (!serviceId || !dateParam) {
      return NextResponse.json(
        { error: 'service_id and date (YYYY-MM-DD) are required' },
        { status: 400 }
      );
    }

    const requestedDate = parseISO(dateParam);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday...

    // 1. Get Service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // 2. Get Availability Rules for that day
    const rules = await prisma.availabilityRule.findMany({
      where: {
        dayOfWeek,
        OR: [
          { serviceId: service.id },
          { serviceId: null } // Global rules
        ]
      }
    });

    if (rules.length === 0) {
       // If no rules are set, return empty slots
      return NextResponse.json({ date: dateParam, availableSlots: [] });
    }
    
    // Simplification: pick the first matching rule
    const rule = rules[0]; 

    // 3. Get existing appointments for that day
    const { fromZonedTime, toZonedTime } = require('date-fns-tz');
    const PANAMA_TZ = 'America/Panama';

    // dateParam is like "2024-11-20"
    // Get the start and end of that day in Panama Time, converted to UTC Dates
    const startOfRequestedDay = fromZonedTime(`${dateParam}T00:00:00`, PANAMA_TZ);
    const endOfRequestedDay = fromZonedTime(`${dateParam}T23:59:59`, PANAMA_TZ);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        startTime: {
          gte: startOfRequestedDay,
          lte: endOfRequestedDay,
        }
      }
    });

    // 4. Generate possible slots
    let currentSlot = fromZonedTime(`${dateParam}T${rule.startTime}:00`, PANAMA_TZ);
    const workEndTime = fromZonedTime(`${dateParam}T${rule.endTime}:00`, PANAMA_TZ);

    const availableSlots: string[] = [];
    const intervalMinutes = 30; // Generating slots every 30 mins

    // Get current time in Panama timezone, to avoid showing past slots today
    const nowUTC = new Date();
    const nowPanama = toZonedTime(nowUTC, PANAMA_TZ);
    const isToday = format(nowPanama, 'yyyy-MM-dd') === dateParam;

    while (isBefore(currentSlot, workEndTime) || isEqual(currentSlot, workEndTime)) {
      const slotEndTime = addMinutes(currentSlot, service.durationMinutes);

      if (isAfter(slotEndTime, workEndTime)) {
        break; 
      }

      // Check if slot is in the past
      if (isToday && isBefore(currentSlot, nowUTC)) {
         currentSlot = addMinutes(currentSlot, intervalMinutes);
         continue;
      }

      // Check against existing appointments
      const isOverlapping = existingAppointments.some((appt: any) => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);

        return (
          (isBefore(currentSlot, apptEnd) && isAfter(slotEndTime, apptStart)) || 
          (isEqual(currentSlot, apptStart))
        );
      });

      if (!isOverlapping) {
        // Output format requires local time, we convert UTC slot back to Panama time string
        const slotInPanama = toZonedTime(currentSlot, PANAMA_TZ);
        availableSlots.push(format(slotInPanama, 'HH:mm'));
      }

      // Increment by interval
      currentSlot = addMinutes(currentSlot, intervalMinutes);
    }

    return NextResponse.json({
      date: dateParam,
      serviceId,
      availableSlots
    });

  } catch (error) {
    console.error('Error calculating availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

