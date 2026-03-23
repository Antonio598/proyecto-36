import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId is required' }, { status: 400 });
    }

    const rules = await prisma.availabilityRule.findMany({
      where: { subaccountId },
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
    const { subaccountId, rules } = body;

    if (!subaccountId || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'subaccountId and rules array are required' }, { status: 400 });
    }

    // Delete existing rules for this subaccount
    await prisma.availabilityRule.deleteMany({
      where: { subaccountId }
    });

    // Create new rules
    if (rules.length > 0) {
      const dataToInsert = rules.map((r: any) => ({
        subaccountId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime
      }));

      await prisma.availabilityRule.createMany({
        data: dataToInsert
      });
    }

    return NextResponse.json({ success: true, message: 'Rules updated successfully' });
  } catch (error) {
    console.error('Error saving availability rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
