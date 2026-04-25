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
    const { subaccountId } = body;

    if (!subaccountId) {
      return NextResponse.json({ error: 'subaccountId es requerido' }, { status: 400 });
    }

    // Eliminamos solo los bloqueos antiguos (calendarId nulo) para limpiar el calendario de residuos
    const deleted = await prisma.appointment.deleteMany({
      where: {
        subaccountId,
        calendarId: null,
        isBlocker: true
      }
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error('Error cleaning blockers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
