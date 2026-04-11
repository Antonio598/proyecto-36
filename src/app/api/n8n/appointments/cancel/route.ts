export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountByApiKey, extractApiKey } from '@/lib/accountAuth';
import { fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { sendAppointmentEmail } from '@/lib/mail';
import { es } from 'date-fns/locale/es';

const PANAMA_TZ = 'America/Panama';

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const account = await getAccountByApiKey(apiKey);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key (x-api-key header).' }, { status: 401 });
    }

    const body = await request.json();
    let { phone, startTime, id, subaccountId } = body;
    phone = (phone || id)?.toString();

    if (!phone || !startTime) {
      return NextResponse.json({ success: false, error: 'phone and startTime are required' }, { status: 400 });
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

    const targetStart = parseDate(startTime);
    if (!targetStart) return NextResponse.json({ success: false, error: 'Invalid startTime' }, { status: 400 });

    // Use a 125-minute window centered on the target time to be extremely robust
    // This catches 1-hour timezone shifts (DST or offset mismatches)
    const rangeStart = new Date(targetStart.getTime() - 125 * 60000);
    const rangeEnd = new Date(targetStart.getTime() + 125 * 60000);

    // IMPORTANT: We REMOVE the subaccountId filter from the search phase
    // because n8n might send the wrong subaccountId for the existing appointment.
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        startTime: { gte: rangeStart, lte: rangeEnd },
        status: { notIn: ['CANCELLED'] },
      },
      orderBy: { startTime: 'asc' }
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
        error: `No se encontró cita activa cerca de ${targetStart.toISOString()}. Citas encontradas para este paciente: [${existingTimes || 'Ninguna'}].` 
      }, { status: 404 });
    }

    // 3. Mark as cancelled
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
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
          subject: 'Cita Cancelada - Master Haven',
          patientName: patient.fullName,
          serviceName: updatedAppointment.service?.name || 'Servicio',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: false,
          type: 'CANCEL'
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
          subject: 'Cita Cancelada (n8n)',
          patientName: patient.fullName,
          serviceName: updatedAppointment.service?.name || 'Servicio',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isOwner: true,
          type: 'CANCEL'
        });
      }
    } catch (mailError) {
      console.error('Error in email notification flow (cancel n8n):', mailError);
    }

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error in n8n/appointments/cancel:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
