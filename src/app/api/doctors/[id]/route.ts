import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subaccountId, specialty, bio, phone, email, photoUrl, location, socialLinks, insurances, isPublic } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (subaccountId !== undefined) dataToUpdate.subaccountId = subaccountId;
    if (specialty !== undefined) dataToUpdate.specialty = specialty;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (email !== undefined) dataToUpdate.email = email;
    if (photoUrl !== undefined) dataToUpdate.photoUrl = photoUrl;
    if (location !== undefined) dataToUpdate.location = location;
    if (socialLinks !== undefined) dataToUpdate.socialLinks = socialLinks;
    if (insurances !== undefined) dataToUpdate.insurances = insurances;
    if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;

    const doctor = await prisma.doctor.update({
      where: { id },
      data: dataToUpdate,
      include: { subaccount: { include: { account: true } } }
    });

    // If the doctor is being made public, ensure the account has the directory enabled
    if (isPublic === true && doctor.subaccount?.account) {
      await prisma.account.update({
        where: { id: doctor.subaccount.account.id },
        data: { has_directory: true },
      });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.doctor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
