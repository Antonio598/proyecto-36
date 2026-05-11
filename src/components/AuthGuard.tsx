'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('med_session');
    let session: any = null;
    if (raw) {
      try { session = JSON.parse(raw); } catch { session = { role: 'RECEPTIONIST' }; }
    }

    const isSuperAdmin = session?.role === 'SUPERADMIN';
    const onSuperAdminPath = pathname.startsWith('/superadmin');
    const PUBLIC_ROUTES = ['/', '/login', '/privacidad', '/terminos'];

    if (!session) {
      // Not logged in — allow through only on public routes
      if (!PUBLIC_ROUTES.includes(pathname)) router.replace('/login');
    } else if (isSuperAdmin && !onSuperAdminPath && pathname !== '/login') {
      // Superadmin trying to access normal app → redirect to their dashboard
      router.replace('/superadmin');
    } else if (!isSuperAdmin && onSuperAdminPath) {
      // Normal user trying to access super admin → redirect out
      router.replace('/agent');
    } else if (pathname === '/') {
      // Logged-in user on landing page → send to app dashboard
      // Set authenticated=true first so /agent renders without a spinner flash
      setAuthenticated(true);
      router.replace('/agent');
    } else {
      setAuthenticated(true);
    }

    setChecked(true);
  }, [pathname, router]);

  // Still checking
  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // On public pages (landing, login), always render
  if (pathname === '/login' || pathname === '/' || pathname === '/privacidad' || pathname === '/terminos') {
    return <>{children}</>;
  }

  // Not authenticated → redirect handled above
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
