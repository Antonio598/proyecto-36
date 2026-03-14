'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { X, Calendar as CalendarIcon, Clock, User, Stethoscope } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarPage() {
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const [events, setEvents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [form, setForm] = useState({ patientId: '', serviceId: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [apptsRes, patientsRes, servicesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/patients'),
        fetch('/api/services')
      ]);

      if (patientsRes.ok) setPatients(await patientsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      
      if (apptsRes.ok) {
        const data = await apptsRes.json();
        const formattedEvents = data.map((appt: any) => ({
          id: appt.id,
          title: `${appt.service?.name} - ${appt.patient?.fullName}`,
          start: new Date(appt.startTime),
          end: new Date(appt.endTime),
          color: appt.service?.colorCode || '#3b82f6'
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching calendar data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    setSelectedSlot(slotInfo);
    setIsModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: form.patientId,
          serviceId: form.serviceId,
          notes: form.notes,
          startTime: selectedSlot.start.toISOString(),
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al agendar cita');
      }

      await fetchData();
      setIsModalOpen(false);
      setForm({ patientId: '', serviceId: '', notes: '' });
      setSelectedSlot(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventStyleGetter = (event: any) => {
    // Generamos un gradiente elegante usando el color base del evento
    const baseColor = event.color || '#3b82f6';
    return {
      style: {
        background: `linear-gradient(135deg, ${baseColor}, ${baseColor}dd)`,
        borderRadius: '8px',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        display: 'block',
        padding: '6px 8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
        fontWeight: '600',
        fontSize: '0.8rem',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }
    };
  };

  return (
    <div className="flex flex-col gap-8 h-full pb-10">
      {/* Header Premium */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 py-10 px-8 text-white shadow-xl">
        <div className="relative z-10 flex sm:items-center justify-between flex-col sm:flex-row gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 pb-2">
              <CalendarIcon className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
              Tu Agenda
            </h2>
            <p className="mt-2 text-blue-100 max-w-xl text-sm md:text-base pb-2">
              Administra tu tiempo con elegancia. Selecciona cualquier espacio libre en el calendario y agenda una nueva cita en segundos.
            </p>
          </div>
          <div className="hidden sm:block">
            {/* Opcional: stats rápidas o ilustración floral/geométrica */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-inner flex flex-col items-center justify-center min-w-[140px]">
              <p className="text-xs text-blue-100 font-medium uppercase tracking-wider mb-2">Citas Hoy</p>
              <p className="text-4xl font-black">{events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).length}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute -bottom-24 right-24 w-48 h-48 bg-blue-400 opacity-20 rounded-full blur-2xl mix-blend-overlay"></div>
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 min-h-[700px] overflow-hidden relative calendar-wrapper">
         <div className="h-full bg-white rounded-xl overflow-hidden">
           <Calendar
            localizer={localizer}
            events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', fontFamily: 'inherit' }}
          culture="es"
          view={view}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          onView={(newView) => setView(newView as any)}
          eventPropGetter={eventStyleGetter}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          step={15}
          timeslots={4}
          defaultView={Views.WEEK}
          min={new Date(new Date().setHours(7, 0, 0, 0))} // Start at 7 AM
          max={new Date(new Date().setHours(20, 0, 0, 0))} // End at 8 PM
          messages={{
            today: "Hoy",
            previous: "Atrás",
            next: "Siguiente",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Cita",
            showMore: total => `+ ${total} más`
          }}
        />
        </div>
      </div>

      {/* Modal Nueva Cita Glassmorphism */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/60 backdrop-blur-sm p-4 sm:p-0 transition-opacity">
          <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
                Nueva Cita
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-3 text-sm text-blue-900 mb-6">
                 <Clock className="w-4 h-4 text-blue-600" />
                 <div>
                    <span className="font-semibold">{format(selectedSlot.start, "EEEE d 'de' MMMM", { locale: es })}</span>
                    <div>{format(selectedSlot.start, "HH:mm")} hrs</div>
                 </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                   <User className="w-4 h-4" /> Paciente *
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                >
                  <option value="" disabled>Selecciona un paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>
                  ))}
                </select>
                {patients.length === 0 && <p className="text-xs text-amber-600 mt-1">No tienes pacientes registrados. Ve a la pestaña Pacientes primero.</p>}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                   <Stethoscope className="w-4 h-4" /> Servicio *
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  <option value="" disabled>Selecciona un servicio</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min)</option>
                  ))}
                </select>
                {services.length === 0 && <p className="text-xs text-amber-600 mt-1">No tienes servicios registrados. Ve a la pestaña Catálogo primero.</p>}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                   Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Ej. Paciente viene acompañado, requiere atención especial..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || patients.length === 0 || services.length === 0}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
