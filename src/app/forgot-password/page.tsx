'use client';

import { useState } from 'react';
import { Stethoscope, Mail, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al enviar el correo.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Galenus <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Recuperar contraseña</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-xl shadow-gray-200/40 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Revisa tu correo</h2>
              <p className="text-sm text-gray-500 mb-6">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Válido por 1 hora.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-5">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="doctor@clinica.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar enlace
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Galenus AI — Panel de Gestión Médica
        </p>
      </div>
    </div>
  );
}
