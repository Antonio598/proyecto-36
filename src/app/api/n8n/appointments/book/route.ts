export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { sendAppointmentEmail } from '@/lib/mail';
import { es } from 'date-fns/locale/es';
import { format } from 'date-fns';

const PANAMA_TZ = 'America/Panama';

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const body = await request.json();
    let { phone, fullName, email, serviceId, startTime, notes, id, subaccountId, doctorId, calendarId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !fullName || !serviceId || !startTime) {
      return NextResponse.json({ success: false, error: 'phone, fullName, serviceId, and startTime are required' }, { status: 400 });
    }

    phone = phone.trim();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone or id must not be empty' }, { status: 400 });
    }

    // 1. Verify Service exists and belongs to this account
    const service = await prisma.service.findFirst({
      where: { id: serviceId, subaccount: { accountId: account.id } },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ success: false, error: 'Service invalid or inactive' }, { status: 400 });
    }

    // 2. Resolve Patient (Upsert by Phone + Account)
    const patient = await prisma.patient.upsert({
      where: { phone_accountId: { phone, accountId: account.id } },
      update: { fullName, email: email || undefined },
      create: { phone, fullName, email, accountId: account.id, notes: notes || 'Auto-created via n8n integration' },
    });

    const PANAMA_TZ = 'America/Panama';
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('Z') || /[\+\-]\d{2}:\d{2}$/.test(dateStr)) {
        return new Date(dateStr);
      }
      return fromZonedTime(dateStr.substring(0, 19), PANAMA_TZ);
    };

    const start = parseDate(startTime);
    if (!start) return NextResponse.json({ success: false, error: 'Invalid startTime' }, { status: 400 });

    // Resolve Duration and Price dynamically
    let duration = service.durationMinutes;
    let price = service.price;
    let finalSubaccountId = subaccountId || service.subaccountId;
    let finalDoctorId = doctorId || undefined;
    let activeCalendarId = calendarId;

    if (!activeCalendarId) {
      const config = await prisma.serviceConfiguration.findFirst({
        where: { serviceId: service.id }
      });
      if (config) {
        activeCalendarId = config.calendarId;
        finalSubaccountId = finalSubaccountId || config.subaccountId;
        finalDoctorId = finalDoctorId || config.doctorId;
      } else if (finalSubaccountId) {
        const firstCal = await prisma.calendar.findFirst({
          where: { subaccountId: finalSubaccountId }
        });
        if (firstCal) activeCalendarId = firstCal.id;
      }
    }

    if (activeCalendarId) {
      const config = await prisma.serviceConfiguration.findUnique({
        where: { serviceId_calendarId: { serviceId, calendarId: activeCalendarId } },
      });
      if (config) {
        duration = config.durationMinutes;
        price = config.price;
        finalSubaccountId = finalSubaccountId || config.subaccountId;
        finalDoctorId = finalDoctorId || config.doctorId;
      }
    }

    const end = new Date(start.getTime() + duration * 60000);

    // 2.5 Verify AvailabilityRules
    const { toZonedTime } = require('date-fns-tz');
    const panamaDate = toZonedTime(start, 'America/Panama');
    const requestedDayOfWeek = panamaDate.getDay();
    let rulesWhere: any = { dayOfWeek: requestedDayOfWeek };
    if (activeCalendarId) {
      rulesWhere.OR = [
        { calendarId: activeCalendarId },
        { subaccountId: finalSubaccountId, calendarId: null }
      ];
    } else {
      rulesWhere.subaccountId = finalSubaccountId;
      rulesWhere.calendarId = null;
    }

    const rules = await prisma.availabilityRule.findMany({
      where: rulesWhere,
    });

    let rule = null;
    if (activeCalendarId) {
      rule = rules.find(r => r.calendarId === activeCalendarId) || rules.find(r => r.subaccountId === finalSubaccountId);
    } else {
      rule = rules[0];
    }

    if (!rule) {
      return NextResponse.json({ success: false, error: 'La clínica está cerrada en este día.' }, { status: 400 });
    }

    const { format } = require('date-fns');
    const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
    const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
    const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

    if (start < workStart || end > workEnd) {
      return NextResponse.json({ success: false, error: `El horario solicitado está fuera de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
    }

    // 3. Overlap Check — uses activeCalendarId (resolved), not raw calendarId
    let overlapWhere: any = {
      status: { notIn: ['CANCELLED'] },
      OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
    };
    if (activeCalendarId) {
      overlapWhere.AND = [
        {
          OR: [
            // Regular appointments or blockers in the same calendar
            { calendarId: activeCalendarId },
            // Any blocker in the same subaccount (regardless of calendarId)
            // This ensures manual time blocks from the dashboard are always respected
            { subaccountId: finalSubaccountId, isBlocker: true },
          ]
        }
      ];
    } else if (finalSubaccountId) {
      overlapWhere.subaccountId = finalSubaccountId;
    }

    const overlappingAppt = await prisma.appointment.findFirst({ where: overlapWhere });
    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'Time slot is already booked.' }, { status: 409 });
    }

    // 4. Create Appointment — save with activeCalendarId so future overlap checks find it
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        serviceId: service.id,
        subaccountId: finalSubaccountId,
        doctorId: finalDoctorId,
        calendarId: activeCalendarId || null,
        startTime: start,
        endTime: end,
        notes: notes || null,
        totalPrice: price,
        status: 'CONFIRMED',
      },
      include: {
        patient:    { select: { fullName: true, phone: true } },
        service:    { select: { name: true } },
        subaccount: { select: { name: true } },
        doctor:     { select: { name: true } },
      },
    });

    // --- Enviar correos de notificación ---
    try {
      const sedeName   = appointment.subaccount?.name;
      const doctorName = (appointment as any).doctor?.name as string | undefined;
      const dateStr  = formatInTimeZone(appointment.startTime, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
      const startStr = formatInTimeZone(appointment.startTime, PANAMA_TZ, 'HH:mm');
      const endStr   = formatInTimeZone(appointment.endTime,   PANAMA_TZ, 'HH:mm');

      // 1. Enviar al Paciente si tiene correo
      const patientEmail = email || patient.email;
      if (patientEmail) {
        await sendAppointmentEmail({
          to: patientEmail,
          subject: 'Confirmación de tu Cita - Galenus AI',
          patientName: patient.fullName,
          serviceName: appointment.service?.name || 'Servicio',
          sedeName,
          doctorName,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: false
        });
      }

      // 2. Enviar a los administradores de la cuenta
      const fullAccount = await prisma.account.findUnique({
        where: { id: account.id },
        include: { users: { where: { role: { in: ['ADMIN', 'RECEPTIONIST'] } } } }
      });

      const adminEmails = fullAccount?.users.map(u => u.email).filter(Boolean) as string[] || [];
      for (const adminEmail of adminEmails) {
        await sendAppointmentEmail({
          to: adminEmail,
          subject: 'Nueva Cita Recibida',
          patientName: patient.fullName,
          serviceName: appointment.service?.name || 'Servicio',
          sedeName,
          doctorName,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: true
        });
      }
    } catch (mailError) {
      console.error('Error in email notification flow (n8n):', mailError);
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error in n8n/appointments/book:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
