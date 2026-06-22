'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Clock, Download, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { apiFetch } from '@/lib/apiFetch';
import { useSede } from '@/context/SedeContext';

const PERIODS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Rango personalizado', value: 'custom' },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PAID:    { label: 'Pagada',    className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente', className: 'bg-orange-100 text-orange-700' },
  WAIVED:  { label: 'Eximida',   className: 'bg-gray-100 text-gray-600' },
  REFUNDED:{ label: 'Reembolsada', className: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Consulta',
  MANUAL: 'Manual',
  STRIPE: 'Pago en línea',
};

function getPeriodDates(period: string, customStart: string, customEnd: string) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: format(startOfDay(now), 'yyyy-MM-dd'), end: format(endOfDay(now), 'yyyy-MM-dd') };
    case 'week':
      return { start: format(startOfWeek(now, { locale: es }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { locale: es }), 'yyyy-MM-dd') };
    case 'month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'lastMonth': {
      const last = subMonths(now, 1);
      return { start: format(startOfMonth(last), 'yyyy-MM-dd'), end: format(endOfMonth(last), 'yyyy-MM-dd') };
    }
    case 'custom':
      return { start: customStart, end: customEnd };
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
}

export default function FinanzasPage() {
  const { selectedSede } = useSede();

  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedSede) return;
    setIsLoading(true);
    const { start, end } = getPeriodDates(period, customStart, customEnd);
    if (!start || !end) { setIsLoading(false); return; }

    try {
      const params = `subaccountId=${selectedSede}&startDate=${start}&endDate=${end}`;
      const [txRes, sumRes] = await Promise.all([
        apiFetch(`/api/transactions?${params}`),
        apiFetch(`/api/finanzas/summary?${params}`),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSede, period, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkPaid = async (txId: string) => {
    setPatchingId(txId);
    try {
      const res = await apiFetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID' }),
      });
      if (res.ok) fetchData();
    } finally {
      setPatchingId(null);
    }
  };

  const exportCSV = () => {
    const header = ['Fecha', 'Paciente', 'Servicio', 'Doctor', 'Sede', 'Tipo', 'Estado', 'Monto (USD)'];
    const rows = filteredTx.map(tx => [
      format(new Date(tx.transactionDate), 'dd/MM/yyyy'),
      tx.appointment?.patient?.fullName || '—',
      tx.appointment?.service?.name || '—',
      tx.appointment?.doctor?.name || '—',
      tx.subaccount?.name || '—',
      TYPE_LABELS[tx.type] || tx.type,
      STATUS_LABELS[tx.status]?.label || tx.status,
      tx.amount.toFixed(2),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas_${period}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTx = statusFilter === 'ALL'
    ? transactions
    : transactions.filter(t => t.status === statusFilter);

  const currentPeriodLabel = PERIODS.find(p => p.value === period)?.label || 'Este mes';

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 px-5 md:py-8 md:px-10 text-white">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <DollarSign className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              Panel Financiero
            </h2>
            <p className="mt-1 text-emerald-100/80 text-sm font-medium">
              Ingresos, cobros pendientes y transacciones de tu clínica.
            </p>
          </div>

          {/* Period selector */}
          <div className="relative">
            <button
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-bold rounded-xl px-4 py-2.5 transition-all"
            >
              {currentPeriodLabel}
              <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodOpen ? '-rotate-180' : ''}`} />
            </button>
            {isPeriodOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[200px]">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setIsPeriodOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center justify-between ${period === p.value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p.label}
                    {period === p.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Desde</label>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-black" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Hasta</label>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-black" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchData} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">Aplicar</button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Ingresos cobrados</p>
            </div>
            <p className="text-3xl font-black text-black">${(summary?.totalPaid || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{summary?.countPaid || 0} transacciones pagadas</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 p-2.5 rounded-xl"><Clock className="w-5 h-5 text-orange-600" /></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Por cobrar</p>
            </div>
            <p className="text-3xl font-black text-black">${(summary?.totalPending || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{summary?.countPending || 0} pendientes</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2.5 rounded-xl"><DollarSign className="w-5 h-5 text-blue-600" /></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Total registrado</p>
            </div>
            <p className="text-3xl font-black text-black">${((summary?.totalPaid || 0) + (summary?.totalPending || 0)).toFixed(2)}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{summary?.count || 0} transacciones totales</p>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
          <h3 className="text-base font-black text-black">Transacciones</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'PAID', 'PENDING', 'WAIVED', 'REFUNDED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s === 'ALL' ? 'Todas' : STATUS_LABELS[s]?.label || s}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={exportCSV}
              disabled={filteredTx.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 font-bold">Cargando...</div>
        ) : filteredTx.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No hay transacciones en este período.</p>
            <p className="text-xs text-gray-300 mt-1">Las transacciones se crean al marcar citas como Atendidas o Pagadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider hidden md:table-cell">Servicio</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider hidden lg:table-cell">Doctor</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Monto</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                      {format(new Date(tx.transactionDate), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-4 font-bold text-black">
                      {tx.appointment?.patient?.fullName || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-medium hidden md:table-cell">
                      {tx.appointment?.service?.name || '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-medium hidden lg:table-cell">
                      {tx.appointment?.doctor?.name || '—'}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-bold text-gray-500">
                        {TYPE_LABELS[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[tx.status]?.className || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[tx.status]?.label || tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-black">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      {tx.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkPaid(tx.id)}
                          disabled={patchingId === tx.id}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {patchingId === tx.id ? '...' : 'Marcar pagada'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={6} className="px-5 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">
                    Total {statusFilter !== 'ALL' ? STATUS_LABELS[statusFilter]?.label : ''} ({filteredTx.length})
                  </td>
                  <td className="px-5 py-3 text-right font-black text-black">
                    ${filteredTx.reduce((s, t) => s + t.amount, 0).toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
