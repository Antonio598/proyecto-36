export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
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
    const { name, durationMinutes, price, colorCode, isActive } = body;

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

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

