'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('galenus_cookies');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('galenus_cookies', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 leading-relaxed flex-1">
          Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies de preferencias para mejorar tu experiencia. Consulta nuestra{' '}
          <Link href="/privacidad" className="text-blue-400 hover:text-blue-300 underline">
            Política de Privacidad
          </Link>{' '}
          para más información.
        </p>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/privacidad"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-xl border border-gray-700 hover:border-gray-500"
          >
            Más info
          </Link>
          <button
            onClick={accept}
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
