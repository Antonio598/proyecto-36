'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import ChatbotWidget from '@/components/ChatbotWidget';
import { SedeProvider } from '@/context/SedeContext';
import { Menu } from 'lucide-react';

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isLoginPage = pathname === '/login';
  const isSuperAdmin = pathname.startsWith('/superadmin');

  // Login and super admin pages render without sidebar/chatbot
  if (isLoginPage || isSuperAdmin) {
    return <>{children}</>;
  }

  return (
    <SedeProvider>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col z-10 w-64 bg-white border-r border-gray-200">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsMenuOpen(false)} 
            />
            <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-white shadow-2xl animate-in slide-in-from-left duration-300">
              <Sidebar onClose={() => setIsMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Mobile Header */}
          <header className="md:hidden flex h-16 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-200 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm italic shadow-lg shadow-blue-200">M</div>
              <span className="font-black text-gray-900 tracking-tight">Med<span className="text-blue-600">SaaS</span></span>
            </div>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -mr-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-10 scroll-smooth">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        <ChatbotWidget />
      </div>
    </SedeProvider>
  );
}
