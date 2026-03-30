import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const calendarId = searchParams.get('calendarId');

    if (!subaccountId || !calendarId) {
      return NextResponse.json({ error: 'subaccountId and calendarId are required' }, { status: 400 });
    }

    // Buscamos las reglas específicas del calendario.
    const rules = await prisma.availabilityRule.findMany({
      where: {
        calendarId,
        subaccountId
      },
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

    if (!subaccountId || !calendarId || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'subaccountId, calendarId, and rules array are required' }, { status: 400 });
    }

    // Delete existing rules for this calendar
    await prisma.availabilityRule.deleteMany({
      where: { calendarId }
    });

    // Create new rules
    if (rules.length > 0) {
      const dataToInsert = rules.map((r: any) => ({
        subaccountId,
        calendarId,
        dayOfWeek: Number(r.dayOfWeek),
        startTime: r.startTime,
        endTime: r.endTime
      }));

      await prisma.availabilityRule.createMany({
        data: dataToInsert
      });
    }

    return NextResponse.json({ success: true, message: 'Rules updated successfully' });
  } catch (error: any) {
    console.error('Error saving availability rules:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}
