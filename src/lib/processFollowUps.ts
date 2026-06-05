import prisma from '@/lib/prisma';

const FOLLOW_UP_WEBHOOK = 'https://n8n-n8n.nqi4z7.easypanel.host/webhook/6e50af32-e45b-4d07-955b-744a04ffb8db';

const MS_1H  = 1  * 60 * 60 * 1000;
const MS_6H  = 6  * 60 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;

type ContactLogRow = {
  id: string;
  patientId: string;
  accountId: string;
  contactedAt: Date;
  isActive: boolean;
  followUp1SentAt: Date | null;
  followUp2SentAt: Date | null;
  followUp3SentAt: Date | null;
  createdAt: Date;
  patient: { id: string; fullName: string; phone: string; email: string | null; cedula_pasaporte: string | null; edad: number | null; notes: string | null };
};

export async function processFollowUps() {
  const now = new Date();

  // Only active logs where the patient has no upcoming confirmed/pending appointment
  const contacts: ContactLogRow[] = await (prisma as any).contactLog.findMany({
    where: {
      isActive: true,
      patient: {
        appointments: {
          none: {
            isBlocker: false,
            status: { notIn: ['CANCELLED'] },
            startTime: { gte: now },
          },
        },
      },
    },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, email: true, cedula_pasaporte: true, edad: true, notes: true } },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const contact of contacts) {
    const elapsed = now.getTime() - contact.contactedAt.getTime();

    // Follow-up 1: 1h after contact, never sent before
    if (!contact.followUp1SentAt && elapsed >= MS_1H) {
      const ok = await sendFollowUp(contact, 1, now);
      ok ? sent++ : errors++;

    // Follow-up 2: 6h after contact, #1 already sent, contact NOT refreshed after #1
    } else if (
      contact.followUp1SentAt &&
      !contact.followUp2SentAt &&
      elapsed >= MS_6H &&
      contact.contactedAt <= contact.followUp1SentAt
    ) {
      const ok = await sendFollowUp(contact, 2, now);
      ok ? sent++ : errors++;

    // Follow-up 3: 24h after contact, #2 already sent, contact NOT refreshed after #2
    } else if (
      contact.followUp2SentAt &&
      !contact.followUp3SentAt &&
      elapsed >= MS_24H &&
      contact.contactedAt <= contact.followUp2SentAt
    ) {
      const ok = await sendFollowUp(contact, 3, now);
      ok ? sent++ : errors++;
    }
  }

  console.log(`[followups] done — sent: ${sent}, errors: ${errors}`);
  return { sent, errors };
}

async function sendFollowUp(contact: ContactLogRow, followUpNumber: 1 | 2 | 3, now: Date): Promise<boolean> {
  const payload = {
    followUpNumber,
    contactLogId:      contact.id,
    contactedAt:       contact.contactedAt.toISOString(),
    patientId:         contact.patient.id,
    patientName:       contact.patient.fullName,
    phone:             contact.patient.phone,
    email:             contact.patient.email ?? null,
    cedula_pasaporte:  contact.patient.cedula_pasaporte ?? null,
    edad:              contact.patient.edad ?? null,
    notes:             contact.patient.notes ?? null,
  };

  try {
    const res = await fetch(FOLLOW_UP_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[followups] Webhook HTTP ${res.status} para contactLog ${contact.id} follow-up ${followUpNumber}`);
      return false;
    }

    const field = `followUp${followUpNumber}SentAt`;
    await (prisma as any).contactLog.update({
      where: { id: contact.id },
      data: { [field]: now },
    });

    console.log(`[followups] Follow-up ${followUpNumber} enviado a ${contact.patient.phone}`);
    return true;
  } catch (err) {
    console.error(`[followups] Error enviando follow-up ${followUpNumber} a ${contact.patient.phone}:`, err);
    return false;
  }
}
