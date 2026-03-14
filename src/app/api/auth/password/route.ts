import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { accessToken, newPassword } = await req.json();

    if (!accessToken || !newPassword) {
      return NextResponse.json({ error: 'Token y nueva contraseña son requeridos.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    // Create a client authenticated with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false },
      }
    );

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
