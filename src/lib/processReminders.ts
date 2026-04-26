import prisma from '@/lib/prisma';

const WEBHOOK_URL = 'https://n8n-n8n.nqi4z7.easypanel.host/webhook/9c94c728-d62c-4717-86eb-8f9bab9a5d3a';

const REMINDER_WINDOWS = [
  { reminderNumber: 1, msBeforeAppointment: 3 * 24 * 60 * 60 * 1000, toleranceMs: 30 * 60 * 1000 },
  { reminderNumber: 2, msBeforeAppointment: 24 * 60 * 60 * 1000,      toleranceMs: 30 * 60 * 1000 },
  { reminderNumber: 3, msBeforeAppointment: 1 * 60 * 60 * 1000,       toleranceMs: 15 * 60 * 1000 },
];

export async function processReminders(forceMode = false) {
  const now = Date.now();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const window of REMINDER_WINDOWS) {
    let appointments;

    if (forceMode) {
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
      } catch (err) {
        errors.push(`appt ${appt.id} reminder ${window.reminderNumber}: ${(err as Error).message}`);
      }
    }
  }

  if (errors.length > 0) console.error('[reminders] errors:', errors);
  console.log(`[reminders] done — sent: ${sent}, skipped: ${skipped}`);
  return { sent, skipped, errors };
}
