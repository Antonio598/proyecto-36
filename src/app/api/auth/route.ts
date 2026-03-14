import { createServerSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, action } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    if (action === 'register') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: '¡Cuenta creada exitosamente!',
        session: data.session,
        user: data.user,
      });
    }

    // Default: login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    });
  } catch (err: any) {
    console.error('Auth API error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
