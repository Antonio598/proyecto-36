import { Resend } from 'resend';

export async function sendAppointmentEmail({
  to,
  subject,
  patientName,
  serviceName,
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
  date: string;
  startTime: string;
  endTime: string;
  isOwner?: boolean;
  type?: 'BOOKING' | 'RESCHEDULE' | 'CANCEL';
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY no encontrada. El correo no será enviado.');
    return;
  }

  const resend = new Resend(apiKey);

  try {
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

    const colorMain = type === 'CANCEL' ? '#ef4444' : (type === 'RESCHEDULE' ? '#f59e0b' : (isOwner ? '#1e293b' : '#0369a1'));
    const colorBg = type === 'CANCEL' ? '#fef2f2' : (type === 'RESCHEDULE' ? '#fffbeb' : (isOwner ? '#f8fafc' : '#f0f9ff'));
    const colorBorder = type === 'CANCEL' ? '#fecaca' : (type === 'RESCHEDULE' ? '#fde68a' : (isOwner ? '#e2e8f0' : '#bae6fd'));

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid ${colorBorder}; border-radius: 12px; background-color: ${colorBg};">
        <h1 style="color: ${colorMain}; font-size: 24px; font-weight: 800; margin-bottom: 20px;">${getTitle()}</h1>
        <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">${getMessage()}</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid ${colorBorder};">
          ${!isOwner ? '' : `<p style="margin: 8px 0;"><strong>👤 Paciente:</strong> ${patientName}</p>`}
          <p style="margin: 8px 0;"><strong>💉 Servicio:</strong> ${serviceName}</p>
          <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>⏰ Horario:</strong> ${startTime} - ${endTime}</p>
        </div>

        ${type === 'CANCEL' ? '' : `
          <p style="color: ${colorMain}; font-size: 16px; margin-top: 20px;">${isOwner ? 'Revisa tu panel para más detalles.' : '¡Te esperamos!'}</p>
        `}
        
        <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Este es un mensaje automático del sistema de gestión de citas de Master Haven. 
          ${!isOwner ? 'Si deseas realizar cambios, por favor contáctanos.' : ''}
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'Master Haven <onboarding@resend.dev>',
      to,
      subject: subject || getTitle(),
      html
    });
    console.log(`Correo de tipo ${type} enviado a ${to}`);
  } catch (error) {
    console.error(`Error enviando correo de tipo ${type}:`, error);
  }
}
