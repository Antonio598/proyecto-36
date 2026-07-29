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

export async function POST(request: Request) {
  try {
    const accountId = getAccountIdFromRequest(request);
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string;
    const subaccountId = formData.get('subaccountId') as string;
    const consultationRecordId = formData.get('consultationRecordId') as string | null;
    const doctorId = formData.get('doctorId') as string | null;
    const fileType = (formData.get('fileType') as string) || 'document';
    const description = formData.get('description') as string | null;

    if (!file || !patientId || !subaccountId) {
      return NextResponse.json({ error: 'file, patientId, and subaccountId are required' }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({ where: { id: patientId, accountId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const supabase = createAdminSupabase();
    const ext = file.name.split('.').pop();
    const storagePath = `${accountId}/${patientId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('medical-files')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[storage] upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from('medical-files').getPublicUrl(storagePath);

    const medicalFile = await prisma.medicalFile.create({
      data: {
        patientId,
        subaccountId,
        consultationRecordId: consultationRecordId || null,
        doctorId: doctorId || null,
        fileName: file.name,
        fileUrl: publicData.publicUrl,
        fileType,
        description: description || null,
      },
      include: { doctor: { select: { id: true, name: true } } },
    });

    return NextResponse.json(medicalFile, { status: 201 });
  } catch (error) {
    console.error('Error uploading medical file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
