import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { fullName, phone, email, notes } = body;

    // Optional: Check phone uniqueness if phone is being changed
    if (phone) {
      const existingPatient = await prisma.patient.findUnique({
        where: { phone },
      });
      
      if (existingPatient && existingPatient.id !== id) {
         return NextResponse.json(
          { error: 'A different patient with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await prisma.patient.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
