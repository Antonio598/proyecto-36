export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let { phone, oldStartTime, newStartTime, id, newCalendarId, subaccountId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !oldStartTime || !newStartTime) {
      return NextResponse.json({ success: false, error: 'phone, oldStartTime, and newStartTime are required' }, { status: 400 });
    }

    phone = phone.replace(/\D/g, '');
    if (!phone) {
       return NextResponse.json({ success: false, error: 'phone must contain at least one numeric digit' }, { status: 400 });
    }

    // 1. Find Patient
    const patient = await prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found based on phone number' }, { status: 404 });
    }

    // 2. Find specific active appointment
    const oldStart = new Date(oldStartTime);
    
    let whereClause: any = {
      patientId: patient.id,
      startTime: oldStart,
      status: { notIn: ['CANCELLED'] } // Only reschedule active ones
    };
    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    const appointment = await prisma.appointment.findFirst({
      where: whereClause,
      include: { service: true }
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Active appointment not found for this patient at the old start time' }, { status: 404 });
    }

    // 3. Overlap Check for new time (using dynamic duration based on calendar)
    const newStart = new Date(newStartTime);
    let duration = appointment.service?.durationMinutes || 30;
    let targetCalendarId = newCalendarId || appointment.calendarId;

    if (targetCalendarId && appointment.serviceId) {
      const config = await prisma.serviceConfiguration.findUnique({
         where: { serviceId_calendarId: { serviceId: appointment.serviceId, calendarId: targetCalendarId } }
      });
      if (config) {
         duration = config.durationMinutes;
      }
    }

    const newEnd = new Date(newStart.getTime() + duration * 60000);

    const { fromZonedTime, toZonedTime } = require('date-fns-tz');
    const { format } = require('date-fns');
    let finalSubaccountId = subaccountId || appointment.subaccountId;
    if (finalSubaccountId) {
       const panamaDate = toZonedTime(newStart, 'America/Panama');
       const rules = await prisma.availabilityRule.findMany({
          where: {
             subaccountId: finalSubaccountId,
             dayOfWeek: panamaDate.getDay()
          }
       });

       if (rules.length === 0) {
          return NextResponse.json({ success: false, error: 'La clínica está cerrada en este día, no hay horarios disponibles.' }, { status: 400 });
       }

       const rule = rules[0];
       const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
       const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
       const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

       if (newStart < workStart || newEnd > workEnd) {
          return NextResponse.json({ success: false, error: `El horario debe estar dentro de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
       }
    }

    let overlapWhere: any = {
      id: { not: appointment.id }, // Ignore self
      status: { notIn: ['CANCELLED'] },
      OR: [
        { startTime: { lt: newEnd }, endTime: { gt: newStart } }
      ]
    };
    if (targetCalendarId) {
      overlapWhere.calendarId = targetCalendarId;
    }

    const overlappingAppt = await prisma.appointment.findFirst({
      where: overlapWhere
    });

    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'New time slot overlaps with another appointment' }, { status: 409 });
    }

    // 4. Apply Reschedule
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        calendarId: targetCalendarId !== undefined ? targetCalendarId : undefined
      },
      include: {
        patient: { select: { fullName: true, phone: true }},
        service: { select: { name: true }}
      }
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/reschedule:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
