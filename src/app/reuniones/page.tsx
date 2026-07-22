'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Video, Copy, Phone, Clock, User, CheckCheck, ExternalLink,
  ChevronDown, ChevronUp, Calendar, Wifi, Plus, DollarSign,
  CheckCircle2, XCircle, FileText, Loader2, X, RefreshCw
} from 'lucide-react';
import { useSede } from '@/context/SedeContext';
import { apiFetch, getAccountId } from '@/lib/apiFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Link from 'next/link';

const PANAMA_TZ = 'America/Panama';

function getPanamaToday(): string {
  return formatInTimeZone(new Date(), PANAMA_TZ, 'yyyy-MM-dd');
}

interface Appointment {
  id: string; startTime: string; endTime: string; status: string;
  isBlocker: boolean;
  patient: { id: string; fullName: string; phone: string | null } | null;
  service: { id: string; name: string } | null;
}

interface Patient { id: string; fullName: string; phone: string | null; }
interface Doctor  { id: string; name: string; }

interface VideoSession {
  id: string; roomUrl: string; roomName: string; status: string;
  startedAt: string; endedAt: string | null;
  notes: string | null; amount: number | null; paymentStatus: string;
  appointmentId: string | null; patientId: string | null; doctorId: string | null;
  patient: Patient | null;
  doctor: Doctor | null;
  consultation: { id: string } | null;
}

function getRoomUrl(name: string) {
  return `https://meet.jit.si/${name}`;
}

