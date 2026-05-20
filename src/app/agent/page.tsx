'use client';

import { useEffect, useState } from 'react';
import { Users, CalendarCheck, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiFetch';
import { useSede } from '@/context/SedeContext';

interface Stats {
  todayAppointments: number;
  yesterdayAppointments: number;
  newPatientsThisMonth: number;
  newPatientsLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  upcomingToday: {
    id: string;
    patient: string;
    service: string;
    time: string;
    status: string;
  }[];
}

function pctChange(current: number, previous: number): { label: string; up: boolean } {
  if (previous === 0 && current === 0) return { label: '0%', up: true };
  if (previous === 0) return { label: `+${current}`, up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { label: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
}

function diffChange(current: number, previous: number): { label: string; up: boolean } {
  const diff = current - previous;
  return { label: `${diff >= 0 ? '+' : ''}${diff} vs ayer`, up: diff >= 0 };
}

export default function DashboardPage() {
  const { selectedSede, isLoading: sedeLoading } = useSede();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sedeLoading) return;

    async function fetchStats() {
      setLoading(true);
      try {
        const params = selectedSede ? `?subaccountId=${selectedSede}` : '';
        const res = await apiFetch(`/api/stats${params}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Error fetching stats:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [selectedSede, sedeLoading]);

  const todayChange    = stats ? diffChange(stats.todayAppointments, stats.yesterdayAppointments) : null;
  const patientsChange = stats ? pctChange(stats.newPatientsThisMonth, stats.newPatientsLastMonth) : null;
  const revenueChange  = stats ? pctChange(stats.revenueThisMonth, stats.revenueLastMonth) : null;

  const statCards = [
    {
      name: 'Citas Hoy',
      value: loading ? '—' : String(stats?.todayAppointments ?? 0),
      icon: CalendarCheck,
      change: todayChange,
    },
    {
      name: 'Pacientes Nuevos (Mes)',
      value: loading ? '—' : String(stats?.newPatientsThisMonth ?? 0),
      icon: Users,
      change: patientsChange,
    },
    {
      name: 'Ingresos del Mes',
      value: loading ? '—' : `$${(stats?.revenueThisMonth ?? 0).toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      change: revenueChange,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resumen General</h2>
        <p className="mt-1 text-sm text-gray-500">
          Métricas clave y próximas citas de tu consultorio.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-500/10 p-3">
                <item.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                <>
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                  {item.change && (
                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${item.change.up ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change.up
                        ? <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center text-green-500" />
                        : <ArrowDownRight className="h-4 w-4 flex-shrink-0 self-center text-red-500" />}
                      {item.change.label}
                    </p>
                  )}
                </>
              )}
            </dd>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Próximas Citas (Hoy)</h3>
          <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Ver Calendario →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : stats?.upcomingToday.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No hay más citas pendientes por hoy.
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-100">
            {stats?.upcomingToday.map((appt) => (
              <li key={appt.id} className="px-6 py-5 flex justify-between gap-x-6 hover:bg-gray-50 transition-colors">
                <div className="flex min-w-0 gap-x-4 items-center">
                  <div className="h-10 w-10 flex-none rounded-full bg-blue-50 flex flex-col items-center justify-center text-blue-700 font-bold">
                    {appt.patient.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">{appt.patient}</p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">{appt.service}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className="flex items-center gap-1 text-sm leading-6 text-gray-900 font-medium">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {appt.time}
                  </div>
                  <div className="mt-1 flex items-center gap-x-1.5">
                    <div className={`flex-none rounded-full p-1 ${appt.status === 'Confirmada' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${appt.status === 'Confirmada' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </div>
                    <p className="text-xs leading-5 text-gray-500">{appt.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
