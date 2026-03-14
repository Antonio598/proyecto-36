'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for session
    const session = localStorage.getItem('med_session');

    if (session) {
      setAuthenticated(true);
    } else if (pathname !== '/login') {
      router.replace('/login');
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

  // On login page, always render
  if (pathname === '/login') {
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
