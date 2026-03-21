'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Edit2, Trash2, X } from 'lucide-react';
import { useSede } from '@/context/SedeContext';

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

  const fetchData = async () => {
    if (!selectedSede) return;
    setIsLoading(true);
    try {
      const [calRes, docRes] = await Promise.all([
        fetch(`/api/calendars?subaccountId=${selectedSede}`),
        fetch(`/api/doctors?subaccountId=${selectedSede}`)
      ]);
      if (calRes.ok) setCalendars(await calRes.json());
      if (docRes.ok) setDoctors(await docRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedSede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSede) return;
    const url = editingCalendar ? `/api/calendars/${editingCalendar.id}` : '/api/calendars';
    const payload = { ...formData, subaccountId: selectedSede };
    const res = await fetch(url, {
      method: editingCalendar ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/calendars/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  if (!selectedSede) {
    return <div className="p-8 text-center text-gray-500 font-bold">Por favor, selecciona una sede en el menú lateral.</div>;
  }

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Horarios de la Sede
          </h2>
        </div>
        <button 
          onClick={() => { setEditingCalendar(null); setFormData({ name: '', doctorId: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Calendario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                  <td className="py-4 pr-4 text-right">
                    <button onClick={() => { setEditingCalendar(cal); setFormData({ name: cal.name, doctorId: cal.doctorId }); setIsModalOpen(true); }} className="text-blue-600 mr-2 font-bold bg-blue-50 px-3 py-1 rounded">Editar</button>
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
                <button type="submit" className="px-4 py-2 bg-blue-600 font-bold text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
