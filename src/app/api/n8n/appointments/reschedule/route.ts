export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { sendAppointmentEmail } from '@/lib/mail';
import { es } from 'date-fns/locale/es';

const PANAMA_TZ = 'America/Panama';

export async function PUT(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const body = await request.json();
    let { phone, oldStartTime, newStartTime, id, newCalendarId, subaccountId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !oldStartTime || !newStartTime) {
      return NextResponse.json({ success: false, error: 'phone, oldStartTime, and newStartTime are required' }, { status: 400 });
    }

    phone = (phone || id)?.toString()?.replace(/\+/g, '').trim();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone or id must not be empty' }, { status: 400 });
    }

    // 1. Find Patient scoped to this account
    const patient = await prisma.patient.findUnique({
      where: { phone_accountId: { phone, accountId: account.id } },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found based on phone number' }, { status: 404 });
    }

    // 2. Find specific active appointment
    // Robust date parsing (detect UTC 'Z' or offset, otherwise fallback to Panama local)
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('Z') || /[\+\-]\d{2}:\d{2}$/.test(dateStr)) {
        return new Date(dateStr);
      }
      return fromZonedTime(dateStr.substring(0, 19), PANAMA_TZ);
    };

    const oldStart = parseDate(oldStartTime);
    if (!oldStart) return NextResponse.json({ success: false, error: 'Invalid oldStartTime' }, { status: 400 });

    // Use a 125-minute window centered on the target time to be extremely robust
    // This catches 1-hour timezone shifts (DST or offset mismatches)
    const rangeStart = new Date(oldStart.getTime() - 125 * 60000);
    const rangeEnd = new Date(oldStart.getTime() + 125 * 60000);

    // IMPORTANT: We REMOVE the subaccountId filter from the search phase
    // because n8n might send the wrong subaccountId for the existing appointment.
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        startTime: { gte: rangeStart, lte: rangeEnd },
        status: { notIn: ['CANCELLED'] },
      },
      include: { service: true },
      orderBy: { 
        // Closest to target time
        startTime: 'asc' 
      }
    });

    if (!appointment) {
      // DEBUG: Find all active appointments for this patient to help the user
      const allAppts = await prisma.appointment.findMany({
        where: { patientId: patient.id, status: { notIn: ['CANCELLED'] } },
        orderBy: { startTime: 'asc' },
        take: 5
      });
      const existingTimes = allAppts.map(a => a.startTime.toISOString()).join(', ');
      return NextResponse.json({ 
        success: false, 
        error: `No se encontró cita activa cerca de ${oldStart.toISOString()}. Citas encontradas para este paciente: [${existingTimes || 'Ninguna'}]. Asegúrate de usar el formato YYYY-MM-DDTHH:mm:ssZ.` 
      }, { status: 404 });
    }

    // 3. Overlap Check for new time
    const newStart = parseDate(newStartTime);
    if (!newStart) return NextResponse.json({ success: false, error: 'Invalid newStartTime' }, { status: 400 });

    let duration = appointment.service?.durationMinutes || 30;
    let targetCalendarId = newCalendarId || appointment.calendarId;

    if (targetCalendarId && appointment.serviceId) {
      const config = await prisma.serviceConfiguration.findUnique({
        where: { serviceId_calendarId: { serviceId: appointment.serviceId, calendarId: targetCalendarId } },
      });
      if (config) {
        duration = config.durationMinutes;
      }
    }

    const newEnd = new Date(newStart.getTime() + duration * 60000);

    let finalSubaccountId = subaccountId || appointment.subaccountId;
    if (finalSubaccountId) {
      const panamaDate = toZonedTime(newStart, PANAMA_TZ);
      const rules = await prisma.availabilityRule.findMany({
        where: { subaccountId: finalSubaccountId, dayOfWeek: panamaDate.getDay() },
      });

      if (rules.length === 0) {
        return NextResponse.json({ success: false, error: 'La clínica está cerrada en este día, no hay horarios disponibles.' }, { status: 400 });
      }

      const rule = rules[0];
      const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
      const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, PANAMA_TZ);
      const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, PANAMA_TZ);

      if (newStart < workStart || newEnd > workEnd) {
        return NextResponse.json({ success: false, error: `El horario debe estar dentro de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
      }
    }

    let overlapWhere: any = {
      id: { not: appointment.id },
      status: { notIn: ['CANCELLED'] },
      OR: [{ startTime: { lt: newEnd }, endTime: { gt: newStart } }],
    };
    if (targetCalendarId) {
      overlapWhere.calendarId = targetCalendarId;
    }

    const overlappingAppt = await prisma.appointment.findFirst({ where: overlapWhere });
    if (overlappingAppt) {
      return NextResponse.json({ success: false, error: 'New time slot overlaps with another appointment' }, { status: 409 });
    }

    // 4. Apply Reschedule
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        calendarId: targetCalendarId !== undefined ? targetCalendarId : undefined,
      },
      include: {
        patient: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    // --- Enviar correos de notificación ---
    try {
      const dateStr = format(updatedAppointment.startTime, "EEEE d 'de' MMMM", { locale: es });
      const startStr = format(updatedAppointment.startTime, "HH:mm");
      const endStr = format(updatedAppointment.endTime, "HH:mm");

      // 1. Enviar al Paciente
      if (patient.email) {
        await sendAppointmentEmail({
          to: patient.email,
          subject: 'Tu Cita ha sido Modificada - Master Haven',
          patientName: patient.fullName,
          serviceName: updatedAppointment.service?.name || 'Servicio',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: false,
          type: 'RESCHEDULE'
        });
      }

      // 2. Enviar a los administradores de la cuenta
      const fullAccount = await prisma.account.findUnique({
        where: { id: account.id },
        include: { users: { where: { role: 'ADMIN' } } }
      });
      
      const adminEmails = fullAccount?.users.map(u => u.email).filter(Boolean) as string[] || [];
      for (const adminEmail of adminEmails) {
        await sendAppointmentEmail({
          to: adminEmail,
          subject: 'Cita Reprogramada (n8n)',
          patientName: patient.fullName,
          serviceName: updatedAppointment.service?.name || 'Servicio',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: true,
          type: 'RESCHEDULE'
        });
      }
    } catch (mailError) {
      console.error('Error in email notification flow (reschedule n8n):', mailError);
    }

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/reschedule:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
