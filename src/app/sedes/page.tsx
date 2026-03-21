'use client';

import { useState, useEffect } from 'react';
import { Plus, Building, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

interface Subaccount {
  id: string;
  name: string;
  _count?: {
    doctors: number;
    services: number;
  };
}

export default function SedesPage() {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Subaccount | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subaccounts');
      if (res.ok) setSubaccounts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const url = editingSede ? `/api/subaccounts/${editingSede.id}` : '/api/subaccounts';
    const method = editingSede ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');

      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSede = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta sede? Se borrarán sus datos asociados.')) return;
    try {
      const res = await fetch(`/api/subaccounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Gestión de Sedes (Subcuentas)
          </h2>
          <p className="mt-1 text-sm text-gray-600 font-medium">
            Administra las diferentes ubicaciones u hospitales.
          </p>
        </div>
        <button 
          onClick={() => { setEditingSede(null); setFormData({ name: '' }); setIsModalOpen(true); }}
          className="mt-4 sm:mt-0 flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Sede
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-black sm:pl-6">Nombre de la Sede</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-black">Médicos Asociados</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-black">Servicios</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-bold text-sm text-black">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center text-sm font-bold">Cargando...</td></tr>
            ) : subaccounts.length > 0 ? (
              subaccounts.map((sede) => (
                <tr key={sede.id} className="hover:bg-gray-50/50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-black sm:pl-6 flex items-center gap-2">
                    {sede.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-600 font-medium">
                    {sede._count?.doctors || 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-600 font-medium">
                    {sede._count?.services || 0}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-bold sm:pr-6">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingSede(sede); setFormData({ name: sede.name }); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md cursor-pointer">Editar</button>
                      <button onClick={() => deleteSede(sede.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md cursor-pointer">Borrar</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="py-8 text-center text-sm font-bold">No hay sedes registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">{editingSede ? 'Editar Sede' : 'Nueva Sede'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-900">Nombre *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white" value={formData.name} onChange={e => setFormData({name: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md disabled:bg-blue-300">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
