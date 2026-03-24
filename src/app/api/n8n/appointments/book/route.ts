export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fromZonedTime } from 'date-fns-tz';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { phone, fullName, serviceId, startTime, notes, id, subaccountId, doctorId, calendarId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !fullName || !serviceId || !startTime) {
      return NextResponse.json({ success: false, error: 'phone, fullName, serviceId, and startTime are required' }, { status: 400 });
    }

    // Extract only the numbers from the phone string (in case it contains junk text)
    phone = phone.replace(/\D/g, '');
    if (!phone) {
       return NextResponse.json({ success: false, error: 'phone must contain at least one numeric digit' }, { status: 400 });
    }

    // 1. Verify Service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ success: false, error: 'Service invalid or inactive' }, { status: 400 });
    }

    // 2. Resolve Patient (Upsert by Phone)
    const patientData = {
      phone,
      fullName,
      notes: notes || 'Auto-created via n8n integration',
    };
    
    const patient = await prisma.patient.upsert({
      where: { phone },
      update: { fullName },
      create: patientData,
    });

    const naiveLocalTime = startTime.substring(0, 19);
    const start = fromZonedTime(naiveLocalTime, 'America/Panama');

    // Resolve Duration and Price dynamically if calendarId is provided
    let duration = service.durationMinutes;
    let price = service.price;
    let finalSubaccountId = subaccountId || service.subaccountId;
    let finalDoctorId = doctorId || undefined;

    if (calendarId) {
      const config = await prisma.serviceConfiguration.findUnique({
         where: {
            serviceId_calendarId: {
               serviceId,
               calendarId
            }
         }
      });
      if (!config) {
         return NextResponse.json({ success: false, error: 'Service configuration not found for the specified calendar' }, { status: 404 });
      }
      duration = config.durationMinutes;
      price = config.price;
      // Inherit context from config if not provided explicitly
      finalSubaccountId = finalSubaccountId || config.subaccountId;
      finalDoctorId = finalDoctorId || config.doctorId;
    }

    const end = new Date(start.getTime() + duration * 60000);

    // 2.5 Verify AvailabilityRules
    const { toZonedTime } = require('date-fns-tz');
    const panamaDate = toZonedTime(start, 'America/Panama');
    const requestedDayOfWeek = panamaDate.getDay();
    const rules = await prisma.availabilityRule.findMany({
       where: {
          subaccountId: finalSubaccountId,
          dayOfWeek: requestedDayOfWeek
       }
    });

    if (rules.length === 0) {
       return NextResponse.json({ success: false, error: 'La clínica está cerrada en este día.' }, { status: 400 });
    }

    const rule = rules[0];
    const { format } = require('date-fns');
    const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
    const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
    const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

    if (start < workStart || end > workEnd) {
       return NextResponse.json({ success: false, error: `El horario solicitado está fuera de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
    }

    // 3. Overlap Check
    let overlapWhere: any = {
       status: { notIn: ['CANCELLED'] },
       OR: [
          { startTime: { lt: end }, endTime: { gt: start } }
       ]
    };
    
    if (calendarId) {
       overlapWhere.calendarId = calendarId;
    }

    const overlappingAppt = await prisma.appointment.findFirst({
      where: overlapWhere
    });

    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'Time slot is already booked.' }, { status: 409 });
    }

    // 4. Create Appt
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        serviceId: service.id,
        subaccountId: finalSubaccountId,
        doctorId: finalDoctorId,
        calendarId: calendarId,
        startTime: start,
        endTime: end,
        notes: notes || null,
        totalPrice: price,
        status: 'CONFIRMED',
      },
      include: {
        patient: { select: { fullName: true, phone: true }},
        service: { select: { name: true }}
      }
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/appointments/book:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
