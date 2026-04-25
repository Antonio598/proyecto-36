import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { subaccountId, calendarId } = body;

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId es requerido' }, { status: 400 });
    }

    // Eliminamos los bloqueos manuales fantasmas (calendarId null)
    // Y también los bloqueos manuales asignados directamente a este calendario si calendarId viene en la request.
    const deleted = await prisma.appointment.deleteMany({
      where: {
        subaccountId,
        isBlocker: true,
        OR: calendarId ? [
          { calendarId: null },
          { calendarId }
        ] : [
          { calendarId: null }
        ]
      }
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error('Error cleaning blockers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
