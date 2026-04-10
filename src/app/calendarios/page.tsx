'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Edit2, Trash2, X } from 'lucide-react';
import { useSede } from '@/context/SedeContext';
import { apiFetch } from '@/lib/apiFetch';

interface Doctor { id: string; name: string; subaccountId: string; }
interface Calendar {
  id: string;
  name: string;
  subaccountId: string;
  doctorId: string;
  doctor?: Doctor;
  _count?: { appointments: number; configurations: number; };
}

export default function CalendariosPage() {
  const { selectedSede } = useSede();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [formData, setFormData] = useState({ name: '', doctorId: '' });
  
  // SCHEDULE MODAL
  const [scheduleModalState, setScheduleModalState] = useState<{isOpen: boolean, calendarId: string | null, calendarName: string | null}>({ isOpen: false, calendarId: null, calendarName: null });
  const [schedules, setSchedules] = useState([
    { dayOfWeek: 1, active: true, startTime: '09:00', endTime: '18:00' }, // Lunes
    { dayOfWeek: 2, active: true, startTime: '09:00', endTime: '18:00' }, // Martes
    { dayOfWeek: 3, active: true, startTime: '09:00', endTime: '18:00' }, // Miércoles
    { dayOfWeek: 4, active: true, startTime: '09:00', endTime: '18:00' }, // Jueves
    { dayOfWeek: 5, active: true, startTime: '09:00', endTime: '18:00' }, // Viernes
    { dayOfWeek: 6, active: false, startTime: '09:00', endTime: '14:00' }, // Sábado
    { dayOfWeek: 0, active: false, startTime: '09:00', endTime: '14:00' }, // Domingo
  ]);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  
  const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const fetchData = async () => {
    if (!selectedSede) return;
    setIsLoading(true);
    try {
      const [calRes, docRes] = await Promise.all([
        apiFetch(`/api/calendars?subaccountId=${selectedSede}`),
        apiFetch(`/api/doctors?subaccountId=${selectedSede}`)
      ]);
      if (calRes.ok) setCalendars(await calRes.json());
      if (docRes.ok) setDoctors(await docRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openScheduleModal = async (calendarId: string, calendarName: string) => {
    if (!selectedSede) return;
    setScheduleModalState({ isOpen: true, calendarId, calendarName });
    setIsSavingSchedules(false);
    
    // Reset to defaults first
    const defaultSchedules = [
      { dayOfWeek: 1, active: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, active: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, active: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, active: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, active: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 6, active: false, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 0, active: false, startTime: '09:00', endTime: '14:00' },
    ];
    setSchedules(defaultSchedules);

    try {
      let url = `/api/availability-rules?subaccountId=${selectedSede}`;
      if (calendarId) url += `&calendarId=${calendarId}`;
      
      const res = await apiFetch(url);
      if (res.ok) {
        let rules = await res.json();
        
        // Ya no traemos reglas globales como plantilla, solo las del calendario.

        if (rules.length > 0) {
           const updatedSchedules = defaultSchedules.map(s => {
             const rule = rules.find((r: any) => r.dayOfWeek === s.dayOfWeek);
             if (rule) return { ...s, active: true, startTime: rule.startTime, endTime: rule.endTime };
             return { ...s, active: false };
           });
           setSchedules(updatedSchedules);
        }
      }
    } catch(err) { console.error('Error fetching rules', err); }
  };

  useEffect(() => { 
    fetchData(); 
  }, [selectedSede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSede) return;
    const url = editingCalendar ? `/api/calendars/${editingCalendar.id}` : '/api/calendars';
    const payload = { ...formData, subaccountId: selectedSede };
    const res = await apiFetch(url, {
      method: editingCalendar ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchData();
      setIsModalOpen(false);
    } else {
      alert('Error guardando');
    }
  };

  const deleteCalendar = async (id: string) => {
    if (!confirm('¿Seguro?')) return;
    const res = await apiFetch(`/api/calendars/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleSaveSchedules = async () => {
    if (!selectedSede) return;
    setIsSavingSchedules(true);
    const activeRules = schedules.filter(s => s.active).map(s => ({
       dayOfWeek: s.dayOfWeek,
       startTime: s.startTime,
       endTime: s.endTime
    }));
    
    try {
      const res = await apiFetch('/api/availability-rules', {
        method: 'POST',
        body: JSON.stringify({ subaccountId: selectedSede, calendarId: scheduleModalState.calendarId, rules: activeRules })
      });
      
      const responseData = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setScheduleModalState({ isOpen: false, calendarId: null, calendarName: null });
        alert('Horarios semanales guardados correctamente.');
      } else {
        alert(`Error al guardar los horarios: ${responseData.details || responseData.error || 'Desconocido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsSavingSchedules(false);
    }
  };

  if (!selectedSede) {
    return <div className="p-8 text-center text-gray-500 font-bold">Por favor, selecciona una sede en el menú lateral.</div>;
  }

  return (
    <div className="flex flex-col gap-8 min-h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Calendarios de la Sede
          </h2>
        </div>
        <button 
          onClick={() => { setEditingCalendar(null); setFormData({ name: '', doctorId: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Calendario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 text-left font-bold text-sm text-black">Nombre</th>
              <th className="px-3 py-3.5 text-left font-bold text-sm text-black">Médico Responsable</th>
              <th className="py-3.5 pr-4 text-right font-bold text-sm text-black">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? <tr><td colSpan={3} className="py-8 text-center text-sm font-bold text-black">Cargando...</td></tr> : 
              calendars.map(cal => (
                <tr key={cal.id}>
                  <td className="py-4 pl-4 text-sm font-bold text-gray-900">{cal.name}</td>
                  <td className="px-3 py-4 text-sm font-medium text-gray-700">{cal.doctor?.name || '---'}</td>
                  <td className="py-4 pr-4 text-right flex items-center justify-end gap-2">
                    <button onClick={() => openScheduleModal(cal.id, cal.name)} className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Horario</button>
                    <button onClick={() => { setEditingCalendar(cal); setFormData({ name: cal.name, doctorId: cal.doctorId }); setIsModalOpen(true); }} className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded">Editar</button>
                    <button onClick={() => deleteCalendar(cal.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded">Borrar</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-xl text-black">Calendario</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1 text-gray-900">Nombre *</label><input required className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-900">Médico *</label>
                <select required className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded" value={formData.doctorId} onChange={e=>setFormData({...formData, doctorId: e.target.value})}>
                  <option value="">Selecciona Médico...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 font-bold text-gray-700 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 font-bold text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
               <div>
                 <h3 className="font-bold text-xl text-black flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600"/> Horario Semanal ({scheduleModalState.calendarName})</h3>
                 <p className="text-sm text-gray-500 mt-1">Configura las horas en las que este calendario recibe citas.</p>
               </div>
               <button onClick={() => setScheduleModalState({ isOpen: false, calendarId: null, calendarName: null })}><X className="text-gray-400 hover:text-black"/></button>
            </div>
            
            <div className="space-y-3 mt-6">
               {schedules.map((schedule, i) => (
                  <div key={schedule.dayOfWeek} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={schedule.active} onChange={(e) => {
                           const newSheds = [...schedules];
                           newSheds[i].active = e.target.checked;
                           setSchedules(newSheds);
                        }} />
                        <span className="font-bold text-gray-800 text-sm">{DAYS_OF_WEEK[schedule.dayOfWeek]}</span>
                     </label>
                     
                     {schedule.active ? (
                        <div className="flex items-center gap-2 flex-1">
                           <input type="time" className="border border-gray-300 text-sm p-1.5 rounded bg-white text-gray-900 w-full" value={schedule.startTime} onChange={(e) => {
                              const newSheds = [...schedules];
                              newSheds[i].startTime = e.target.value;
                              setSchedules(newSheds);
                           }} />
                           <span className="text-gray-400 text-sm font-medium">a</span>
                           <input type="time" className="border border-gray-300 text-sm p-1.5 rounded bg-white text-gray-900 w-full" value={schedule.endTime} onChange={(e) => {
                              const newSheds = [...schedules];
                              newSheds[i].endTime = e.target.value;
                              setSchedules(newSheds);
                           }} />
                        </div>
                     ) : (
                        <div className="text-sm text-gray-400 font-medium italic flex-1 pl-2">Cerrado</div>
                     )}
                  </div>
               ))}
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <button 
                type="button" 
                onClick={() => setScheduleModalState({ isOpen: false, calendarId: null, calendarName: null })} 
                className="px-4 py-2 bg-gray-100/80 hover:bg-gray-200 font-bold text-gray-700 rounded transition-colors"
                disabled={isSavingSchedules}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSchedules}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded shadow-sm transition-colors flex items-center gap-2"
                disabled={isSavingSchedules}
              >
                {isSavingSchedules ? 'Guardando...' : 'Guardar Horarios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
