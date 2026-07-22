'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Stethoscope, Save, Globe, Instagram, Linkedin,
  Phone, Mail, MapPin, Shield, Eye, EyeOff, ChevronRight, Plus, X
} from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  location: string | null;
  socialLinks: Record<string, string> | null;
  insurances: string[] | null;
  isPublic: boolean;
}

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@usuario' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/usuario', icon: Linkedin },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+507 6000-0000', icon: Phone },
  { key: 'website', label: 'Sitio web', placeholder: 'https://miclínica.com', icon: Globe },
];

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    phone: '',
    email: '',
    photoUrl: '',
    location: '',
    isPublic: false,
    socialLinks: {} as Record<string, string>,
    insurances: [] as string[],
  });
  const [newInsurance, setNewInsurance] = useState('');

  const loadDoctor = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/doctors');
      if (!res.ok) throw new Error('Error al cargar médico');
      const list: any[] = await res.json();
      const d = list.find((x: any) => x.id === id);
      if (!d) throw new Error('Médico no encontrado');
      setDoctor(d);
      setForm({
        name: d.name || '',
        specialty: d.specialty || '',
        bio: d.bio || '',
        phone: d.phone || '',
        email: d.email || '',
        photoUrl: d.photoUrl || '',
        location: d.location || '',
        isPublic: d.isPublic || false,
        socialLinks: (d.socialLinks as Record<string, string>) || {},
        insurances: (d.insurances as string[]) || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDoctor(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await apiFetch(`/api/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          specialty: form.specialty,
          bio: form.bio,
          phone: form.phone,
          email: form.email,
          photoUrl: form.photoUrl,
          location: form.location,
          isPublic: form.isPublic,
          socialLinks: form.socialLinks,
          insurances: form.insurances,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Error al guardar el perfil');
      }
      const updated = await res.json();
      // Sync form with what the server actually saved
      setDoctor(updated);
      setForm({
        name: updated.name || '',
        specialty: updated.specialty || '',
        bio: updated.bio || '',
        phone: updated.phone || '',
        email: updated.email || '',
        photoUrl: updated.photoUrl || '',
        location: updated.location || '',
        isPublic: updated.isPublic || false,
        socialLinks: (updated.socialLinks as Record<string, string>) || {},
        insurances: (updated.insurances as string[]) || [],
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addInsurance = () => {
    if (!newInsurance.trim()) return;
    setForm(prev => ({ ...prev, insurances: [...prev.insurances, newInsurance.trim()] }));
    setNewInsurance('');
  };

  const removeInsurance = (idx: number) => {
    setForm(prev => ({ ...prev, insurances: prev.insurances.filter((_, i) => i !== idx) }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
        <p className="text-red-700 font-bold">{error}</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-black">Perfil del Médico</h2>
          <div className="flex items-center text-sm font-bold text-black/50 gap-2">
            <Link href="/doctores" className="hover:text-blue-600 transition-colors">Médicos</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{form.name}</span>
            <ChevronRight className="w-4 h-4" />
            <span>Perfil</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${form.isPublic ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
          >
            {form.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.isPublic ? 'Visible en directorio' : 'Oculto'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${saveSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : saveSuccess ? 'Guardado' : 'Guardar Perfil'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — identity */}
        <div className="lg:col-span-1 space-y-5">
          {/* Photo */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shadow-lg">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">URL de Foto</label>
              <input
                type="url"
                value={form.photoUrl}
                onChange={e => setForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Pega una URL de imagen pública</p>
            </div>
          </div>

          {/* Visibility info */}
          <div className={`rounded-2xl p-4 border text-sm font-bold ${form.isPublic ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <div className="flex items-center gap-2 mb-1">
              {form.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {form.isPublic ? 'Visible en el directorio público' : 'No aparece en el directorio'}
            </div>
            <p className="text-xs font-medium opacity-70">
              {form.isPublic
                ? 'Los pacientes pueden encontrar este médico en /directorio.'
                : 'Activa "Visible en directorio" para que aparezca públicamente.'}
            </p>
          </div>
        </div>

        {/* Right — profile fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Información básica</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Especialidad</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={e => setForm(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Ej. Cirugía Vascular"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Biografía / Descripción</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Describe la experiencia y especialización del médico..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Contacto y ubicación</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+507 6000-0000"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="doctor@clinica.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ubicación / Consultorio
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ej. Torre Medical Center, Piso 8, Ofic. 802"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Social links */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Redes sociales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SOCIAL_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <field.icon className="w-3 h-3" /> {field.label}
                  </label>
                  <input
                    type="text"
                    value={form.socialLinks[field.key] || ''}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [field.key]: e.target.value }
                    }))}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Insurances */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> Aseguradoras aceptadas
            </h3>

            <div className="flex flex-wrap gap-2">
              {form.insurances.map((ins, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-bold">
                  {ins}
                  <button type="button" onClick={() => removeInsurance(idx)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {form.insurances.length === 0 && (
                <p className="text-xs text-gray-400 font-medium">Sin aseguradoras registradas.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInsurance}
                onChange={e => setNewInsurance(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInsurance())}
                placeholder="Ej. ASSA, MAPFRE, Blue Cross..."
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addInsurance}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
