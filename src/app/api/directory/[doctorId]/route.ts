export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  try {
    const { doctorId } = await params;

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isPublic: true,
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
            account: { select: { id: true } }
          }
        }
      },
    });

    if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor directory entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
