import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, action } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    // ─── REGISTER ───
    if (action === 'register') {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese correo.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      return NextResponse.json({
        success: true,
        message: '¡Cuenta creada exitosamente!',
        user,
      });
    }

    // ─── LOGIN ───
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    // Return user info (without passwordHash)
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Auth API error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
