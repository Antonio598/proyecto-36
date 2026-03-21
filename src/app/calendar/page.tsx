'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { X, Calendar as CalendarIcon, Clock, User, Stethoscope, Edit2, Trash2, Info, Ban, ChevronDown, Check } from 'lucide-react';
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
  
  // Custom Dropdown State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const [form, setForm] = useState({ patientId: '', serviceId: '', notes: '', status: 'CONFIRMED' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isBlockMode, setIsBlockMode] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);

  // Quick Create Patient State
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ fullName: '', phone: '' });
  const [isCreatingPatientSubmitting, setIsCreatingPatientSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedSede) return;
    const fetchConfigs = async () => {
      try {
        const [patientsRes, servicesRes, calendarsRes] = await Promise.all([
          fetch('/api/patients'),
          fetch(`/api/services?subaccountId=${selectedSede}`),
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

        const formattedEvents = data
          .filter((appt: any) => !(appt.isBlocker && appt.status === 'CANCELLED')) // Filter soft-deleted blockers
          .map((appt: any) => {
          const naiveStartStr = formatInTimeZone(new Date(appt.startTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");
          const naiveEndStr = formatInTimeZone(new Date(appt.endTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");

          return {
            id: appt.id,
            title: appt.isBlocker ? (appt.notes || 'Tiempo Bloqueado') : `${appt.service?.name} - ${appt.patient?.fullName}`,
            start: new Date(naiveStartStr),
            end: new Date(naiveEndStr),
            color: appt.isBlocker ? '#64748b' : (appt.service?.colorCode || '#3b82f6'),
            patient: appt.patient,
            service: appt.service,
            notes: appt.notes,
            status: appt.status,
            isBlocker: appt.isBlocker
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
    setIsBlockMode(false);
    setRepeatCount(1);
    setIsCreatingPatient(false);
    setNewPatientForm({ fullName: '', phone: '' });
    setIsModalOpen(true);
    setError('');
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsBlockMode(event.isBlocker || false);
    setRepeatCount(1);
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
        patientId: isBlockMode ? undefined : form.patientId,
        serviceId: isBlockMode ? undefined : form.serviceId,
        notes: form.notes,
        status: form.status,
        isBlocker: isBlockMode,
        repeatCount: isBlockMode ? repeatCount : 1
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
        if (isBlockMode) {
          payload.endTime = format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm:ss");
        }
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
      setIsBlockMode(false);
      setRepeatCount(1);
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
    if (!confirm(isBlockMode ? '¿Deseas eliminar este bloqueo de horario?' : '¿Estás seguro de que deseas cancelar esta cita?')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${selectedEvent.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al cancelar');

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
    
    if (event.isBlocker) {
      return {
        style: {
          background: 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 10px, #e2e8f0 10px, #e2e8f0 20px)',
          borderRadius: '8px',
          color: '#334155',
          border: '1px solid #94a3b8',
          display: 'block',
          padding: '6px 8px',
          fontWeight: '800',
          fontSize: '0.75rem',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          opacity: 0.95,
          cursor: 'pointer'
        }
      };
    }

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
          
          <div className="flex flex-col gap-2 min-w-[300px]" ref={calendarRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-blue-100 pl-1">Seleccionar Calendario:</label>
            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`w-full flex items-center justify-between bg-white text-gray-900 border ${isCalendarOpen ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'} text-sm font-bold rounded-xl p-3.5 shadow-md transition-all duration-200`}
              >
                <span className="truncate">
                  {calendars.length === 0 ? 'Sin calendarios creados' : 
                   selectedCalendarId === '' ? 'Todos (Vista Global)' : 
                   (calendars.find(c => c.id === selectedCalendarId)?.name + (calendars.find(c => c.id === selectedCalendarId)?.doctor?.name ? ` - ${calendars.find(c => c.id === selectedCalendarId)?.doctor?.name}` : ''))}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isCalendarOpen ? '-rotate-180 text-blue-500' : ''}`} />
              </button>

              {isCalendarOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden py-1">
                  {calendars.length > 0 && (
                    <button
                      onClick={() => { setSelectedCalendarId(''); setIsCalendarOpen(false); }}
                      className={`w-full text-left flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedCalendarId === '' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                    >
                      Todos (Vista Global)
                      {selectedCalendarId === '' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  )}
                  {calendars.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 font-medium text-center">No hay calendarios</div>
                  ) : (
                    calendars.map(cal => (
                      <button
                        key={cal.id}
                        onClick={() => { setSelectedCalendarId(cal.id); setIsCalendarOpen(false); }}
                        className={`w-full text-left flex items-center justify-between px-4 py-3 text-sm transition-colors ${selectedCalendarId === cal.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                      >
                        <span className="truncate">{cal.doctor?.name ? `${cal.name} - ${cal.doctor.name}` : cal.name}</span>
                        {selectedCalendarId === cal.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
              selectable={selectedCalendarId !== ''} 
              onSelectSlot={(slot) => {
                 if(selectedCalendarId === '') {
                    alert('Debes seleccionar un Calendario específico en la parte superior (' + (calendars[0]?.name || '') + ') para poder agendar o bloquear un espacio.');
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

      {/* Modal Nueva Cita o Bloqueo */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 overflow-hidden">
            
            {!selectedEvent && (
              <div className="flex bg-gray-50 border-b border-gray-100">
                <button 
                  type="button"
                  onClick={() => { setIsBlockMode(false); setRepeatCount(1); }}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${!isBlockMode ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Agendar Cita
                </button>
                <button 
                  type="button"
                  onClick={() => setIsBlockMode(true)}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${isBlockMode ? 'text-slate-700 border-b-2 border-slate-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Bloquear Horario
                </button>
                <button onClick={() => { setIsModalOpen(false); }} className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-200 transition-colors"><X className="h-5 w-5" /></button>
              </div>
            )}
            
            {selectedEvent && (
               <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-lg font-bold text-black flex items-center gap-2">
                   {isBlockMode ? <Ban className="w-5 h-5 text-slate-600" /> : <CalendarIcon className="w-5 h-5 text-blue-600" />}
                   {isBlockMode ? 'Editar Bloqueo' : 'Editar Cita'}
                 </h3>
                 <button onClick={() => { setIsModalOpen(false); setIsDetailModalOpen(true); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 transition-colors"><X className="h-5 w-5" /></button>
               </div>
            )}
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200">{error}</div>}
              
              <div className={`${isBlockMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-blue-50 border-blue-100 text-blue-900'} p-3 rounded-lg border flex items-center justify-between text-sm`}>
                 <div className="flex items-center gap-3">
                   <Clock className={`w-5 h-5 ${isBlockMode ? 'text-slate-500' : 'text-blue-600'}`} />
                   <div><p className="font-bold">{format(selectedSlot.start, "EEEE d 'de' MMMM", { locale: es })}</p><p className="font-medium">{format(selectedSlot.start, "HH:mm")} - {format(selectedSlot.end, "HH:mm")} hrs</p></div>
                 </div>
                 {isBlockMode && !selectedEvent && (
                    <div className="text-right">
                       <label className="text-xs font-bold text-slate-500 block">Repetir (Días)</label>
                       <select value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value))} className="mt-1 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded p-1 outline-none">
                          <option value={1}>Solo hoy</option>
                          <option value={2}>2 días</option>
                          <option value={3}>3 días</option>
                          <option value={4}>4 días</option>
                          <option value={5}>5 días</option>
                          <option value={6}>6 días</option>
                          <option value={7}>1 semana</option>
                       </select>
                    </div>
                 )}
              </div>

              {!isBlockMode && (
                <>
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
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-black mb-1">{isBlockMode ? 'Motivo del bloqueo (Opcional)' : 'Notas Adicionales'}</label>
                <textarea rows={isBlockMode ? 3 : 2} placeholder={isBlockMode ? 'Ej. Hora de Comida, Salida Temprano...' : ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-black font-medium" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className={`rounded-md px-6 py-2 text-sm font-bold text-white transition-all disabled:opacity-50 ${isBlockMode ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSubmitting ? 'Guardando...' : (isBlockMode ? (repeatCount > 1 ? `Bloquear ${repeatCount} Días` : 'Bloquear Horario') : 'Confirmar Cita')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left shadow-2xl overflow-hidden">
            <div className={`${isBlockMode ? 'bg-slate-100 border-slate-200' : 'bg-gray-50 border-gray-100'} px-6 py-5 border-b flex items-center justify-between`}>
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                 {isBlockMode ? <Ban className="w-5 h-5 text-slate-600" /> : <Info className="w-5 h-5 text-blue-600" />} 
                 {isBlockMode ? 'Espacio Bloqueado' : 'Detalles de Cita'}
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-6">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200">{error}</div>}
              
              {!isBlockMode && (
                <>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm"><User className="w-6 h-6 text-indigo-600" /></div>
                    <div><p className="text-xs font-black text-indigo-600 uppercase">Paciente</p><p className="text-lg font-bold text-black">{selectedEvent.patient?.fullName}</p><p className="text-sm font-medium text-black/70">{selectedEvent.patient?.phone}</p></div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm"><Stethoscope className="w-6 h-6 text-blue-600" /></div>
                    <div><p className="text-xs font-black text-blue-600 uppercase">Servicio</p><p className="text-lg font-bold text-black">{selectedEvent.service?.name}</p><p className="text-sm font-medium text-black/70">{selectedEvent.service?.durationMinutes} min</p></div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isBlockMode ? 'bg-slate-50 border-slate-100' : 'bg-gray-50 border-gray-100'}`}>
                   <p className="text-xs font-black text-gray-400 uppercase">Fecha</p>
                   <p className="text-sm font-bold text-black">{format(selectedEvent.start, "d 'de' MMM", { locale: es })}</p>
                </div>
                <div className={`p-4 rounded-xl border ${isBlockMode ? 'bg-slate-50 border-slate-100' : 'bg-gray-50 border-gray-100'}`}>
                   <p className="text-xs font-black text-gray-400 uppercase">Horario</p>
                   <p className="text-sm font-bold text-black">{format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")}</p>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className={`p-4 rounded-xl border ${isBlockMode ? 'bg-slate-100 border-slate-200' : 'bg-amber-50 border-amber-100'}`}>
                   <p className={`text-xs font-black uppercase mb-1 ${isBlockMode ? 'text-slate-600' : 'text-amber-600'}`}>
                      {isBlockMode ? 'Motivo del Bloqueo' : 'Notas'}
                   </p>
                   <p className="text-sm font-medium text-black">{selectedEvent.notes}</p>
                </div>
              )}

              {!isBlockMode && (
                <div><span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedEvent.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedEvent.status === 'CONFIRMED' ? 'Cita Confirmada' : 'Cita Cancelada'}</span></div>
              )}

              <div className="mt-8 flex justify-between gap-3 pt-6 border-t border-gray-100">
                <button onClick={cancelAppointment} disabled={isSubmitting || selectedEvent.status === 'CANCELLED'} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors">
                  <Trash2 className="w-4 h-4" /> {isBlockMode ? 'Eliminar Bloqueo' : 'Cancelar Cita'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setIsDetailModalOpen(false); setIsModalOpen(true); setSelectedSlot({ start: selectedEvent.start, end: selectedEvent.end }); }} disabled={selectedEvent.status === 'CANCELLED'} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"><Edit2 className="w-4 h-4" /> Editar</button>
                  <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 rounded-lg transition-colors">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
