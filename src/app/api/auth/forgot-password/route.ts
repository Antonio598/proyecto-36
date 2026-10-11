import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'El correo es requerido.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    // Always return OK to avoid leaking which emails exist
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    const hmac = crypto
      .createHmac('sha256', user.passwordHash)
      .update(`${user.id}:${expiry}`)
      .digest('hex');

    const token = Buffer.from(JSON.stringify({ userId: user.id, expiry, hmac })).toString('base64url');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;">
        <h1 style="color:#1d4ed8;font-size:22px;font-weight:800;margin-bottom:8px;">🔐 Restablecer contraseña</h1>
        <p style="color:#475569;font-size:15px;margin-bottom:20px;">
          Hola <strong>${user.name || user.email}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en Galenus AI.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Restablecer contraseña
        </a>
        <p style="color:#64748b;font-size:13px;margin-top:20px;">
          Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.
        </p>
        <p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;">
          Galenus AI — Sistema de Gestión Médica
        </p>
      </div>
    `;

    await transport.sendMail({
      from: `Galenus AI <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Restablecer contraseña — Galenus AI',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