function getTimeLabel(startTime: string) {
  const diff = differenceInMinutes(parseISO(startTime), new Date());
  if (diff < -60) return { label: 'Pasada', color: '#9ca3af' };
  if (diff < 0)   return { label: 'En curso', color: '#ef4444' };
  if (diff <= 15) return { label: '¡Ahora!', color: '#ef4444' };
  if (diff <= 60) return { label: `En ${diff} min`, color: '#f59e0b' };
  const h = Math.floor(diff / 60), m = diff % 60;
  return { label: m > 0 ? `En ${h}h ${m}m` : `En ${h}h`, color: '#3b82f6' };
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ appt, onJoin }: { appt: Appointment; onJoin: (roomName: string, apptId: string, patientId?: string) => void }) {
  const [copied, setCopied] = useState(false);
  const roomName = `galenus-${appt.id}`;
  const roomUrl  = getRoomUrl(roomName);
  const tl = getTimeLabel(appt.startTime);

  const copy = async () => {
    await navigator.clipboard.writeText(roomUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const shareWA = () => {
    const phone = appt.patient?.phone?.replace(/\D/g, '') || '';
    const name  = appt.patient?.fullName || 'paciente';
    const time  = formatInTimeZone(parseISO(appt.startTime), PANAMA_TZ, 'HH:mm');
    const msg   = encodeURIComponent(`Hola ${name}, tu consulta virtual es hoy a las ${time}:\n${roomUrl}`);
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1" style={{ background: tl.color === '#ef4444' ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{appt.patient?.fullName || 'Paciente'}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{appt.service?.name || 'Sin servicio'}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold text-gray-600">
              {formatInTimeZone(parseISO(appt.startTime), PANAMA_TZ, 'HH:mm')} – {formatInTimeZone(parseISO(appt.endTime), PANAMA_TZ, 'HH:mm')}
            </p>
            <span className="text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ color: tl.color, background: `${tl.color}18` }}>{tl.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { window.open(roomUrl, '_blank'); onJoin(roomName, appt.id, appt.patient?.id); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          >
            <Video className="w-4 h-4" /> Unirse
          </button>
          <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <button onClick={shareWA} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ color: '#16a34a', background: '#f0fdf4' }}>
            <Phone className="w-4 h-4" /> WA
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ad-hoc Card ──────────────────────────────────────────────────────────────
function AdHocCard({ onJoin }: { onJoin: (roomName: string) => void }) {
  const [copied, setCopied] = useState(false);
  const roomName = `galenus-adhoc-${Math.random().toString(36).slice(2, 8)}`;
  const [fixedName] = useState(roomName);
  const roomUrl = getRoomUrl(fixedName);

  const copy = async () => {
    await navigator.clipboard.writeText(roomUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-sm">Sala sin cita previa</p>
          <p className="text-xs text-gray-400 font-medium">Sala única para esta sesión</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { window.open(roomUrl, '_blank'); onJoin(fixedName); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
        >
          <Video className="w-4 h-4" /> Unirse
        </button>
        <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? '¡Copiado!' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({
  session, patients, doctors, onUpdate, onDelete,
}: {
  session: VideoSession;
  patients: Patient[];
  doctors: Doctor[];
  onUpdate: (id: string, data: Partial<VideoSession>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    patientId: session.patientId || '',
    doctorId:  session.doctorId  || '',
    notes: session.notes || '',
    amount: session.amount != null ? String(session.amount) : '',
    paymentStatus: session.paymentStatus,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFrame, setShowFrame] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(session.id, {
      patientId: form.patientId || undefined,
      doctorId:  form.doctorId  || undefined,
      notes: form.notes,
      amount: form.amount ? parseFloat(form.amount) : undefined,
      paymentStatus: form.paymentStatus,
    } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const close = async () => {
    await onUpdate(session.id, { status: 'CLOSED' } as any);
  };

  const isOpen = session.status === 'OPEN';
  const roomUrl = session.roomUrl;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isOpen ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 opacity-80'}`}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100"
        style={{ background: isOpen ? '#eff6ff' : '#f9fafb' }}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-xs font-black" style={{ color: isOpen ? '#166534' : '#6b7280' }}>
            {isOpen ? 'SESIÓN ACTIVA' : 'SESIÓN CERRADA'}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            · {formatInTimeZone(parseISO(session.startedAt), PANAMA_TZ, 'HH:mm', { locale: es })}
            {session.endedAt && ` → ${formatInTimeZone(parseISO(session.endedAt), PANAMA_TZ, 'HH:mm')}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a href={roomUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
            <Video className="w-3.5 h-3.5" /> Sala
          </a>
          {isOpen && (
            <button onClick={close} className="text-xs font-bold text-gray-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Cerrar
            </button>
          )}
          <button onClick={() => onDelete(session.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Patient */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Paciente</label>
          {session.consultation ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">{session.patient?.fullName}</span>
              <Link href={`/patients/${session.patientId}/expediente`}
                className="ml-auto text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Expediente
              </Link>
            </div>
          ) : (
            <select
              value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Sin vincular</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} {p.phone ? `· ${p.phone}` : ''}</option>
              ))}
            </select>
          )}
        </div>

        {/* Doctor */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Médico</label>
          <select
            value={form.doctorId}
            onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Sin asignar</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Notas de la sesión</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Motivo, observaciones..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Financial */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Monto (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number" min="0" step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Pago</label>
            <select
              value={form.paymentStatus}
              onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="PENDING">Pendiente</option>
              <option value="PAID">Pagado</option>
              <option value="WAIVED">Exonerado</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
            style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCheck className="w-4 h-4" /> : null}
            {saved ? 'Guardado' : 'Guardar cambios'}
          </button>

          {form.patientId && !session.consultation && (
            <Link
              href={`/patients/${form.patientId}/expediente`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <FileText className="w-4 h-4" /> Abrir expediente
            </Link>
          )}

          <button onClick={() => setShowFrame(f => !f)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors ml-auto">
            {showFrame ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showFrame ? 'Cerrar sala' : 'Ver sala'}
          </button>
        </div>
      </div>

      {showFrame && (
        <div className="border-t border-gray-100" style={{ height: '480px' }}>
          <iframe
            src={`${roomUrl}#userInfo.displayName="Doctor Galenus"&config.prejoinPageEnabled=false`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Sala de teleconsulta"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReunionesPage() {
  const { selectedSede } = useSede();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions]         = useState<VideoSession[]>([]);
  const [patients, setPatients]         = useState<Patient[]>([]);
  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [isLoadingAppts, setIsLoadingAppts] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getPanamaToday());
  const [dbMissing, setDbMissing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!selectedSede) return;
    setIsLoadingAppts(true);
    try {
      const res = await apiFetch(`/api/appointments?subaccountId=${selectedSede}&date=${selectedDate}`);
      if (res.ok) {
        const data: Appointment[] = await res.json();
        setAppointments(data.filter(a => !a.isBlocker));
      }
    } finally { setIsLoadingAppts(false); }
  }, [selectedSede, selectedDate]);

  const fetchSessions = useCallback(async () => {
    if (!selectedSede) return;
    setIsLoadingSessions(true);
    try {
      const res = await apiFetch(`/api/video-sessions?subaccountId=${selectedSede}&date=${selectedDate}`);
      if (res.ok) {
        setSessions(await res.json());
        setDbMissing(false);
      } else if (res.status === 500) {
        setDbMissing(true);
      }
    } finally { setIsLoadingSessions(false); }
  }, [selectedSede, selectedDate]);

  const fetchPatients = useCallback(async () => {
    if (!selectedSede) return;
    const res = await apiFetch(`/api/patients?subaccountId=${selectedSede}`);
    if (res.ok) setPatients(await res.json());
  }, [selectedSede]);

  const fetchDoctors = useCallback(async () => {
    if (!selectedSede) return;
    const res = await apiFetch(`/api/doctors?subaccountId=${selectedSede}`);
    if (res.ok) setDoctors(await res.json());
  }, [selectedSede]);

  useEffect(() => {
    fetchAppointments();
    fetchSessions();
    fetchPatients();
    fetchDoctors();
  }, [fetchAppointments, fetchSessions, fetchPatients, fetchDoctors]);

  const handleJoin = async (roomName: string, appointmentId?: string, patientId?: string) => {
    if (!selectedSede || dbMissing) return;
    const accountId = getAccountId();
    if (!accountId) return;
    try {
      await apiFetch('/api/video-sessions', {
        method: 'POST',
        body: JSON.stringify({
          subaccountId: selectedSede,
          roomUrl: getRoomUrl(roomName),
          roomName,
          appointmentId: appointmentId || null,
          patientId: patientId || null,
        }),
      });
      setTimeout(fetchSessions, 500);
    } catch {}
  };

  const updateSession = async (id: string, data: any) => {
    await apiFetch(`/api/video-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    fetchSessions();
  };

  const deleteSession = async (id: string) => {
    if (!confirm('¿Eliminar esta sesión del registro?')) return;
    await apiFetch(`/api/video-sessions/${id}`, { method: 'DELETE' });
    setSessions(s => s.filter(x => x.id !== id));
  };

  if (!selectedSede) {
    return <div className="p-8 text-center text-gray-500 font-bold">Selecciona una sede en el menú lateral.</div>;
  }

  const todayStr = getPanamaToday();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            Teleconsulta
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Videoconsultas y registro de sesiones en línea</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => { fetchAppointments(); fetchSessions(); }}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DB missing warning */}
      {dbMissing && (
        <div className="rounded-2xl p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-800 mb-1">⚠️ Tabla VideoSession no encontrada en la base de datos</p>
          <p className="text-xs font-medium text-amber-700 mb-3">Debes ejecutar el siguiente SQL en Supabase Studio (SQL Editor) para habilitar el registro de sesiones:</p>
          <pre className="text-xs bg-amber-100 rounded-xl p-3 overflow-x-auto font-mono text-amber-900 whitespace-pre-wrap">{SQL_MIGRATION}</pre>
        </div>
      )}

      {/* Citas del día */}
      <section>
        <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          Citas del {selectedDate === todayStr ? 'día de hoy' : selectedDate}
          {!isLoadingAppts && <span className="font-medium text-gray-400">({appointments.length})</span>}
        </h3>
        {isLoadingAppts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-32 animate-pulse" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-400 text-sm font-medium">
            Sin citas para esta fecha. Usa la sala ad-hoc de abajo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map(a => (
              <AppointmentCard key={a.id} appt={a}
                onJoin={(roomName, apptId, patientId) => handleJoin(roomName, apptId, patientId)} />
            ))}
          </div>
        )}
      </section>

      {/* Sala ad-hoc */}
      <section>
        <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" /> Sala sin cita previa
        </h3>
        <div className="max-w-sm">
          <AdHocCard onJoin={(roomName) => handleJoin(roomName)} />
        </div>
      </section>

      {/* Sesiones registradas */}
      <section>
        <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          Sesiones registradas
          {!isLoadingSessions && <span className="font-medium text-gray-400">({sessions.length})</span>}
          {sessions.filter(s => s.status === 'OPEN').length > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {sessions.filter(s => s.status === 'OPEN').length} activa{sessions.filter(s => s.status === 'OPEN').length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>

        {dbMissing ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-400 font-medium">
            El registro de sesiones estará disponible después de ejecutar el SQL de arriba.
          </div>
        ) : isLoadingSessions ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-40 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <Video className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">
              No hay sesiones registradas {selectedDate === todayStr ? 'hoy' : 'este día'}.
            </p>
            <p className="text-xs text-gray-400 mt-1">Cada vez que hagas clic en "Unirse" se registrará la sesión automáticamente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(s => (
              <SessionCard key={s.id} session={s} patients={patients} doctors={doctors}
                onUpdate={updateSession} onDelete={deleteSession} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// SQL displayed in the warning banner when the table doesn't exist
const SQL_MIGRATION = `CREATE TABLE IF NOT EXISTS "VideoSession" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "accountId"      TEXT        NOT NULL,
  "subaccountId"   TEXT,
  "patientId"      TEXT,
  "consultationId" TEXT        UNIQUE,
  "appointmentId"  TEXT,
  "roomUrl"        TEXT        NOT NULL,
  "roomName"       TEXT        NOT NULL,
  "status"         TEXT        NOT NULL DEFAULT 'OPEN',
  "startedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endedAt"        TIMESTAMPTZ,
  "notes"          TEXT,
  "amount"         FLOAT8,
  "paymentStatus"  TEXT        NOT NULL DEFAULT 'PENDING',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "VideoSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VideoSession_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE,
  CONSTRAINT "VideoSession_subaccountId_fkey"
    FOREIGN KEY ("subaccountId") REFERENCES "Subaccount"("id") ON DELETE SET NULL,
  CONSTRAINT "VideoSession_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL,
  CONSTRAINT "VideoSession_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "ConsultationRecord"("id") ON DELETE SET NULL
);`;
