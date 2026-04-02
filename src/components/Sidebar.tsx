import { useState, useRef, useEffect } from 'react';
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
  Clock,
  ChevronDown,
  Check,
  X
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

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm z-30 relative">
      <div className="flex h-16 items-center px-6 border-b border-gray-100 bg-white justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black">M</div>
          Med<span className="text-blue-600">SaaS</span>
        </h1>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-5 border-b border-gray-100 bg-gray-50/50" ref={dropdownRef}>
        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest pl-1">Sede UniversaL</label>
        {isLoading ? (
           <div className="h-11 bg-gray-200 animate-pulse rounded-xl w-full"></div>
        ) : (
           <div className="relative">
             <button
               onClick={() => setIsSedeOpen(!isSedeOpen)}
               className={`w-full flex items-center justify-between bg-white border ${isSedeOpen ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200 hover:border-gray-300'} text-gray-900 text-sm font-bold rounded-xl p-3 shadow-sm transition-all duration-200`}
             >
               <div className="flex items-center gap-2.5 truncate">
                  <div className={`p-1.5 rounded-md ${isSedeOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="truncate">
                    {sedes.length === 0 ? 'Sin Sedes' : sedes.find(s => s.id === selectedSede)?.name || 'Selecciona una...'}
                  </span>
               </div>
               <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isSedeOpen ? '-rotate-180 text-blue-500' : ''}`} />
             </button>

             {isSedeOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden transform opacity-100 scale-100 transition-all">
                  {sedes.length === 0 ? (
                    <div className="px-4 py-4 text-center text-sm text-gray-500 font-medium">Aún no hay sedes creadas</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                      {sedes.map(sede => {
                        const isSelected = selectedSede === sede.id;
                        return (
                          <button
                            key={sede.id}
                            onClick={() => { setSelectedSede(sede.id); setIsSedeOpen(false); }}
                            className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-black' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
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
