import { useState, useEffect } from 'react';
import { Plus, Package, Stethoscope, Tag, X, Edit2, Trash2, AlertCircle } from 'lucide-react';

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
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forms state
  const [serviceForm, setServiceForm] = useState({ name: '', durationMinutes: 30, price: 0, colorCode: '#3b82f6', isActive: true });
  const [productForm, setProductForm] = useState({ name: '', price: 0, stock: 0, isActive: true });

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

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      colorCode: service.colorCode,
      isActive: service.isActive
    });
    setIsServiceModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock || 0,
      isActive: product.isActive
    });
    setIsProductModalOpen(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
    const method = editingService ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar servicio');

      await fetchData();
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({ name: '', durationMinutes: 30, price: 0, colorCode: '#3b82f6', isActive: true });
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

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar producto');

      await fetchData();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, stock: 0, isActive: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el servicio');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el producto');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-10 h-full pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Catálogo y Mantenimiento</h2>
          <p className="mt-1 text-sm text-black font-medium">
            Administra los servicios que ofreces y el inventario de productos.
          </p>
        </div>
      </div>

      {/* Servicios Section */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Servicios Médicos
            </h3>
            <button 
              onClick={() => { setEditingService(null); setServiceForm({ name: '', durationMinutes: 30, price: 0, colorCode: '#3b82f6', isActive: true }); setIsServiceModalOpen(true); }}
              className="flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-md cursor-pointer"
            >
               <Plus className="w-4 h-4" /> Nuevo Servicio
            </button>
         </div>
         {isLoading ? (
           <p className="text-sm text-black">Cargando servicios...</p>
         ) : services.length > 0 ? (
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: service.colorCode }} />
                  <div className="pl-4">
                    <div className="flex justify-between items-start">
                       <p className="font-bold text-black">{service.name}</p>
                       <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset ${service.isActive ? 'bg-green-50 text-green-800 ring-green-600/20' : 'bg-red-50 text-red-800 ring-red-600/20'}`}>
                          {service.isActive ? 'Activo' : 'Inactivo'}
                       </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-black font-medium">
                      <div className="flex items-center gap-4">
                         <span className="font-bold text-blue-700 text-lg">${service.price.toFixed(2)}</span>
                         <span>{service.durationMinutes} mins</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditService(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteService(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
         ) : (
           <p className="text-sm text-black bg-white p-4 rounded-lg border border-gray-100 text-center font-bold">No hay servicios registrados.</p>
         )}
      </div>

      <hr className="border-gray-200" />

      {/* Productos Section */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Inventario de Productos
            </h3>
            <button 
              onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, stock: 0, isActive: true }); setIsProductModalOpen(true); }}
              className="flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors bg-amber-50 px-3 py-1.5 rounded-md cursor-pointer"
            >
               <Plus className="w-4 h-4" /> Nuevo Producto
            </button>
         </div>
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-black sm:pl-6">
                    Nombre del Producto
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-black">
                    Precio Base
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-black">
                    Stock Disponible
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-black font-bold text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-black font-bold">Cargando productos...</td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-black sm:pl-6 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-600" />
                        {product.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-black font-bold">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-black font-bold flex items-center gap-2">
                        {product.stock !== null ? (
                          <>
                            <div className={`w-2 h-2 rounded-full ${(product.stock || 0) > 20 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {product.stock} unidades
                          </>
                        ) : 'Sin stock definido'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-bold sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditProduct(product)} className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-md cursor-pointer">
                            Editar
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-md cursor-pointer">
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-black font-bold">No hay productos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

      {/* Modal Servicio */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-gray-100 transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold leading-6 text-black">
                {editingService ? `Editar: ${editingService.name}` : 'Agregar Nuevo Servicio'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Nombre del Servicio *</label>
                <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black font-medium" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Duración (minutos) *</label>
                  <input type="number" required min="5" step="5" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black font-medium" value={serviceForm.durationMinutes} onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Precio Base *</label>
                  <input type="number" required min="0" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black font-medium" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-black mb-1">Color Identificador</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="block w-20 h-10 rounded-md border border-gray-300 shadow-sm cursor-pointer p-1" value={serviceForm.colorCode} onChange={(e) => setServiceForm({ ...serviceForm, colorCode: e.target.value })} />
                    <span className="text-xs text-gray-500 font-mono">{serviceForm.colorCode}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-end">
                  <label className="block text-sm font-bold text-black mb-1">Estado</label>
                  <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input type="checkbox" className="sr-only peer" checked={serviceForm.isActive} onChange={(e) => setServiceForm({...serviceForm, isActive: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-50 cursor-pointer transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer shadow-lg shadow-blue-500/20 transition-all">{isSubmitting ? 'Guardando...' : 'Guardar Servicio'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-gray-100 transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold leading-6 text-black">
                {editingProduct ? `Editar: ${editingProduct.name}` : 'Agregar Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-bold border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Nombre del Producto *</label>
                <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-black font-medium" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Precio *</label>
                  <input type="number" required min="0" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-black font-medium" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Stock Inicial *</label>
                  <input type="number" required min="0" step="1" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-black font-medium" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Estado</label>
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input type="checkbox" className="sr-only peer" checked={productForm.isActive} onChange={(e) => setProductForm({...productForm, isActive: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-50 cursor-pointer transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-amber-600 px-6 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20 transition-all">{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
