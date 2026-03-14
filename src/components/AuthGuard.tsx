'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthenticated(true);
      } else if (pathname !== '/login') {
        router.replace('/login');
      }
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, [pathname, router]);

  // Still checking — show nothing
  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // On login page, always render children (the login form)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Not authenticated and not on login page → will redirect (handled in useEffect)
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
