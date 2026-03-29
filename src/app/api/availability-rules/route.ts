import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');

    if (!subaccountId && !calendarId) {
      return NextResponse.json({ error: 'subaccountId or calendarId is required' }, { status: 400 });
    }

    // Si pasamos calendarId, buscamos las reglas específicas del calendario.
    // Si no, buscamos las de la sede (donde calendarId es null).
    const whereClause: any = {};
    if (calendarId) {
      whereClause.calendarId = calendarId;
    } else if (subaccountId) {
      whereClause.subaccountId = subaccountId;
      whereClause.calendarId = null; // Solo reglas globales de la sede
    }

    const rules = await prisma.availabilityRule.findMany({
      where: whereClause,
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching availability rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subaccountId, calendarId, rules } = body;

    if (!subaccountId || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'subaccountId and rules array are required' }, { status: 400 });
    }

    // Delete existing rules for this scope
    if (calendarId) {
      await prisma.availabilityRule.deleteMany({
        where: { calendarId } as any
      });
    } else {
      await prisma.availabilityRule.deleteMany({
        where: { subaccountId, calendarId: null } as any
      });
    }

    // Create new rules
    if (rules.length > 0) {
      const dataToInsert = rules.map((r: any) => ({
        subaccountId,
        calendarId: calendarId || null,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime
      }));

      await prisma.availabilityRule.createMany({
        data: dataToInsert as any
      });
    }

    return NextResponse.json({ success: true, message: 'Rules updated successfully' });
  } catch (error) {
    console.error('Error saving availability rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
