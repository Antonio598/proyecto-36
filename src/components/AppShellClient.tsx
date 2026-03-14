'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import ChatbotWidget from '@/components/ChatbotWidget';

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // Login page renders without sidebar/chatbot
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Sidebar Area */}
      <div className="hidden md:flex flex-col z-10 w-64 bg-white border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto w-full p-6 lg:p-10">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}
