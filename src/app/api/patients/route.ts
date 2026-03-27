export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get('phone');
    const id = searchParams.get('id');
    phone = (phone || id)?.toString() || null;

    if (phone && accountId) {
      const patient = await prisma.patient.findFirst({
        where: { phone, accountId },
      });
      return NextResponse.json(patient ? [patient] : []);
    }

    if (phone) {
      const patient = await prisma.patient.findFirst({ where: { phone } });
      return NextResponse.json(patient ? [patient] : []);
    }

    const patients = await prisma.patient.findMany({
      where: accountId ? { accountId } : {},
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    const body = await request.json();
    let { fullName, phone, email, notes, id } = body;
    phone = (phone || id)?.toString();

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'FullName and phone are required' }, { status: 400 });
    }

    // Check if phone already exists in this account
    const existingPatient = await prisma.patient.findFirst({
      where: accountId ? { phone, accountId } : { phone },
    });

    if (existingPatient) {
      return NextResponse.json({ error: 'A patient with this phone number already exists' }, { status: 409 });
    }

    const patient = await prisma.patient.create({
      data: { fullName, phone, email, notes, ...(accountId ? { accountId } : {}) },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
