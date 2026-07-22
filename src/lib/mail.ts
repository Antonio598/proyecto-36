import nodemailer from 'nodemailer';

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[mail] GMAIL_USER o GMAIL_APP_PASSWORD no configurados. Correos desactivados.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

export async function sendAppointmentEmail({
  to,
  subject,
  patientName,
  serviceName,
  sedeName,
  doctorName,
  date,
  startTime,
  endTime,
  isOwner = false,
  type = 'BOOKING'
}: {
  to: string;
  subject: string;
  patientName: string;
  serviceName: string;
  sedeName?: string;
  doctorName?: string;
  date: string;
  startTime: string;
  endTime: string;
  isOwner?: boolean;
  type?: 'BOOKING' | 'RESCHEDULE' | 'CANCEL';
}) {
  const transport = createTransport();
  if (!transport) return;

  const getTitle = () => {
    if (type === 'CANCEL') return isOwner ? 'Cita Cancelada' : 'Confirmación de Cancelación';
    if (type === 'RESCHEDULE') return isOwner ? 'Cita Re-agendada' : 'Tu Cita ha sido Modificada';
    return isOwner ? 'Nueva Cita Agendada' : 'Confirmación de Cita';
  };

  const getMessage = () => {
    if (type === 'CANCEL') {
      return isOwner
        ? `Hola, la cita de <strong>${patientName}</strong> ha sido cancelada.`
        : `Hola <strong>${patientName}</strong>, tu cita ha sido cancelada exitosamente.`;
    }
    if (type === 'RESCHEDULE') {
      return isOwner
        ? `Hola, se ha modificado el horario de una cita en tu cuenta.`
        : `Hola <strong>${patientName}</strong>, tu cita ha sido reprogramada con éxito. Aquí tienes los nuevos detalles:`;
    }
    return isOwner
      ? `Hola, se ha agendado una nueva cita en tu cuenta.`
      : `Hola <strong>${patientName}</strong>, tu cita ha sido confirmada exitosamente.`;
  };

  const colorMain  = type === 'CANCEL' ? '#ef4444' : (type === 'RESCHEDULE' ? '#f59e0b' : (isOwner ? '#1e293b' : '#0369a1'));
  const colorBg    = type === 'CANCEL' ? '#fef2f2' : (type === 'RESCHEDULE' ? '#fffbeb' : (isOwner ? '#f8fafc' : '#f0f9ff'));
  const colorBorder = type === 'CANCEL' ? '#fecaca' : (type === 'RESCHEDULE' ? '#fde68a' : (isOwner ? '#e2e8f0' : '#bae6fd'));

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid ${colorBorder}; border-radius: 12px; background-color: ${colorBg};">
      <h1 style="color: ${colorMain}; font-size: 24px; font-weight: 800; margin-bottom: 20px;">${getTitle()}</h1>
      <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">${getMessage()}</p>

      <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid ${colorBorder};">
        ${isOwner ? `<p style="margin: 8px 0;"><strong>👤 Paciente:</strong> ${patientName}</p>` : ''}
        <p style="margin: 8px 0;"><strong>💉 Servicio:</strong> ${serviceName}</p>
        ${sedeName ? `<p style="margin: 8px 0;"><strong>🏥 Sede:</strong> ${sedeName}</p>` : ''}
        ${doctorName ? `<p style="margin: 8px 0;"><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>` : ''}
        <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${date}</p>
        <p style="margin: 8px 0;"><strong>⏰ Horario:</strong> ${startTime} - ${endTime}</p>
      </div>

      ${type !== 'CANCEL' ? `<p style="color: ${colorMain}; font-size: 16px; margin-top: 20px;">${isOwner ? 'Revisa tu panel para más detalles.' : '¡Te esperamos!'}</p>` : ''}

      <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Este es un mensaje automático del sistema de gestión de citas de Galenus AI.
        ${!isOwner ? 'Si deseas realizar cambios, por favor contáctanos.' : ''}
      </p>
    </div>
  `;

  try {
    const from = `Galenus AI <${process.env.GMAIL_USER}>`;
    await transport.sendMail({ from, to, subject: subject || getTitle(), html });
    console.log(`[mail] Correo ${type} enviado a ${to}`);
  } catch (error) {
    console.error(`[mail] Error enviando correo ${type} a ${to}:`, error);
  }
}

export async function sendTeleconsultaRequestEmail({
  to,
  patientName,
  patientPhone,
  doctorName,
  reason,
  preferredDate,
  preferredTime,
}: {
  to: string;
  patientName: string;
  patientPhone: string;
  doctorName?: string;
  reason?: string;
  preferredDate?: string;
  preferredTime?: string;
}) {
  const transport = createTransport();
  if (!transport) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #c7d2fe; border-radius: 12px; background-color: #f5f3ff;">
      <h1 style="color: #4338ca; font-size: 22px; font-weight: 800; margin-bottom: 8px;">📹 Nueva Solicitud de Teleconsulta</h1>
      <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">
        Un paciente ha solicitado una teleconsulta a través del directorio. Puedes verla y aceptarla en tu panel.
      </p>

      <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #c7d2fe;">
        <p style="margin: 8px 0;"><strong>👤 Paciente:</strong> ${patientName}</p>
        <p style="margin: 8px 0;"><strong>📞 Teléfono:</strong> ${patientPhone}</p>
        ${doctorName   ? `<p style="margin: 8px 0;"><strong>👨‍⚕️ Médico solicitado:</strong> ${doctorName}</p>` : ''}
        ${reason       ? `<p style="margin: 8px 0;"><strong>💬 Motivo:</strong> ${reason}</p>` : ''}
        ${preferredDate ? `<p style="margin: 8px 0;"><strong>📅 Fecha preferida:</strong> ${preferredDate}${preferredTime ? ` a las ${preferredTime}` : ''}</p>` : ''}
      </div>

      <p style="color: #4338ca; font-size: 14px; margin-top: 20px;">
        Ingresa a tu panel de <strong>Teleconsulta → Solicitudes pendientes</strong> para aceptar o rechazar esta solicitud.
      </p>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Este es un mensaje automático de Galenus AI.
      </p>
    </div>
  `;

  try {
    const from = `Galenus AI <${process.env.GMAIL_USER}>`;
    await transport.sendMail({
      from,
      to,
      subject: `Nueva solicitud de teleconsulta — ${patientName}`,
      html,
    });
    console.log(`[mail] Correo teleconsulta enviado a ${to}`);
  } catch (error) {
    console.error('[mail] Error enviando correo teleconsulta:', error);
  }
}
