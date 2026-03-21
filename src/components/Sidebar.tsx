'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSede } from '@/context/SedeContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Package, 
  Settings,
  BookOpen,
  Building,
  Stethoscope,
  Clock
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Servicios', href: '/services', icon: Package },
  { name: 'Sedes', href: '/sedes', icon: Building },
  { name: 'Médicos', href: '/doctores', icon: Stethoscope },
  { name: 'Config Calendarios', href: '/calendarios', icon: Clock },
  { name: 'Doc API (n8n)', href: '/api-docs', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sedes, selectedSede, setSelectedSede, isLoading } = useSede();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Med<span className="text-blue-600">SaaS</span>
        </h1>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Sede Activa</label>
        {isLoading ? (
          <div className="h-9 bg-gray-200 animate-pulse rounded-md w-full"></div>
        ) : (
          <select 
            value={selectedSede} 
            onChange={(e) => setSelectedSede(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            {sedes.length === 0 && <option value="">Sin sedes</option>}
            {sedes.map(sede => (
              <option key={sede.id} value={sede.id}>{sede.name}</option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <Link
          href="/settings"
          className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100/80 hover:text-gray-900"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" aria-hidden="true" />
          Configuración
        </Link>
      </div>
    </div>
  );
}
