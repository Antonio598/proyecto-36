'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { X, Calendar as CalendarIcon, Clock, User, Stethoscope, Edit2, Trash2, Info, AlertCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSede } from '@/context/SedeContext';

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

export default function CalendarPage() {
  const { selectedSede } = useSede();
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const [events, setEvents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const [form, setForm] = useState({ patientId: '', serviceId: '', notes: '', status: 'CONFIRMED' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick Create Patient State
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ fullName: '', phone: '' });
  const [isCreatingPatientSubmitting, setIsCreatingPatientSubmitting] = useState(false);

  // 1. Fetch auxiliary data and calendars when Sede changes
  useEffect(() => {
    if (!selectedSede) return;
    const fetchConfigs = async () => {
      try {
        const [patientsRes, servicesRes, calendarsRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/services'),
          fetch(`/api/calendars?subaccountId=${selectedSede}`)
        ]);
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (calendarsRes.ok) {
           const data = await calendarsRes.json();
           setCalendars(data);
           if (data.length > 0 && !data.find((c: any) => c.id === selectedCalendarId)) {
             setSelectedCalendarId(data[0].id);
           } else if (data.length === 0) {
             setSelectedCalendarId('');
             setEvents([]);
           }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfigs();
  }, [selectedSede]);

  // 2. Fetch appointments when selectCalendarId or Sede changes
  const fetchAppointments = async () => {
    if (!selectedSede) return;
    try {
      let url = `/api/appointments?subaccountId=${selectedSede}`;
      if (selectedCalendarId) {
        url += `&calendarId=${selectedCalendarId}`;
      }
      const apptsRes = await fetch(url);
      if (apptsRes.ok) {
        const data = await apptsRes.json();
        const { formatInTimeZone } = require('date-fns-tz');
        const PANAMA_TZ = 'America/Panama';

        const formattedEvents = data.map((appt: any) => {
          const naiveStartStr = formatInTimeZone(new Date(appt.startTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");
          const naiveEndStr = formatInTimeZone(new Date(appt.endTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");

          return {
            id: appt.id,
            title: `${appt.service?.name} - ${appt.patient?.fullName}`,
            start: new Date(naiveStartStr),
            end: new Date(naiveEndStr),
            color: appt.service?.colorCode || '#3b82f6',
            patient: appt.patient,
            service: appt.service,
            notes: appt.notes,
            status: appt.status
          };
        });
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedSede, selectedCalendarId]);

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setForm({ patientId: '', serviceId: '', notes: '', status: 'CONFIRMED' });
    setIsCreatingPatient(false);
    setNewPatientForm({ fullName: '', phone: '' });
    setIsModalOpen(true);
    setError('');
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setForm({
      patientId: event.patient?.id || '',
      serviceId: event.service?.id || '',
      notes: event.notes || '',
      status: event.status || 'CONFIRMED'
    });
    setIsDetailModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const isEditing = !!selectedEvent;
    const url = isEditing ? `/api/appointments/${selectedEvent.id}` : '/api/appointments';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const payload: any = {
        patientId: form.patientId,
        serviceId: form.serviceId,
        notes: form.notes,
        status: form.status,
      };

      if (!isEditing) {
        payload.subaccountId = selectedSede;
        if (selectedCalendarId) {
           payload.calendarId = selectedCalendarId;
           const cal = calendars.find(c => c.id === selectedCalendarId);
           if (cal) payload.doctorId = cal.doctorId;
        }
      }

      if (!isEditing && selectedSlot) {
        payload.startTime = format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm:ss");
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar cita (posible empalme de horarios)');
      }

      await fetchAppointments();
      setIsModalOpen(false);
      setIsDetailModalOpen(false);
      setForm({ patientId: '', serviceId: '', notes: '', status: 'CONFIRMED' });
      setIsCreatingPatient(false);
      setSelectedSlot(null);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePatient = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newPatientForm.fullName || !newPatientForm.phone) {
      setError('El nombre y teléfono son obligatorios.');
      return;
    }
    setIsCreatingPatientSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatientForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear paciente');
      }
      const newPatient = await res.json();
      setPatients(prev => [...prev, newPatient]);
      setForm(prev => ({ ...prev, patientId: newPatient.id }));
      setIsCreatingPatient(false);
      setNewPatientForm({ fullName: '', phone: '' });
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsCreatingPatientSubmitting(false);
    }
  };

  const cancelAppointment = async () => {
    if (!selectedEvent) return;
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${selectedEvent.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al cancelar cita');

      await fetchAppointments();
      setIsDetailModalOpen(false);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventStyleGetter = (event: any) => {
    const baseColor = event.color || '#3b82f6';
    const isCancelled = event.status === 'CANCELLED';
    
    return {
      style: {
        background: isCancelled ? '#94a3b8' : `linear-gradient(135deg, ${baseColor}, ${baseColor}dd)`,
        borderRadius: '8px',
        color: 'white',
        border: 'none',
        display: 'block',
        padding: '6px 8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        fontWeight: '700',
        fontSize: '0.75rem',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        opacity: isCancelled ? 0.6 : 1,
        cursor: 'pointer'
      }
    };
  };

  if (!selectedSede) {
    return <div className="p-8 text-center text-gray-500 font-bold">Por favor, selecciona una sede en el menú lateral.</div>;
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      {/* Header Premium */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 py-8 px-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 pb-2">
              <CalendarIcon className="w-8 h-8 opacity-90" />
              Supervisión de Calendario
            </h2>
            <p className="mt-1 text-blue-50 max-w-xl text-sm md:text-base font-medium">
              Gestiona el tiempo de tus doctores. Selecciona qué calendario y doctor deseas inspeccionar hoy.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-[250px]">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-100">Mostrando Calendario de:</label>
            <select 
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-white/50 focus:outline-none placeholder-white appearance-none cursor-pointer hover:bg-white/20 transition-all"
            >
              {calendars.length === 0 && <option value="" className="text-black">No hay calendarios</option>}
              {calendars.length > 0 && <option value="" className="text-black">Todos (Global Sede)</option>}
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id} className="text-black">{cal.doctor?.name ? `${cal.name} - ${cal.doctor.name}` : cal.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {calendars.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Esta sede no tiene calendarios creados</h3>
          <p className="mt-2 text-sm text-gray-500">Ve a "Config Calendarios" en el menú para crear uno y empezar a agendar citas a tus doctores.</p>
        </div>
      ) : (
        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex-1 min-h-[700px] overflow-hidden relative calendar-wrapper">
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
              selectable={selectedCalendarId !== ''} // Solo dejar agendar directamente si hay UNO elegido
              onSelectSlot={(slot) => {
                 if(selectedCalendarId === '') {
                    alert('Debes seleccionar un Calendario específico en la parte superior (' + (calendars[0]?.name || '') + ') para poder agendar una nueva cita.');
                    return;
                 }
                 handleSelectSlot(slot);
              }}
              onSelectEvent={handleSelectEvent}
              step={15}
              timeslots={4}
              defaultView={Views.WEEK}
              min={new Date(new Date().setHours(7, 0, 0, 0))}
              max={new Date(new Date().setHours(21, 0, 0, 0))}
              messages={{
                today: "Hoy",
                previous: "Atrás",
                next: "Siguiente",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                showMore: total => `+ ${total} más`
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Nueva Cita */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                {selectedEvent ? 'Editar Cita' : 'Agendar Nueva Cita'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); if(selectedEvent) setIsDetailModalOpen(true); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200">{error}</div>}
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3 text-sm text-blue-900">
                 <Clock className="w-5 h-5 text-blue-600" />
                 <div><p className="font-bold">{format(selectedSlot.start, "EEEE d 'de' MMMM", { locale: es })}</p><p className="font-medium">{format(selectedSlot.start, "HH:mm")} hrs</p></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-black">Paciente *</label>
                  <button type="button" onClick={() => setIsCreatingPatient(!isCreatingPatient)} className="text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors">
                    {isCreatingPatient ? 'Usar Existente' : '+ Nuevo Paciente rápido'}
                  </button>
                </div>
                {isCreatingPatient ? (
                  <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <input type="text" placeholder="Nombre Completo" className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:ring-blue-500 focus:border-blue-500" value={newPatientForm.fullName} onChange={e => setNewPatientForm({...newPatientForm, fullName: e.target.value})} />
                    <div className="flex gap-2">
                       <input type="text" placeholder="Teléfono" className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:ring-blue-500 focus:border-blue-500" value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} />
                       <button type="button" onClick={handleCreatePatient} disabled={isCreatingPatientSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold disabled:opacity-50">
                         {isCreatingPatientSubmitting ? '...' : 'Crear'}
                       </button>
                    </div>
                  </div>
                ) : (
                  <select required className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-black font-medium" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                    <option value="" disabled>Selecciona un paciente</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Servicio *</label>
                <select required className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-black font-medium" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
                  <option value="" disabled>Selecciona un servicio</option>
                  {services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Notas</label>
                <textarea rows={2} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-black font-medium" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles Cita */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left shadow-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /> Detalles de Cita</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-6">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200">{error}</div>}
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2.5 rounded-lg shadow-sm"><User className="w-6 h-6 text-indigo-600" /></div>
                <div><p className="text-xs font-black text-indigo-600 uppercase">Paciente</p><p className="text-lg font-bold text-black">{selectedEvent.patient?.fullName}</p><p className="text-sm font-medium text-black/70">{selectedEvent.patient?.phone}</p></div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2.5 rounded-lg shadow-sm"><Stethoscope className="w-6 h-6 text-blue-600" /></div>
                <div><p className="text-xs font-black text-blue-600 uppercase">Servicio</p><p className="text-lg font-bold text-black">{selectedEvent.service?.name}</p><p className="text-sm font-medium text-black/70">{selectedEvent.service?.durationMinutes} min</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><p className="text-xs font-black text-gray-400 uppercase">Fecha</p><p className="text-sm font-bold text-black">{format(selectedEvent.start, "d 'de' MMM", { locale: es })}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><p className="text-xs font-black text-gray-400 uppercase">Horario</p><p className="text-sm font-bold text-black">{format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")}</p></div>
              </div>

              {selectedEvent.notes && <div className="p-4 bg-amber-50 rounded-xl border border-amber-100"><p className="text-xs font-black text-amber-600 uppercase">Notas</p><p className="text-sm font-medium text-black">{selectedEvent.notes}</p></div>}

              <div><span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedEvent.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedEvent.status === 'CONFIRMED' ? 'Cita Confirmada' : 'Cita Cancelada'}</span></div>

              <div className="mt-8 flex justify-between gap-3 pt-6 border-t border-gray-100">
                <button onClick={cancelAppointment} disabled={isSubmitting || selectedEvent.status === 'CANCELLED'} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Cancelar Cita
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setIsDetailModalOpen(false); setIsModalOpen(true); setSelectedSlot({ start: selectedEvent.start, end: selectedEvent.end }); }} disabled={selectedEvent.status === 'CANCELLED'} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"><Edit2 className="w-4 h-4" /> Editar</button>
                  <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 rounded-lg">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
