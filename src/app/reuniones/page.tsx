'use client';

import { useState, useEffect } from 'react';
import { Video, Copy, Phone, Clock, User, CheckCheck, ExternalLink, ChevronDown, ChevronUp, Calendar, Wifi, Plus } from 'lucide-react';
import { useSede } from '@/context/SedeContext';
import { apiFetch } from '@/lib/apiFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

const PANAMA_TZ = 'America/Panama';

// Get today's date in Panama timezone (YYYY-MM-DD)
function getPanamaToday(): string {
  return formatInTimeZone(new Date(), PANAMA_TZ, 'yyyy-MM-dd');
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  totalPrice: number;
  isBlocker: boolean;
  patient: { id: string; fullName: string; email: string | null; phone: string | null } | null;
  service: { id: string; name: string } | null;
}

function getRoomUrl(appointmentId: string) {
  return `https://meet.jit.si/galenus-${appointmentId}`;
}

function getTimeLabel(startTime: string): { label: string; color: string } {
  const start = parseISO(startTime);
  const diff = differenceInMinutes(start, new Date());
  if (diff < -60) return { label: 'Finalizada', color: '#9ca3af' };
  if (diff < 0)   return { label: 'En curso', color: '#ef4444' };
  if (diff <= 15) return { label: '¡Ahora!', color: '#ef4444' };
  if (diff <= 60) return { label: `En ${diff} min`, color: '#f59e0b' };
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return { label: m > 0 ? `En ${h}h ${m}m` : `En ${h}h`, color: '#3b82f6' };
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const [copied, setCopied] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const roomUrl = getRoomUrl(appt.id);
  const startFormatted = formatInTimeZone(parseISO(appt.startTime), PANAMA_TZ, 'HH:mm');
  const endFormatted   = formatInTimeZone(parseISO(appt.endTime),   PANAMA_TZ, 'HH:mm');
  const timeLabel = getTimeLabel(appt.startTime);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copia este enlace:', roomUrl);
    }
  };

  const shareWhatsApp = () => {
    const phone = appt.patient?.phone?.replace(/\D/g, '') || '';
    const name  = appt.patient?.fullName || 'paciente';
    const msg = encodeURIComponent(
      `Hola ${name}, te comparto el enlace para tu consulta virtual de hoy a las ${startFormatted}:\n\n${roomUrl}\n\nHaz clic para unirte desde tu dispositivo, no necesitas instalar nada.`
    );
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-1" style={{
        background: timeLabel.color === '#ef4444'
          ? 'linear-gradient(90deg, #ef4444, #f97316)'
          : 'linear-gradient(90deg, #3b82f6, #6366f1)'
      }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{appt.patient?.fullName || 'Paciente'}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{appt.service?.name || 'Sin servicio'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-700">{startFormatted} – {endFormatted}</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ color: timeLabel.color, background: `${timeLabel.color}18` }}>
              {timeLabel.label}
            </span>
          </div>
        </div>

        {/* Room URL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-bold text-gray-500 truncate flex-1">{roomUrl}</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          >
            <Video className="w-4 h-4" />
            Unirse
          </a>

          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>

          {(appt.patient?.phone || true) && (
            <button onClick={shareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ color: '#16a34a', background: '#f0fdf4' }}>
              <Phone className="w-4 h-4" />
              WhatsApp
            </button>
          )}

          <button onClick={() => setShowFrame(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors ml-auto">
            {showFrame ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showFrame ? 'Cerrar sala' : 'Abrir sala aquí'}
          </button>
        </div>

        {showFrame && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200" style={{ height: '520px' }}>
            <iframe
              src={`${roomUrl}#userInfo.displayName="Doctor Galenus"&config.prejoinPageEnabled=false`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0 bg-gray-900"
              title={`Sala - ${appt.patient?.fullName || 'Paciente'}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AdHocCard() {
  const [copied, setCopied] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const roomUrl = `https://meet.jit.si/galenus-sala-${Date.now().toString(36)}`;
  const [fixedUrl] = useState(roomUrl);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fixedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copia este enlace:', fixedUrl);
    }
  };

  return (
    <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-5 hover:border-blue-400 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-sm">Sala sin cita previa</p>
          <p className="text-xs text-gray-400 font-medium">Sala única generada para esta sesión</p>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
        <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-500 truncate flex-1">{fixedUrl}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={fixedUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
          <Video className="w-4 h-4" />
          Unirse
        </a>
        <button onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? '¡Copiado!' : 'Copiar enlace'}
        </button>
        <button onClick={() => setShowFrame(f => !f)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors ml-auto">
          {showFrame ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showFrame ? 'Cerrar sala' : 'Abrir sala aquí'}
        </button>
      </div>
      {showFrame && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200" style={{ height: '520px' }}>
          <iframe
            src={`${fixedUrl}#userInfo.displayName="Doctor Galenus"&config.prejoinPageEnabled=false`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0 bg-gray-900"
            title="Sala ad-hoc"
          />
        </div>
      )}
    </div>
  );
}

export default function ReunionesPage() {
  const { selectedSede } = useSede();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getPanamaToday());

  useEffect(() => {
    if (!selectedSede) return;
    fetchAppointments();
  }, [selectedSede, selectedDate]);

  const fetchAppointments = async () => {
    if (!selectedSede) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/appointments?subaccountId=${selectedSede}&date=${selectedDate}`);
      if (res.ok) {
        const data: Appointment[] = await res.json();
        // Exclude calendar blockers only
        setAppointments(data.filter(a => !a.isBlocker));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedSede) {
    return (
      <div className="p-8 text-center text-gray-500 font-bold">
        Por favor, selecciona una sede en el menú lateral.
      </div>
    );
  }

  const todayStr = getPanamaToday();
  const isSelectedToday = selectedDate === todayStr;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            Teleconsulta
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Inicia o únete a videoconsultas. Sin instalaciones, directamente desde el navegador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: '1px solid #dbeafe' }}>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-blue-900">¿Cómo funciona?</p>
          <p className="text-xs font-medium text-blue-700 mt-0.5 leading-relaxed">
            Cada cita agendada tiene una sala virtual única. Haz clic en <strong>Unirse</strong> para entrar,
            o copia el enlace y envíaselo a tu paciente por WhatsApp. También puedes crear una <strong>sala sin cita previa</strong> si lo necesitas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl mb-4" />
              <div className="flex gap-2">
                <div className="h-9 bg-gray-100 rounded-xl w-24" />
                <div className="h-9 bg-gray-100 rounded-xl w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {appointments.length > 0 ? (
            <div>
              <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Citas del {isSelectedToday ? 'día de hoy' : selectedDate}
                <span className="font-medium text-gray-400">({appointments.length} cita{appointments.length !== 1 ? 's' : ''})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Video className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-black text-gray-700">Sin citas {isSelectedToday ? 'hoy' : 'este día'}</p>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Usa la sala ad-hoc de abajo para iniciar una videoconsulta igualmente.
              </p>
            </div>
          )}

          {/* Ad-hoc section — always visible */}
          <div>
            <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Sala instantánea (sin cita previa)
            </h3>
            <AdHocCard />
          </div>
        </div>
      )}
    </div>
  );
}
