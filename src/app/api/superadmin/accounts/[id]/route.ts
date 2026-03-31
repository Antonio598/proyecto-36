import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySuperAdmin } from '../route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await verifySuperAdmin(request);
  if (!superAdmin) {
    return NextResponse.json({ error: 'Forbidden: SUPERADMIN only' }, { status: 403 });
  }

  try {
    const { id: accountId } = await params;

    // Delete the account. Because of `onDelete: Cascade` in schema,
    // this will delete the subaccounts, users, patients, etc. connected to it.
    await db.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await verifySuperAdmin(request);
  if (!superAdmin) {
    return NextResponse.json({ error: 'Forbidden: SUPERADMIN only' }, { status: 403 });
  }

  try {
    const { id: accountId } = await params;
    const body = await request.json();

    if ('maxSubaccounts' in body) {
      await db.account.update({
        where: { id: accountId },
        data: {
          maxSubaccounts: body.maxSubaccounts === '' || body.maxSubaccounts === null ? null : Number(body.maxSubaccounts),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
