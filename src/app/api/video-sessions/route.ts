export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';
import { formatInTimeZone } from 'date-fns-tz';

const PANAMA_TZ = 'America/Panama';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const date = searchParams.get('date'); // YYYY-MM-DD in Panama TZ

    const patientId   = searchParams.get('patientId');
    const status      = searchParams.get('status');

    const where: any = { accountId };
    if (subaccountId) where.subaccountId = subaccountId;
    if (patientId)    where.patientId    = patientId;
    if (status)       where.status       = status;

    // Only apply date filter when not filtering by explicit status (e.g. PENDING requests have no "date")
    if (date && !status) {
      // Filter sessions that started on this Panama date
      const startUTC = new Date(`${date}T05:00:00.000Z`); // midnight Panama = 5 AM UTC
      const endUTC   = new Date(`${date}T28:59:59.999Z`); // next day midnight Panama
      where.startedAt = { gte: startUTC, lt: new Date(`${date}T05:00:00.000Z`.replace(date, getNextDate(date))) };
      // Simpler: just check startedAt >= midnight Panama, < next midnight Panama
      const dayStart = new Date(`${date}T05:00:00.000Z`);
      const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      where.startedAt = { gte: dayStart, lt: dayEnd };
    }

    const sessions = await (prisma as any).videoSession.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctor:  { select: { id: true, name: true } },
        consultation: { select: { id: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('[video-sessions GET]', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subaccountId, roomUrl, roomName, appointmentId, patientId, doctorId } = body;

    if (!roomUrl || !roomName) {
      return NextResponse.json({ error: 'roomUrl and roomName are required' }, { status: 400 });
    }

    const session = await (prisma as any).videoSession.create({
      data: {
        accountId,
        subaccountId: subaccountId || null,
        roomUrl,
        roomName,
        appointmentId: appointmentId || null,
        patientId: patientId || null,
        doctorId: doctorId || null,
        status: 'OPEN',
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctor:  { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error('[video-sessions POST]', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getNextDate(date: string): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}
