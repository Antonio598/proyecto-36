'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Lock, Save, LogOut, ShieldCheck, Building2, Eye, EyeOff } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword.length < 6) {
      setPasswordErr('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setPasswordErr(error.message);
    } else {
      setPasswordMsg('¡Contraseña actualizada correctamente!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Configuración</h2>
        <p className="mt-1 text-sm text-gray-500">Administra tu cuenta y preferencias del sistema.</p>
      </div>

      {/* ── Account Info ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Información de la Cuenta</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-800 font-medium">{user?.email || '—'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">ID de Usuario</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-mono">{user?.id || '—'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Último inicio de sesión</label>
            <p className="text-sm text-gray-700">
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
                : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Clinic Info ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Datos de la Clínica</h3>
        </div>
        <div className="px-6 py-5">
          <div>
            <label htmlFor="clinicName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Nombre de la Clínica
            </label>
            <input
              id="clinicName"
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            />
          </div>
        </div>
      </section>

      {/* ── Change Password ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Cambiar Contraseña</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
          {passwordErr && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              ⚠️ {passwordErr}
            </div>
          )}
          {passwordMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              ✅ {passwordMsg}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmNewPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Contraseña
          </button>
        </form>
      </section>

      {/* ── Logout ── */}
      <section className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Cerrar Sesión</h3>
            <p className="text-sm text-gray-500 mt-0.5">Sal de tu cuenta en este dispositivo.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </section>
    </div>
  );
}
