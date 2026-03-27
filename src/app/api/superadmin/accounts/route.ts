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
    const [accounts, users, appointments, subaccounts] = await Promise.all([
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
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
    }

    const account = await db.account.create({ data: { name } });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    console.error('Error in superadmin accounts POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
