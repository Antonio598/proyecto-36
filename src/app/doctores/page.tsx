'use client';

import { useState, useEffect } from 'react';
import { Plus, Stethoscope, Edit2, Trash2, X } from 'lucide-react';
import { useSede } from '@/context/SedeContext';

interface Subaccount { id: string; name: string; }
interface Doctor {
  id: string;
  name: string;
  subaccountId: string;
  subaccount?: Subaccount;
  _count?: { calendars: number; services: number; };
}

export default function DoctoresPage() {
  const { selectedSede } = useSede();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const fetchData = async () => {
    if (!selectedSede) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/doctors?subaccountId=${selectedSede}`);
      if (res.ok) setDoctors(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedSede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSede) return alert("Selecciona una sede en el menú");

    const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';
    const payload = { ...formData, subaccountId: selectedSede };
    const res = await fetch(url, {
      method: editingDoctor ? 'PUT' : 'POST',
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

  const deleteDoctor = async (id: string) => {
    if (!confirm('¿Seguro?')) return;
    const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
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
            <Stethoscope className="w-6 h-6 text-blue-600" /> Médicos de la Sede
          </h2>
        </div>
        <button 
          onClick={() => { setEditingDoctor(null); setFormData({ name: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Médico
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 text-left font-bold text-sm text-black">Nombre</th>
              <th className="px-3 py-3.5 text-center font-bold text-sm text-black">Calendarios</th>
              <th className="py-3.5 pr-4 text-right font-bold text-sm text-black">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? <tr><td colSpan={3} className="py-8 text-center text-sm font-bold text-black">Cargando...</td></tr> : 
              doctors.map(doc => (
                <tr key={doc.id}>
                  <td className="py-4 pl-4 text-sm font-bold text-gray-900">{doc.name}</td>
                  <td className="px-3 py-4 text-sm text-center text-gray-900 font-medium">{doc._count?.calendars || 0}</td>
                  <td className="py-4 pr-4 text-right">
                    <button onClick={() => { setEditingDoctor(doc); setFormData({ name: doc.name }); setIsModalOpen(true); }} className="text-blue-600 mr-2 font-bold bg-blue-50 px-3 py-1 rounded">Editar</button>
                    <button onClick={() => deleteDoctor(doc.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded">Borrar</button>
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
            <div className="flex justify-between mb-4"><h3 className="font-bold text-xl text-black">Médico</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1 text-gray-900">Nombre *</label><input required className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
