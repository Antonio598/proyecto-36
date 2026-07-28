export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    if (action === 'register') {
      if (!name) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

      const existing = await (prisma as any).patientUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await (prisma as any).patientUser.create({
        data: { name, email, passwordHash },
      });

      return NextResponse.json({
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, patientId: user.patientId,
      }, { status: 201 });
    }

    if (action === 'login') {
      const user = await (prisma as any).patientUser.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
      }

      return NextResponse.json({
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, patientId: user.patientId,
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('[paciente/auth]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
