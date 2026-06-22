'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, LogOut, ShieldCheck, Building2, Eye, EyeOff, Stethoscope, Globe, Instagram, Linkedin, Phone, MapPin, Shield, Plus, X, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface Doctor {
  id: string; name: string; specialty?: string; bio?: string; phone?: string;
  email?: string; photoUrl?: string; location?: string;
  socialLinks?: Record<string, string>; insurances?: string[]; isPublic?: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Clinic info
  const [clinicName, setClinicName] = useState('Mi Clínica');

  // Doctor profile
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [docProfile, setDocProfile] = useState<Partial<Doctor>>({});
  const [insuranceInput, setInsuranceInput] = useState('');
  const [docSaving, setDocSaving] = useState(false);
  const [docMsg, setDocMsg] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('med_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    loadDoctors();
    setLoading(false);
  }, []);

  async function loadDoctors() {
    try {
      const res = await apiFetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
        if (data.length === 1) {
          setSelectedDoctorId(data[0].id);
          setDocProfile(data[0]);
        }
      }
    } catch {}
  }

  function onSelectDoctor(id: string) {
    setSelectedDoctorId(id);
    const doc = doctors.find(d => d.id === id);
    if (doc) setDocProfile({ ...doc });
    setDocMsg('');
  }

  async function saveDocProfile() {
    if (!selectedDoctorId) return;
    setDocSaving(true);
    setDocMsg('');
    try {
      const res = await apiFetch(`/api/doctors/${selectedDoctorId}`, {
        method: 'PUT',
        body: JSON.stringify(docProfile),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setDocMsg('Perfil guardado correctamente');
      await loadDoctors();
      setTimeout(() => setDocMsg(''), 4000);
    } catch (e: any) {
      setDocMsg('Error: ' + e.message);
    } finally {
      setDocSaving(false);
    }
  }

  function addInsurance() {
    const val = insuranceInput.trim();
    if (!val) return;
    const current = docProfile.insurances || [];
    if (!current.includes(val)) {
      setDocProfile(p => ({ ...p, insurances: [...(p.insurances || []), val] }));
    }
    setInsuranceInput('');
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');
    if (newPassword.length < 6) { setPasswordErr('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordErr('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    try {
      const u = JSON.parse(localStorage.getItem('med_user') || '{}');
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordErr(data.error || 'Error al cambiar contraseña.'); }
      else { setPasswordMsg('¡Contraseña actualizada correctamente!'); setNewPassword(''); setConfirmPassword(''); }
    } catch { setPasswordErr('Error de conexión.'); }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('med_session');
    localStorage.removeItem('med_user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const social = docProfile.socialLinks || {};

  return (
    <div className="flex flex-col gap-8 max-w-2xl pb-12">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Configuración</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">Administra tu cuenta, perfil médico y preferencias.</p>
      </div>

      {/* Account Info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-gray-900">Información de la Cuenta</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-800 font-bold">{user?.email || '—'}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">ID de Usuario</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-mono">{user?.id || '—'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-gray-900">Datos de la Clínica</h3>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Nombre de la Clínica</label>
          <input
            type="text"
            value={clinicName}
            onChange={e => setClinicName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
          />
        </div>
      </section>

      {/* Doctor Public Profile */}
      <section className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-100 flex items-center gap-2 bg-blue-50/50">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-gray-900">Perfil en el Directorio</h3>
          <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">Público</span>
        </div>
        <div className="px-6 py-5 space-y-5">

          {/* Doctor selector */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Médico a editar</label>
            <select
              value={selectedDoctorId}
              onChange={e => onSelectDoctor(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Selecciona un médico...</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {selectedDoctorId && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Especialidad</label>
                  <input type="text" value={docProfile.specialty || ''} onChange={e => setDocProfile(p => ({ ...p, specialty: e.target.value }))}
                    placeholder="Ej. Cirugía Vascular"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Ubicación / Consultorio</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={docProfile.location || ''} onChange={e => setDocProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="Ej. Torre Medical, Piso 8"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={docProfile.phone || ''} onChange={e => setDocProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+507 6000-0000"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Email de contacto</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={docProfile.email || ''} onChange={e => setDocProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="doctor@clinica.com"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Foto (URL)</label>
                <input type="url" value={docProfile.photoUrl || ''} onChange={e => setDocProfile(p => ({ ...p, photoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                {docProfile.photoUrl && (
                  <img src={docProfile.photoUrl} alt="preview" className="mt-2 w-14 h-14 rounded-xl object-cover border border-gray-200" />
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Bio</label>
                <textarea value={docProfile.bio || ''} onChange={e => setDocProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={3} placeholder="Descripción breve del médico y su experiencia..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
              </div>

              {/* Social links */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Redes Sociales</label>
                <div className="space-y-2">
                  {[
                    { key: 'whatsapp', label: 'WhatsApp', icon: Phone, placeholder: '+507 6000-0000' },
                    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@usuario' },
                    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
                    { key: 'website', label: 'Sitio web', icon: Globe, placeholder: 'https://...' },
                  ].map(({ key, label, icon: Icon, placeholder }) => (
                    <div key={key} className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={social[key] || ''}
                        onChange={e => setDocProfile(p => ({ ...p, socialLinks: { ...(p.socialLinks || {}), [key]: e.target.value } }))}
                        placeholder={`${label}: ${placeholder}`}
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Insurances */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  <Shield className="w-3.5 h-3.5 inline mr-1" /> Aseguradoras aceptadas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(docProfile.insurances || []).map((ins, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                      {ins}
                      <button onClick={() => setDocProfile(p => ({ ...p, insurances: (p.insurances || []).filter((_, idx) => idx !== i) }))}>
                        <X className="w-3 h-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={insuranceInput}
                    onChange={e => setInsuranceInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInsurance())}
                    placeholder="Ej. ASSA, MAPFRE, Blue Cross..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button onClick={addInsurance} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* isPublic toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div>
                  <p className="text-sm font-black text-gray-900">Visible en el directorio público</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Los pacientes podrán encontrar tu perfil en /directorio</p>
                </div>
                <button
                  onClick={() => setDocProfile(p => ({ ...p, isPublic: !p.isPublic }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${docProfile.isPublic ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${docProfile.isPublic ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {docMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${docMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  <CheckCircle2 className="w-4 h-4" /> {docMsg}
                </div>
              )}

              <button
                onClick={saveDocProfile}
                disabled={docSaving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl transition-all shadow-sm disabled:opacity-60"
              >
                {docSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Perfil
              </button>
            </>
          )}
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-gray-900">Cambiar Contraseña</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
          {passwordErr && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">{passwordErr}</div>}
          {passwordMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl">{passwordMsg}</div>}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Confirmar Contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
            />
          </div>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Contraseña
          </button>
        </form>
      </section>

      {/* Logout */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Cerrar Sesión</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Sal de tu cuenta en este dispositivo.</p>
          </div>
          <button onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </section>
    </div>
  );
}
