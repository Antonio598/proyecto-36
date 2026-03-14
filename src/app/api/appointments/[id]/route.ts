import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
      const start = new Date(startTime);
      const end = new Date(start.getTime() + currentAppt.service.durationMinutes * 60000);
      
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

      if (overlappingAppt) {
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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // We typically soft-delete or change status to CANCELLED instead of hard delete
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    
    return NextResponse.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('Error deleting/cancelling appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
