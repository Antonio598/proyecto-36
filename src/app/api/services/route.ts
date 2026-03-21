export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        configurations: {
          include: { doctor: true, subaccount: true }
        }
      }
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, durationMinutes, price, colorCode, isActive, doctorId } = body;

    // Validation
    if (!name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'Name, durationMinutes, and price are required' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        durationMinutes: parseInt(durationMinutes as string, 10),
        price: parseFloat(price as string),
        colorCode: colorCode || '#3b82f6',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    if (doctorId) {
      // Find doctor's subaccount and calendar. Create a calendar if they don't have one to link the config.
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { calendars: true },
      });
      if (doctor) {
        let calendar = doctor.calendars[0];
        if (!calendar) {
          calendar = await prisma.calendar.create({
            data: {
              name: 'Calendario Principal',
              doctorId: doctor.id,
              subaccountId: doctor.subaccountId
            }
          });
        }
        await prisma.serviceConfiguration.create({
          data: {
            serviceId: service.id,
            calendarId: calendar.id,
            doctorId: doctor.id,
            subaccountId: doctor.subaccountId,
            price: service.price,
            durationMinutes: service.durationMinutes
          }
        });
      }
    }

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
