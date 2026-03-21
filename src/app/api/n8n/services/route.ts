export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get('subaccountId');
    const doctorId = searchParams.get('doctorId');

    let whereClause: any = { isActive: true };

    if (subaccountId) {
      whereClause.subaccountId = subaccountId;
    }

    if (doctorId) {
      // Find services that have a configuration with this doctor
      whereClause.configurations = {
        some: { doctorId },
      };
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Error in n8n/services GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
