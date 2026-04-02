export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, startTime, notes } = body;

    // Identify current appointment to calculate its endTime if startTime changes
    const currentAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!currentAppt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let updatedData: any = {
      ...(status && { status }),
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
      const rules = await prisma.availabilityRule.findMany({
         where: {
            subaccountId: currentAppt.subaccountId,
            dayOfWeek: panamaDate.getDay()
         }
      });

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

      // Basic Overlap validation check (excluding current appointment)
      const overlappingAppt = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          status: { notIn: ['CANCELLED'] },
          OR: [
            {
              startTime: { lt: end },
              endTime: { gt: start },
            }
          ]
        }
      });

      if (overlappingAppt && !currentAppt.isBlocker) {
        return NextResponse.json(
          { error: 'Reprogramming time slot is already booked.' },
          { status: 409 }
        );
      }

      updatedData.startTime = start;
      updatedData.endTime = end;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updatedData,
    });

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
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json({ message: 'Appointment cancelled successfully', appointment });
    }
  } catch (error) {
    console.error('Error deleting/cancelling appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
