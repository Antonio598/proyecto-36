'use client';

import { useState, useEffect } from 'react';
import { Video, Copy, Phone, Clock, User, Stethoscope, CheckCheck, ExternalLink, ChevronDown, ChevronUp, Calendar, Wifi } from 'lucide-react';
import { useSede } from '@/context/SedeContext';
import { apiFetch } from '@/lib/apiFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { isToday, isFuture, differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

const PANAMA_TZ = 'America/Panama';

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

function getTimeLabel(startTime: string): { label: string; color: string; urgent: boolean } {
  const start = parseISO(startTime);
  const now = new Date();
  const diff = differenceInMinutes(start, now);

  if (diff < -5) return { label: 'En curso / Pasada', color: '#9ca3af', urgent: false };
  if (diff <= 10) return { label: '¡Ahora!', color: '#ef4444', urgent: true };
  if (diff <= 30) return { label: `En ${diff} min`, color: '#f59e0b', urgent: true };
  if (diff <= 60) return { label: `En ${diff} min`, color: '#3b82f6', urgent: false };
  return { label: formatInTimeZone(start, PANAMA_TZ, 'HH:mm', { locale: es }), color: '#6b7280', urgent: false };
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const [copied, setCopied] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const roomUrl = getRoomUrl(appt.id);
  const startFormatted = formatInTimeZone(parseISO(appt.startTime), PANAMA_TZ, 'HH:mm');
  const endFormatted = formatInTimeZone(parseISO(appt.endTime), PANAMA_TZ, 'HH:mm');
  const timeLabel = getTimeLabel(appt.startTime);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copia este enlace para el paciente:', roomUrl);
    }
  };

  const shareWhatsApp = () => {
    const phone = appt.patient?.phone?.replace(/\D/g, '') || '';
    const msg = encodeURIComponent(
      `Hola ${appt.patient?.fullName || 'paciente'}, te comparto el enlace para tu consulta virtual de hoy a las ${startFormatted}:\n\n${roomUrl}\n\nHaz clic para unirte desde tu computadora o celular.`
    );
    const url = phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Top color bar based on urgency */}
      <div className="h-1" style={{ background: timeLabel.urgent ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{appt.patient?.fullName || 'Paciente'}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{appt.service?.name || 'Servicio'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
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

        {/* Meeting link box */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-bold text-gray-600 truncate flex-1">{roomUrl}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          >
            <Video className="w-4 h-4" />
            Unirse
          </a>

          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>

          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ color: '#16a34a', background: '#f0fdf4' }}
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </button>

          <button
            onClick={() => setShowFrame(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors ml-auto"
          >
            {showFrame ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showFrame ? 'Cerrar sala' : 'Abrir sala aquí'}
          </button>
        </div>

        {/* Embedded Jitsi frame */}
        {showFrame && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-900"
            style={{ height: '520px' }}>
            <iframe
              src={`${roomUrl}#userInfo.displayName="Doctor Galenus"&config.startWithVideoMuted=false`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title={`Sala de videoconsulta - ${appt.patient?.fullName}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReunionesPage() {
  const { selectedSede } = useSede();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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
        // Only real appointments (not blockers)
        setAppointments(data.filter(a => !a.isBlocker && a.patient));
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

  const todayStr = new Date().toISOString().split('T')[0];
  const isSelectedToday = selectedDate === todayStr;

  // Split into upcoming (within 3h or past <30min) vs rest
  const now = new Date();
  const upcoming = appointments.filter(a => {
    const diff = differenceInMinutes(parseISO(a.startTime), now);
    return diff >= -30 && diff <= 180;
  });
  const others = appointments.filter(a => {
    const diff = differenceInMinutes(parseISO(a.startTime), now);
    return !(diff >= -30 && diff <= 180);
  });

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
            Inicia o únete a videoconsultas con tus pacientes sin instalar nada.
          </p>
        </div>

        {/* Date picker */}
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

      {/* How it works banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: '1px solid #dbeafe' }}>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-blue-900">¿Cómo funciona?</p>
          <p className="text-xs font-medium text-blue-700 mt-0.5 leading-relaxed">
            Cada cita tiene una sala virtual única. Haz clic en <strong>Unirse</strong> para entrar desde tu navegador,
            o comparte el enlace con tu paciente vía WhatsApp. No se requiere instalar ninguna aplicación.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
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
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-black text-gray-800 text-lg">Sin teleconsultas {isSelectedToday ? 'hoy' : 'este día'}</p>
          <p className="text-sm font-medium text-gray-400 mt-2">
            Las citas agendadas para {isSelectedToday ? 'hoy' : 'esta fecha'} aparecerán aquí con su sala de video lista.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Upcoming / active */}
          {isSelectedToday && upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Próximas / En curso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            </div>
          )}

          {/* All or rest */}
          {(others.length > 0 || !isSelectedToday) && (
            <div>
              {isSelectedToday && upcoming.length > 0 && (
                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Más tarde hoy
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isSelectedToday ? others : appointments).map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
