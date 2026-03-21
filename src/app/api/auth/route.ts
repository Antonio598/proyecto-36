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
      // Check if user already exists
      let existing;
      try {
        existing = await prisma.user.findUnique({ where: { email } });
      } catch (dbErr: any) {
        return NextResponse.json({
          error: 'Error de base de datos al buscar usuario.',
          detail: dbErr.message,
        }, { status: 500 });
      }

      if (existing) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese correo.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      let user;
      try {
        const role = email.toLowerCase() === 'israelmayalara@gmail.com' ? 'ADMIN' : 'RECEPTIONIST';
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            passwordHash,
            role,
          },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
      } catch (createErr: any) {
        return NextResponse.json({
          error: 'Error de base de datos al crear usuario.',
          detail: createErr.message,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '¡Cuenta creada exitosamente!',
        user,
      });
    }

    // ─── LOGIN ───
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, passwordHash: true, createdAt: true },
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        error: 'Error de base de datos al buscar usuario.',
        detail: dbErr.message,
      }, { status: 500 });
    }

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
    return NextResponse.json({
      error: 'Error interno del servidor.',
      detail: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join(' | '),
    }, { status: 500 });
  }
}
