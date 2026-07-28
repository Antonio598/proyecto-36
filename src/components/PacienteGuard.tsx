'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PACIENTE = ['/paciente', '/paciente/login', '/paciente/registro'];

export default function PacienteGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isPublic = PUBLIC_PACIENTE.includes(pathname);
    const raw = localStorage.getItem('paciente_session');
    const session = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;

    if (!session && !isPublic) {
      router.replace('/paciente/login');
    }
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen w-full" style={{ background: '#060612' }}>
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
