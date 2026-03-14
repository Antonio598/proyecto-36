'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, Stethoscope, Tag, X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  colorCode: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number | null;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forms state
  const [serviceForm, setServiceForm] = useState({ name: '', durationMinutes: 30, price: 0, colorCode: '#3b82f6' });
  const [productForm, setProductForm] = useState({ name: '', price: 0, stock: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, productsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/products')
      ]);
      
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      console.error('Error fetching catalog data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Error al crear servicio');

      await fetchData();
      setIsServiceModalOpen(false);
      setServiceForm({ name: '', durationMinutes: 30, price: 0, colorCode: '#3b82f6' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Error al crear producto');

      await fetchData();
      setIsProductModalOpen(false);
      setProductForm({ name: '', price: 0, stock: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Catálogo y Mantenimiento</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra los servicios que ofreces y el inventario de productos.
          </p>
        </div>
      </div>

      {/* Servicios Section */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Servicios Médicos
            </h3>
            <button 
              onClick={() => setIsServiceModalOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors bg-blue-50 px-3 py-1.5 rounded-md"
            >
               <Plus className="w-4 h-4" /> Nuevo Servicio
            </button>
         </div>
         {isLoading ? (
           <p className="text-sm text-gray-500">Cargando servicios...</p>
         ) : services.length > 0 ? (
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: service.colorCode }} />
                  <div className="pl-4">
                    <div className="flex justify-between items-start">
                       <p className="font-semibold text-gray-900">{service.name}</p>
                       <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${service.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                          {service.isActive ? 'Activo' : 'Inactivo'}
                       </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                         <span className="font-medium text-gray-900">${service.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         {service.durationMinutes} mins
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
         ) : (
           <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-100 text-center">No hay servicios registrados.</p>
         )}
      </div>

      <hr className="border-gray-100" />

      {/* Productos Section */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Inventario de Productos
            </h3>
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors bg-amber-50 px-3 py-1.5 rounded-md"
            >
               <Plus className="w-4 h-4" /> Nuevo Producto
            </button>
         </div>
         <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Nombre del Producto
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Precio Base
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Stock Disponible
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">Cargando productos...</td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {product.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 flex items-center gap-2">
                        {product.stock !== null ? (
                          <>
                            <div className={`w-2 h-2 rounded-full ${(product.stock || 0) > 20 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            {product.stock} unidades
                          </>
                        ) : 'Sin stock definido'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button className="text-blue-600 hover:text-blue-900 font-semibold" disabled>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">No hay productos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

      {/* Modal Nuevo Servicio */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 sm:p-0">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Agregar Nuevo Servicio</h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Servicio *</label>
                <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duración (minutos) *</label>
                  <input type="number" required min="5" step="5" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm" value={serviceForm.durationMinutes} onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Base *</label>
                  <input type="number" required min="0" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Identificador</label>
                <input type="color" className="mt-1 block w-20 h-10 rounded-md border border-gray-300 shadow-sm cursor-pointer p-1" value={serviceForm.colorCode} onChange={(e) => setServiceForm({ ...serviceForm, colorCode: e.target.value })} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400">{isSubmitting ? 'Guardando...' : 'Guardar Servicio'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 sm:p-0">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Agregar Nuevo Producto</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
                <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:text-sm" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio *</label>
                  <input type="number" required min="0" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:text-sm" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Inicial *</label>
                  <input type="number" required min="0" step="1" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:text-sm" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400">{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
