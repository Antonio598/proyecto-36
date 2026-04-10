import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAppointmentEmail({
  to,
  subject,
  patientName,
  serviceName,
  date,
  startTime,
  endTime,
  isOwner = false
}: {
  to: string;
  subject: string;
  patientName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  isOwner?: boolean;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no encontrada. El correo no será enviado.');
    return;
  }

  try {
    const html = isOwner 
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px; background-color: #f8fafc;">
          <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Nueva Cita Agendada</h1>
          <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">Hola, se ha agendado una nueva cita en tu cuenta.</p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0;"><strong>👤 Paciente:</strong> ${patientName}</p>
            <p style="margin: 8px 0;"><strong>💉 Servicio:</strong> ${serviceName}</p>
            <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${date}</p>
            <p style="margin: 8px 0;"><strong>⏰ Horario:</strong> ${startTime} - ${endTime}</p>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Este es un mensaje automático del sistema de gestión de citas.</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f0f9ff;">
          <h1 style="color: #0369a1; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Confirmación de Cita</h1>
          <p style="color: #0c4a6e; font-size: 16px; margin-bottom: 20px;">Hola <strong>${patientName}</strong>, tu cita ha sido confirmada exitosamente.</p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #bae6fd;">
            <p style="margin: 8px 0;"><strong>💉 Servicio:</strong> ${serviceName}</p>
            <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${date}</p>
            <p style="margin: 8px 0;"><strong>⏰ Horario:</strong> ${startTime} - ${endTime}</p>
          </div>
          <p style="color: #0369a1; font-size: 16px; margin-top: 20px;">Gracias por confiar en nosotros. ¡Te esperamos!</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Si no agendaste esta cita o deseas realizar cambios, por favor contáctanos.</p>
        </div>
      `;

    await resend.emails.send({
      from: 'Citas <onboarding@resend.dev>',
      to,
      subject,
      html
    });
    console.log(`Correo enviado a ${to}`);
  } catch (error) {
    console.error('Error enviando correo:', error);
  }
}
