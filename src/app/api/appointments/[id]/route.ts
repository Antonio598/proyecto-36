export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAppointmentEmail } from '@/lib/mail';
import { es } from 'date-fns/locale/es';
import { formatInTimeZone } from 'date-fns-tz';

const PANAMA_TZ = 'America/Panama';

// PATCH — only update status/paymentStatus (used by calendar modal)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Use raw SQL to bypass enum type restrictions for new status values
    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status) {
      setParts.push(`"status" = $${idx++}::"AppointmentStatus"`);
      values.push(status);
    }
    if (paymentStatus !== undefined) {
      setParts.push(`"paymentStatus" = $${idx++}`);
      values.push(paymentStatus);
      if (paymentStatus === 'PAID') {
        setParts.push(`"paidAt" = NOW()`);
      }
    }

    if (setParts.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    values.push(id);
    await prisma.$executeRawUnsafe(
      `UPDATE "Appointment" SET ${setParts.join(', ')}, "updatedAt" = NOW() WHERE id = $${idx}`,
      ...values
    );

    // Auto-create or update Transaction when status = ATTENDED or paymentStatus = PAID
    if ((status === 'ATTENDED' || paymentStatus === 'PAID') && appt.patientId && appt.totalPrice && appt.subaccountId) {
      try {
        const subaccount = await prisma.subaccount.findUnique({ where: { id: appt.subaccountId }, select: { accountId: true } });
        if (subaccount?.accountId) {
          const existingTx = await prisma.transaction.findUnique({ where: { appointmentId: id } });
          if (existingTx) {
            await prisma.transaction.update({
              where: { appointmentId: id },
              data: { status: paymentStatus === 'PAID' ? 'PAID' : existingTx.status }
            });
          } else {
            await prisma.transaction.create({
              data: {
                accountId: subaccount.accountId,
                subaccountId: appt.subaccountId,
                appointmentId: id,
                amount: appt.totalPrice,
                type: 'APPOINTMENT',
                status: paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
              }
            });
          }
        }
      } catch (txError) {
        console.error('[transactions] Error upserting transaction:', txError);
      }
    }

    const updated = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, service: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error patching appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { startTime, notes } = body;
    // status is intentionally excluded — use PATCH /api/appointments/[id] for status changes.
    // Sending status via PUT would fail if the value is an enum value added via raw SQL
    // (e.g. ATTENDED, ABSENT) that is not present in the Prisma-generated enum type.

    // Identify current appointment to calculate its endTime if startTime changes
    const currentAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!currentAppt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let updatedData: any = {
      ...(notes !== undefined && { notes }),
    };

    if (startTime) {
      const { fromZonedTime, toZonedTime } = require('date-fns-tz');
      const { format } = require('date-fns');
      const PANAMA_TZ = 'America/Panama';

      const naiveStartTime = (startTime as string).replace('Z', '').split('+')[0];
      const start = fromZonedTime(naiveStartTime, PANAMA_TZ);
      
      const durationMs = currentAppt.endTime.getTime() - currentAppt.startTime.getTime();
      const end = new Date(start.getTime() + durationMs);
      
      const panamaDate = toZonedTime(start, PANAMA_TZ);

      // Availability check
      let rules: any[] = [];
      if (currentAppt.calendarId) {
        rules = await prisma.availabilityRule.findMany({
           where: { calendarId: currentAppt.calendarId, dayOfWeek: panamaDate.getDay() }
        });
      }
      
      if (rules.length === 0) {
        rules = await prisma.availabilityRule.findMany({
           where: { subaccountId: currentAppt.subaccountId, calendarId: null, dayOfWeek: panamaDate.getDay() }
        });
      }

      if (rules.length === 0 && !currentAppt.isBlocker) {
         return NextResponse.json({ error: 'La clínica está cerrada en este día, no hay horarios disponibles.' }, { status: 400 });
      }

      if (rules.length > 0 && !currentAppt.isBlocker) {
         const rule = rules[0];
         const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
         const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
         const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

         if (start < workStart || end > workEnd) {
            return NextResponse.json({ error: `El horario debe estar dentro de la disponibilidad (${rule.startTime} - ${rule.endTime}).` }, { status: 400 });
         }
      }

      // Overlap check — scope to the same calendar (or subaccount if no calendar)
      // to avoid false conflicts between different doctors' schedules.
      const overlapWhere: any = {
        id: { not: id },
        status: { notIn: ['CANCELLED'] },
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      };
      if (currentAppt.calendarId) {
        overlapWhere.calendarId = currentAppt.calendarId;
      } else if (currentAppt.subaccountId) {
        overlapWhere.subaccountId = currentAppt.subaccountId;
      }

      const overlappingAppt = await prisma.appointment.findFirst({ where: overlapWhere });

      if (overlappingAppt && !currentAppt.isBlocker) {
        return NextResponse.json(
          { error: 'El horario seleccionado ya está ocupado en este calendario.' },
          { status: 409 }
        );
      }

      updatedData.startTime = start;
      updatedData.endTime = end;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updatedData,
      include: { patient: true, service: true, subaccount: { include: { account: { include: { users: { where: { role: 'ADMIN' } } } } } } }
    });

    // --- Enviar correos de notificación ---
    try {
      if (!appointment.isBlocker && (startTime || status === 'CONFIRMED')) {
        const dateStr  = formatInTimeZone(appointment.startTime, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
        const startStr = formatInTimeZone(appointment.startTime, PANAMA_TZ, 'HH:mm');
        const endStr   = formatInTimeZone(appointment.endTime,   PANAMA_TZ, 'HH:mm');

        const isReschedule = !!startTime;
        const type = isReschedule ? 'RESCHEDULE' : 'BOOKING';

        // 1. Al Paciente
        if (appointment.patient?.email) {
          await sendAppointmentEmail({
            to: appointment.patient.email,
            subject: isReschedule ? 'Tu Cita ha sido Modificada - Galenus AI' : 'Confirmación de tu Cita - Galenus AI',
            patientName: appointment.patient.fullName,
            serviceName: appointment.service?.name || 'Servicio',
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            isOwner: false,
            type
          });
        }

        // 2. A los administradores
        const adminEmails = appointment.subaccount?.account?.users.map(u => u.email).filter(Boolean) as string[] || [];
        for (const email of adminEmails) {
          await sendAppointmentEmail({
            to: email,
            subject: isReschedule ? 'Cita Reprogramada' : 'Nueva Cita Agendada',
            patientName: appointment.patient?.fullName || 'Paciente',
            serviceName: appointment.service?.name || 'Servicio',
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            isOwner: true,
            type
          });
        }
      }
    } catch (mailError) {
      console.error('Error sending update notification:', mailError);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if it's a blocker or a regular appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      select: { isBlocker: true }
    });

    if (!currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (currentAppointment.isBlocker) {
      // Hard delete for blockers
      const appointment = await prisma.appointment.delete({
        where: { id }
      });
      return NextResponse.json({ message: 'Blocker deleted successfully', appointment });
    } else {
      // Soft-delete/CANCELLED for regular appointments
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { patient: true, service: true, subaccount: { include: { account: { include: { users: { where: { role: 'ADMIN' } } } } } } }
      });

      // --- Enviar correos de notificación ---
      try {
        const dateStr  = formatInTimeZone(appointment.startTime, PANAMA_TZ, "EEEE d 'de' MMMM", { locale: es });
        const startStr = formatInTimeZone(appointment.startTime, PANAMA_TZ, 'HH:mm');
        const endStr   = formatInTimeZone(appointment.endTime,   PANAMA_TZ, 'HH:mm');

        // 1. Al Paciente
        if (appointment.patient?.email) {
          await sendAppointmentEmail({
            to: appointment.patient.email,
            subject: 'Cita Cancelada - Galenus AI',
            patientName: appointment.patient.fullName,
            serviceName: appointment.service?.name || 'Servicio',
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            isOwner: false,
            type: 'CANCEL'
          });
        }

        // 2. A los administradores
        const adminEmails = appointment.subaccount?.account?.users.map(u => u.email).filter(Boolean) as string[] || [];
        for (const email of adminEmails) {
          await sendAppointmentEmail({
            to: email,
            subject: 'Cita Cancelada',
            patientName: appointment.patient?.fullName || 'Paciente',
            serviceName: appointment.service?.name || 'Servicio',
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            isOwner: true,
            type: 'CANCEL'
          });
        }
      } catch (mailError) {
        console.error('Error sending cancel notification:', mailError);
      }

      return NextResponse.json({ message: 'Appointment cancelled successfully', appointment });
    }
  } catch (error) {
    console.error('Error deleting/cancelling appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
