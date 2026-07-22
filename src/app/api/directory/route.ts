export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty  = searchParams.get('specialty');
    const name       = searchParams.get('name');
    const insurance  = searchParams.get('insurance');
    const accountId  = searchParams.get('accountId');

    const doctors = await prisma.doctor.findMany({
      where: {
        isPublic: true,
        ...(specialty ? { specialty: { contains: specialty, mode: 'insensitive' } } : {}),
        ...(name      ? { name: { contains: name, mode: 'insensitive' } } : {}),
        ...(accountId ? { subaccount: { accountId } } : {}),
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
        photoUrl: true,
        location: true,
        socialLinks: true,
        insurances: true,
        subaccount: {
          select: {
            id: true,
            name: true,
            account: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Filter by insurance if provided
    const filtered = insurance
      ? doctors.filter(d => {
          if (!d.insurances) return false;
          const ins = d.insurances as string[];
          return ins.some((i: string) => i.toLowerCase().includes(insurance.toLowerCase()));
        })
      : doctors;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
