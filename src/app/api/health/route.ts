import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const aiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let dbStatus = 'NOT TESTED';
    let dbError = null;

    try {
      // Intento de conexión ligera
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'CONNECTED';
    } catch (e: any) {
      dbStatus = 'FAILED';
      dbError = e.message;
    }

    return NextResponse.json({
      status: 'Diagnóstico de Entorno de Producción',
      environmentFiles: {
        DATABASE_URL_CONFIGURED: !!dbUrl,
        DATABASE_URL_LENGTH: dbUrl ? dbUrl.length : 0,
        GOOGLE_API_KEY_CONFIGURED: !!aiKey,
        GOOGLE_API_KEY_LENGTH: aiKey ? aiKey.length : 0,
      },
      databaseConnection: {
        status: dbStatus,
        error: dbError
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
