import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership via subaccount
    const existing = await prisma.doctor.findUnique({
      where: { id },
      include: { subaccount: { select: { accountId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.subaccount?.accountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    if (isPublic === true && doctor.subaccount?.account) {
      await prisma.account.update({
        where: { id: doctor.subaccount.account.id },
        data: { has_directory: true },
      });
    }

    revalidatePath(`/directorio/${id}`);
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
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.doctor.findUnique({
      where: { id },
      include: { subaccount: { select: { accountId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.subaccount?.accountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.doctor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
