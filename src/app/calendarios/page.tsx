'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Edit2, Trash2, X } from 'lucide-react';

interface Subaccount { id: string; name: string; }
interface Doctor { id: string; name: string; subaccountId: string; subaccount?: Subaccount; }
interface Calendar {
  id: string;
  name: string;
  subaccountId: string;
  doctorId: string;
  subaccount?: Subaccount;
  doctor?: Doctor;
  _count?: { appointments: number; configurations: number; };
}

export default function CalendariosPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [formData, setFormData] = useState({ name: '', subaccountId: '', doctorId: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [calRes, subRes, docRes] = await Promise.all([
        fetch('/api/calendars'), fetch('/api/subaccounts'), fetch('/api/doctors')
      ]);
      if (calRes.ok) setCalendars(await calRes.json());
      if (subRes.ok) setSubaccounts(await subRes.json());
      if (docRes.ok) setDoctors(await docRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCalendar ? `/api/calendars/${editingCalendar.id}` : '/api/calendars';
    const res = await fetch(url, {
      method: editingCalendar ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
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

  const filteredDoctors = doctors.filter(d => !formData.subaccountId || d.subaccountId === formData.subaccountId);

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Calendarios y Horarios
          </h2>
        </div>
        <button 
          onClick={() => { setEditingCalendar(null); setFormData({ name: '', subaccountId: subaccounts[0]?.id || '', doctorId: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Calendario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 text-left font-bold text-sm">Nombre</th>
              <th className="px-3 py-3.5 text-left font-bold text-sm">Sede</th>
              <th className="px-3 py-3.5 text-left font-bold text-sm">Médico</th>
              <th className="py-3.5 pr-4 text-right font-bold text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? <tr><td colSpan={4} className="py-8 text-center text-sm font-bold">Cargando...</td></tr> : 
              calendars.map(cal => (
                <tr key={cal.id}>
                  <td className="py-4 pl-4 text-sm font-bold">{cal.name}</td>
                  <td className="px-3 py-4 text-sm">{cal.subaccount?.name || '---'}</td>
                  <td className="px-3 py-4 text-sm font-medium">{cal.doctor?.name || '---'}</td>
                  <td className="py-4 pr-4 text-right">
                    <button onClick={() => { setEditingCalendar(cal); setFormData({ name: cal.name, subaccountId: cal.subaccountId, doctorId: cal.doctorId }); setIsModalOpen(true); }} className="text-blue-600 mr-2 font-bold bg-blue-50 px-3 py-1 rounded">Editar</button>
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
            <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">Calendario</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">Nombre *</label><input required className="w-full border p-2 rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
              <div>
                <label className="block text-sm font-bold mb-1">Sede *</label>
                <select required className="w-full border p-2 rounded" value={formData.subaccountId} onChange={e=>{setFormData({...formData, subaccountId: e.target.value, doctorId: ''})}}>
                  <option value="">Selecciona Sede...</option>
                  {subaccounts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Médico *</label>
                <select required className="w-full border p-2 rounded" value={formData.doctorId} onChange={e=>setFormData({...formData, doctorId: e.target.value})} disabled={!formData.subaccountId}>
                  <option value="">Selecciona Médico...</option>
                  {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
