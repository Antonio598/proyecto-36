export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const WEBHOOK_URL = 'https://n8n-n8n.nqi4z7.easypanel.host/webhook/9c94c728-d62c-4717-86eb-8f9bab9a5d3a';

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

/** GET — diagnostic: shows next upcoming appointments and their reminder status */
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
    const hoursUntil = msUntil / 3600000;
    const remindersSent = appt.reminders.map(r => r.reminderNumber);
    const windows = REMINDER_WINDOWS.map(w => {
      const targetMs = w.msBeforeAppointment;
      const inWindow = Math.abs(msUntil - targetMs) <= w.toleranceMs;
      const alreadySent = remindersSent.includes(w.reminderNumber);
      return {
        reminderNumber: w.reminderNumber,
        label: w.reminderNumber === 1 ? '3 días' : w.reminderNumber === 2 ? '24h' : '1h',
        inWindowNow: inWindow,
        alreadySent,
        wouldFire: inWindow && !alreadySent,
      };
    });
    return {
      id:           appt.id,
      patient:      appt.patient?.fullName,
      phone:        appt.patient?.phone,
      service:      appt.service?.name,
      startTime:    appt.startTime.toISOString(),
      hoursUntil:   Math.round(hoursUntil * 10) / 10,
      remindersSent,
      windows,
    };
  });

  return NextResponse.json({
    serverTime: now.toISOString(),
    upcomingAppointments: result.length,
    appointments: result,
  });
}

/** POST — process reminders. Add ?force=true to bypass time windows (for testing) */
export async function POST(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceMode = url.searchParams.get('force') === 'true';

  const now = Date.now();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];
  const processed: any[] = [];

  for (const window of REMINDER_WINDOWS) {
    let appointments;

    if (forceMode) {
      // In force mode: get all upcoming appointments not yet reminded for this number
      appointments = await prisma.appointment.findMany({
        where: {
          isBlocker: false,
          status: { notIn: ['CANCELLED'] },
          startTime: { gte: new Date(now) },
          reminders: { none: { reminderNumber: window.reminderNumber } },
        },
        include: {
          patient:    { select: { fullName: true, phone: true, email: true } },
          service:    { select: { name: true } },
          subaccount: { select: { name: true } },
          doctor:     { select: { name: true } },
        },
        take: 5,
      });
    } else {
      const targetTime = new Date(now + window.msBeforeAppointment);
      const rangeStart = new Date(targetTime.getTime() - window.toleranceMs);
      const rangeEnd   = new Date(targetTime.getTime() + window.toleranceMs);

      appointments = await prisma.appointment.findMany({
        where: {
          isBlocker: false,
          status: { notIn: ['CANCELLED'] },
          startTime: { gte: rangeStart, lte: rangeEnd },
          reminders: { none: { reminderNumber: window.reminderNumber } },
        },
        include: {
          patient:    { select: { fullName: true, phone: true, email: true } },
          service:    { select: { name: true } },
          subaccount: { select: { name: true } },
          doctor:     { select: { name: true } },
        },
      });
    }

    for (const appt of appointments) {
      if (!appt.patient?.phone) { skipped++; continue; }

      const payload = {
        reminderNumber: window.reminderNumber,
        appointmentId:  appt.id,
        patientName:    appt.patient.fullName,
        phone:          appt.patient.phone,
        email:          appt.patient.email ?? null,
        serviceName:    appt.service?.name ?? null,
        startTime:      appt.startTime.toISOString(),
        endTime:        appt.endTime.toISOString(),
        subaccountName: appt.subaccount?.name ?? null,
        doctorName:     appt.doctor?.name ?? null,
      };

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          errors.push(`appt ${appt.id} reminder ${window.reminderNumber}: webhook ${res.status}`);
          continue;
        }

        await prisma.reminderLog.create({
          data: { appointmentId: appt.id, reminderNumber: window.reminderNumber },
        });
        sent++;
        processed.push({ appointmentId: appt.id, patient: appt.patient.fullName, reminderNumber: window.reminderNumber });
      } catch (err) {
        errors.push(`appt ${appt.id} reminder ${window.reminderNumber}: ${(err as Error).message}`);
      }
    }
  }

  return NextResponse.json({ success: true, forceMode, sent, skipped, errors, processed });
}
