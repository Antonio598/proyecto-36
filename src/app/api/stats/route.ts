export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const PANAMA_TZ = 'America/Panama';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId') || null;

    // Validate subaccount ownership
    if (subaccountId) {
      const sub = await prisma.subaccount.findFirst({ where: { id: subaccountId, accountId } });
      if (!sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Scope: all subaccounts of the account, or just the selected one
    let subaccountIds: string[];
    if (subaccountId) {
      subaccountIds = [subaccountId];
    } else {
      const subs = await prisma.subaccount.findMany({ where: { accountId }, select: { id: true } });
      subaccountIds = subs.map(s => s.id);
    }

    if (subaccountIds.length === 0) {
      return NextResponse.json({
        todayAppointments: 0,
        yesterdayAppointments: 0,
        newPatientsThisMonth: 0,
        newPatientsLastMonth: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        upcomingToday: [],
      });
    }

    // --- Date ranges in Panama TZ ---
    const nowPanama = toZonedTime(new Date(), PANAMA_TZ);
    const todayStr = formatInTimeZone(new Date(), PANAMA_TZ, 'yyyy-MM-dd');
    const yesterdayStr = formatInTimeZone(
      new Date(Date.now() - 86400000), PANAMA_TZ, 'yyyy-MM-dd'
    );

    const todayStart = fromZonedTime(`${todayStr}T00:00:00`, PANAMA_TZ);
    const todayEnd   = fromZonedTime(`${todayStr}T23:59:59`, PANAMA_TZ);
    const yestStart  = fromZonedTime(`${yesterdayStr}T00:00:00`, PANAMA_TZ);
    const yestEnd    = fromZonedTime(`${yesterdayStr}T23:59:59`, PANAMA_TZ);

    const thisMonthStart = fromZonedTime(
      startOfMonth(nowPanama).toISOString().substring(0, 10) + 'T00:00:00', PANAMA_TZ
    );
    const thisMonthEnd = fromZonedTime(
      endOfMonth(nowPanama).toISOString().substring(0, 10) + 'T23:59:59', PANAMA_TZ
    );
    const lastMonthStart = fromZonedTime(
      startOfMonth(subMonths(nowPanama, 1)).toISOString().substring(0, 10) + 'T00:00:00', PANAMA_TZ
    );
    const lastMonthEnd = fromZonedTime(
      endOfMonth(subMonths(nowPanama, 1)).toISOString().substring(0, 10) + 'T23:59:59', PANAMA_TZ
    );

    const apptFilter = { subaccountId: { in: subaccountIds }, status: { notIn: ['CANCELLED' as const] }, isBlocker: false };

    // Run all queries in parallel
    const [
      todayCount,
      yesterdayCount,
      thisMonthRevenue,
      lastMonthRevenue,
      newPatientsThisMonth,
      newPatientsLastMonth,
      upcomingRaw,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { ...apptFilter, startTime: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.count({
        where: { ...apptFilter, startTime: { gte: yestStart, lte: yestEnd } },
      }),
      prisma.appointment.aggregate({
        where: { ...apptFilter, status: 'CONFIRMED', startTime: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.appointment.aggregate({
        where: { ...apptFilter, status: 'CONFIRMED', startTime: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.patient.count({
        where: { accountId, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      prisma.patient.count({
        where: { accountId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.appointment.findMany({
        where: {
          ...apptFilter,
          startTime: { gte: new Date(), lte: todayEnd },
        },
        include: {
          patient: { select: { fullName: true } },
          service: { select: { name: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 8,
      }),
    ]);

    const upcomingToday = upcomingRaw.map(a => ({
      id: a.id,
      patient: a.patient?.fullName ?? 'Paciente',
      service: a.service?.name ?? 'Servicio',
      time: formatInTimeZone(a.startTime, PANAMA_TZ, 'HH:mm'),
      status: a.status === 'CONFIRMED' ? 'Confirmada' : 'Pendiente',
    }));

    return NextResponse.json({
      todayAppointments: todayCount,
      yesterdayAppointments: yesterdayCount,
      newPatientsThisMonth,
      newPatientsLastMonth,
      revenueThisMonth: Number(thisMonthRevenue._sum.totalPrice ?? 0),
      revenueLastMonth: Number(lastMonthRevenue._sum.totalPrice ?? 0),
      upcomingToday,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
