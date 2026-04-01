import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Shared helper to verify the caller is a SUPERADMIN
export async function verifySuperAdmin(request: Request): Promise<{ userId: string } | null> {
  const userId = request.headers.get('x-superadmin-id');
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Use string cast since Prisma types may lag behind local regeneration
    if ((user?.role as string) === 'SUPERADMIN') return { userId };
    return null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(request: Request) {
  const superAdmin = await verifySuperAdmin(request);
  if (!superAdmin) {
    return NextResponse.json({ error: 'Forbidden: SUPERADMIN only' }, { status: 403 });
  }

  try {
    const [rawAccounts, users, appointments, subaccounts] = await Promise.all([
      db.account.findMany({
        include: {
          _count: { select: { subaccounts: true, patients: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
      prisma.appointment.count(),
      prisma.subaccount.count(),
    ]);

    // Fetch appointments, services, and doctors count for each account
    const accounts = await Promise.all(rawAccounts.map(async (acc: any) => {
      const [appointmentsCount, servicesCount, doctorsCount] = await Promise.all([
        prisma.appointment.count({ where: { subaccount: { accountId: acc.id } } }),
        prisma.service.count({ where: { subaccount: { accountId: acc.id } } }),
        prisma.doctor.count({ where: { subaccount: { accountId: acc.id } } })
      ]);
      return {
        ...acc,
        _count: {
          ...acc._count,
          appointments: appointmentsCount,
          services: servicesCount,
          doctors: doctorsCount
        }
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        stats: {
          totalAccounts: accounts.length,
          totalSubaccounts: subaccounts,
          totalUsers: users,
          totalAppointments: appointments,
        },
      },
    });
  } catch (error) {
    console.error('Error in superadmin stats GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const superAdmin = await verifySuperAdmin(request);
  if (!superAdmin) {
    return NextResponse.json({ error: 'Forbidden: SUPERADMIN only' }, { status: 403 });
  }

  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos (nombre, correo, contraseña) son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 400 });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Run in transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create account
      const account = await (tx as any).account.create({ data: { name } });

      // 2. Create user for that account
      await tx.user.create({
        data: {
          email,
          name, // Default name to the company name or handle this later
          passwordHash,
          role: 'ADMIN',
          accountId: account.id,
        },
      });

      return account;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error in superadmin accounts POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
