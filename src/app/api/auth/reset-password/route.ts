import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token y nueva contraseña son requeridos.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    let parsed: { userId: string; expiry: number; hmac: string };
    try {
      parsed = JSON.parse(Buffer.from(token, 'base64url').toString());
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    const { userId, expiry, hmac } = parsed;

    if (!userId || !expiry || !hmac) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    if (Date.now() > expiry) {
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    const expected = crypto
      .createHmac('sha256', user.passwordHash)
      .update(`${userId}:${expiry}`)
      .digest('hex');

    if (hmac !== expected) {
      return NextResponse.json({ error: 'Token inválido o ya utilizado.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
