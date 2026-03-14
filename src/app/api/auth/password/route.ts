import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'ID de usuario y nueva contraseña son requeridos.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: 'Contraseña actualizada.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json({ error: 'Error al cambiar contraseña.' }, { status: 500 });
  }
}
