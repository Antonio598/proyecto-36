import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSede } from '@/context/SedeContext';
import {
  LayoutDashboard, Calendar, Users, Package, Settings, BookOpen,
  Building, Stethoscope, Clock, ChevronDown, Check, X, DollarSign, Video
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/agent', icon: LayoutDashboard },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Servicios', href: '/services', icon: Package },
  { name: 'Sedes', href: '/sedes', icon: Building },
  { name: 'Médicos', href: '/doctores', icon: Stethoscope },
  { name: 'Teleconsulta', href: '/reuniones', icon: Video },
  { name: 'Finanzas', href: '/finanzas', icon: DollarSign },
  { name: 'Config Calendarios', href: '/calendarios', icon: Clock },
  { name: 'Doc API (n8n)', href: '/api-docs', icon: BookOpen },
];

export function Sidebar({ onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { sedes, selectedSede, setSelectedSede, isLoading } = useSede();
  const [isSedeOpen, setIsSedeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSedeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-64 flex-col z-30 relative" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-gray-100 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-200 italic">G</div>
          <div>
            <p className="font-black text-gray-900 leading-none text-base">Galenus</p>
            <p className="text-xs font-bold text-blue-500 leading-none">AI Platform</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sede selector */}
      <div className="px-4 py-4 border-b border-gray-100" ref={dropdownRef}>
        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest pl-1">Sede activa</label>
        {isLoading ? (
          <div className="h-11 bg-gray-100 animate-pulse rounded-xl w-full" />
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsSedeOpen(!isSedeOpen)}
              className={`w-full flex items-center justify-between text-sm font-bold rounded-xl p-3 transition-all duration-200 ${isSedeOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border border-gray-200 text-gray-900 hover:border-blue-200 hover:bg-blue-50/50'}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Building className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {sedes.length === 0 ? 'Sin Sedes' : sedes.find(s => s.id === selectedSede)?.name || 'Selecciona...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isSedeOpen ? '-rotate-180' : ''}`} />
            </button>

            {isSedeOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
                {sedes.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-500 font-medium">Sin sedes creadas</div>
                ) : (
                  <div className="max-h-52 overflow-y-auto p-2 space-y-1">
                    {sedes.map(sede => {
                      const isSelected = selectedSede === sede.id;
                      return (
                        <button
                          key={sede.id}
                          onClick={() => { setSelectedSede(sede.id); setIsSedeOpen(false); }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${isSelected ? 'bg-blue-50 text-blue-700 font-black' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                        >
                          <span className="truncate">{sede.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <nav className="flex-1 space-y-0.5">
          {navigation.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {isActive && <div className="absolute inset-0 rounded-xl bg-white/10" />}
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`}
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings */}
      <div className="border-t border-gray-100 p-3">
        <Link
          href="/settings"
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
            pathname === '/settings'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Settings className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`} />
          Configuración
        </Link>
      </div>
    </div>
  );
}
