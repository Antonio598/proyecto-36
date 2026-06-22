export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAccountIdFromRequest } from '@/lib/serverAuth';
import { createClient } from '@supabase/supabase-js';

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const file = await prisma.medicalFile.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patient = await prisma.patient.findFirst({ where: { id: file.patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Extract storage path from URL and delete from Supabase Storage
    try {
      const url = new URL(file.fileUrl);
      const pathParts = url.pathname.split('/medical-files/');
      if (pathParts.length > 1) {
        const supabase = createAdminSupabase();
        await supabase.storage.from('medical-files').remove([pathParts[1]]);
      }
    } catch (e) {
      console.warn('[storage] Could not delete file from storage:', e);
    }

    await prisma.medicalFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medical file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
