export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processReminders } from '@/lib/processReminders';

const REMINDER_WINDOWS = [
  { reminderNumber: 1, msBeforeAppointment: 3 * 24 * 60 * 60 * 1000, toleranceMs: 30 * 60 * 1000 },
  { reminderNumber: 2, msBeforeAppointment: 24 * 60 * 60 * 1000,      toleranceMs: 30 * 60 * 1000 },
  { reminderNumber: 3, msBeforeAppointment: 1 * 60 * 60 * 1000,       toleranceMs: 15 * 60 * 1000 },
];

function checkSecret(request: Request): boolean {
  const secret = process.env.REMINDERS_SECRET;
  if (!secret) return true;
  return request.headers.get('x-reminders-secret') === secret;
}

/** GET — diagnostic: shows upcoming appointments and reminder status */
export async function GET(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      isBlocker: false,
      status: { notIn: ['CANCELLED'] },
      startTime: { gte: now, lte: in4Days },
    },
    include: {
      patient:    { select: { fullName: true, phone: true, email: true } },
      service:    { select: { name: true } },
      subaccount: { select: { name: true } },
      doctor:     { select: { name: true } },
      reminders:  true,
    },
    orderBy: { startTime: 'asc' },
    take: 20,
  });

  const now_ms = Date.now();

  const result = appointments.map(appt => {
    const msUntil = appt.startTime.getTime() - now_ms;
    const remindersSent = appt.reminders.map(r => r.reminderNumber);
    const windows = REMINDER_WINDOWS.map(w => ({
      reminderNumber: w.reminderNumber,
      label:          w.reminderNumber === 1 ? '3 días' : w.reminderNumber === 2 ? '24h' : '1h',
      inWindowNow:    Math.abs(msUntil - w.msBeforeAppointment) <= w.toleranceMs,
      alreadySent:    remindersSent.includes(w.reminderNumber),
    }));
    return {
      id:          appt.id,
      patient:     appt.patient?.fullName,
      phone:       appt.patient?.phone,
      service:     appt.service?.name,
      startTime:   appt.startTime.toISOString(),
      hoursUntil:  Math.round((msUntil / 3600000) * 10) / 10,
      remindersSent,
      windows,
    };
  });

  return NextResponse.json({ serverTime: now.toISOString(), appointments: result });
}

/** POST — manual trigger (used for testing) */
export async function POST(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceMode = url.searchParams.get('force') === 'true';
  const result = await processReminders(forceMode);

  return NextResponse.json({ success: true, forceMode, ...result });
}
