'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function PacienteLogin() {
  const router = useRouter();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('paciente_session');
    if (raw) router.replace('/paciente/panel');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/paciente/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return; }
      localStorage.setItem('paciente_session', JSON.stringify(data));
      router.replace('/paciente/panel');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @keyframes float-orb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.06)}}
        @keyframes slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .orb1{animation:float-orb 18s ease-in-out infinite}
        .orb2{animation:float-orb 22s ease-in-out infinite reverse;animation-delay:-9s}
        .card{animation:slide-up .5s ease-out both}
        .input-dark{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:white;transition:border-color .2s,box-shadow .2s}
        .input-dark::placeholder{color:rgba(255,255,255,.25)}
        .input-dark:focus{outline:none;border-color:rgba(59,130,246,.6);box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        .btn-primary{background:linear-gradient(135deg,#3b82f6,#6366f1);box-shadow:0 8px 24px rgba(59,130,246,.35);transition:box-shadow .2s,transform .15s}
        .btn-primary:hover:not(:disabled){box-shadow:0 12px 32px rgba(59,130,246,.5);transform:translateY(-1px)}
        .btn-primary:disabled{opacity:.6}
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#060612' }}>
        <div className="orb1 absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ top: '-12rem', left: '-12rem', background: 'radial-gradient(circle,rgba(59,130,246,.25),transparent 70%)', filter: 'blur(80px)' }} />
        <div className="orb2 absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ bottom: '-8rem', right: '-8rem', background: 'radial-gradient(circle,rgba(139,92,246,.2),transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="card relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl italic shadow-lg mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>G</div>
            <h1 className="text-2xl font-black text-white">Bienvenido de vuelta</h1>
            <p className="text-white/40 text-sm font-medium mt-1">Ingresa a tu portal de paciente</p>
          </div>

          <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Email</label>
                <input
                  type="email" required placeholder="tu@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} required placeholder="••••••••"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-dark w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium"
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
              </button>
            </form>
          </div>

          <p className="text-center text-white/30 text-sm font-medium mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/paciente/registro" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Crear cuenta
            </Link>
          </p>
          <p className="text-center mt-3">
            <Link href="/paciente" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
