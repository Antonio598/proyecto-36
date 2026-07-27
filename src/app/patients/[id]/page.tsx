'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Phone, Mail, Calendar as CalendarIcon,
  Stethoscope, Clock, FileText, ChevronRight, AlertCircle,
  ClipboardList, Edit2, Check, X, Loader2, CreditCard, Hash,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { apiFetch } from '@/lib/apiFetch';

interface Patient {
  id: string; fullName: string; phone: string;
  email: string | null; cedula_pasaporte: string | null;
  edad: number | null; notes: string | null; createdAt: string;
}

interface Appointment {
  id: string; startTime: string; endTime: string; status: string; notes: string | null;
  service: { name: string; durationMinutes: number; price: number; colorCode: string };
}

export default function PatientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [patient, setPatient]         = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');

  // Edit state
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');
  const [toast, setToast]       = useState('');
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', cedula_pasaporte: '', edad: '', notes: '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [patRes, histRes] = await Promise.all([
          apiFetch(`/api/patients/${id}`),
          apiFetch(`/api/appointments/history/${id}`),
        ]);
        if (!patRes.ok) throw new Error('No se pudo encontrar al paciente');
        const pat: Patient = await patRes.json();
        setPatient(pat);
        setForm({
          fullName:         pat.fullName,
          phone:            pat.phone,
          email:            pat.email            ?? '',
          cedula_pasaporte: pat.cedula_pasaporte ?? '',
          edad:             pat.edad != null ? String(pat.edad) : '',
          notes:            pat.notes            ?? '',
        });

        const histData = await histRes.json();
        const { formatInTimeZone } = require('date-fns-tz');
        const TZ = 'America/Panama';
        setAppointments(histData.map((a: any) => ({
          ...a,
          startTime: formatInTimeZone(new Date(a.startTime), TZ, "yyyy-MM-dd'T'HH:mm:ss"),
          endTime:   formatInTimeZone(new Date(a.endTime),   TZ, "yyyy-MM-dd'T'HH:mm:ss"),
        })));
      } catch (e: any) { setError(e.message); }
      finally { setIsLoading(false); }
    };
    load();
  }, [id]);

  const startEdit = () => {
    if (!patient) return;
    setForm({
      fullName:         patient.fullName,
      phone:            patient.phone,
      email:            patient.email            ?? '',
      cedula_pasaporte: patient.cedula_pasaporte ?? '',
      edad:             patient.edad != null ? String(patient.edad) : '',
      notes:            patient.notes            ?? '',
    });
    setSaveErr('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveErr(''); };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      setSaveErr('Nombre y teléfono son obligatorios');
      return;
    }
    setSaving(true);
    setSaveErr('');
    try {
      const res = await apiFetch(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName:         form.fullName.trim(),
          phone:            form.phone.trim(),
          email:            form.email.trim()            || null,
          cedula_pasaporte: form.cedula_pasaporte.trim() || null,
          edad:             form.edad ? parseInt(form.edad) : null,
          notes:            form.notes.trim()            || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error al guardar');
      }
      const updated: Patient = await res.json();
      setPatient(updated);
      setEditing(false);
      showToast('Datos actualizados correctamente');
    } catch (e: any) { setSaveErr(e.message); }
    finally { setSaving(false); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

  if (error || !patient) return (
    <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-800">Error</h2>
      <p className="text-red-600 mb-6">{error || 'Paciente no encontrado'}</p>
      <button onClick={() => router.back()} className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
        Volver atrás
      </button>
    </div>
  );

  /* ── helpers ── */
  const Field = ({ label, icon, value }: { label: string; icon: React.ReactNode; value: React.ReactNode }) => (
    <div className="flex items-center gap-4">
      <div className="bg-gray-50 p-2.5 rounded-xl flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-black break-words">{value}</p>
      </div>
    </div>
  );

  const Input = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 text-green-800 font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-black">Ficha del Paciente</h2>
          <div className="flex items-center text-sm font-bold text-black/50 gap-2">
            <Link href="/patients" className="hover:text-blue-600 transition-colors">Pacientes</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{patient.fullName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Patient Card ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              {editing ? (
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="text-lg font-black text-black text-center border-b-2 border-blue-400 outline-none w-full pb-1 bg-transparent"
                  placeholder="Nombre completo"
                />
              ) : (
                <h3 className="text-xl font-black text-black mb-1">{patient.fullName}</h3>
              )}
              <p className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2">
                ID: {patient.id.substring(0, 8)}
              </p>
            </div>

            {/* Edit / Save / Cancel buttons */}
            <div className="flex gap-2 mb-6">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-60 text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar
                  </button>
                  <button onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </>
              ) : (
                <button onClick={startEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 font-black rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-colors text-sm">
                  <Edit2 className="w-4 h-4" /> Editar datos
                </button>
              )}
            </div>

            {saveErr && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {saveErr}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-5 border-t border-gray-100 pt-5">
              {editing ? (
                <div className="space-y-4">
                  <Input label="Teléfono / WhatsApp *"
                    value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
                  <Input label="Email"
                    value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))}
                    type="email" placeholder="correo@ejemplo.com" />
                  <Input label="Cédula / Pasaporte"
                    value={form.cedula_pasaporte} onChange={v => setForm(f => ({ ...f, cedula_pasaporte: v }))}
                    placeholder="8-123-456" />
                  <Input label="Edad (años)"
                    value={form.edad} onChange={v => setForm(f => ({ ...f, edad: v }))}
                    type="number" placeholder="35" />
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Notas clínicas</label>
                    <textarea
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3} placeholder="Observaciones generales..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Field label="WhatsApp" icon={<Phone className="w-5 h-5 text-gray-500" />}
                    value={<span className="underline decoration-blue-200 decoration-2">{patient.phone}</span>} />
                  <Field label="Email" icon={<Mail className="w-5 h-5 text-gray-500" />}
                    value={patient.email || <span className="text-gray-300">No registrado</span>} />
                  {(patient.cedula_pasaporte) && (
                    <Field label="Cédula / Pasaporte" icon={<CreditCard className="w-5 h-5 text-gray-500" />}
                      value={patient.cedula_pasaporte} />
                  )}
                  {patient.edad != null && (
                    <Field label="Edad" icon={<Hash className="w-5 h-5 text-gray-500" />}
                      value={`${patient.edad} años`} />
                  )}
                  <Field label="Miembro desde" icon={<Clock className="w-5 h-5 text-gray-500" />}
                    value={format(new Date(patient.createdAt), "d 'de' MMMM, yyyy", { locale: es })} />
                  {patient.notes && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Notas clínicas</h4>
                      </div>
                      <p className="text-sm font-bold text-amber-900 leading-relaxed">{patient.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <Link href={`/patients/${id}/expediente`}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
              <ClipboardList className="w-5 h-5" /> Expediente Clínico
            </Link>
          </div>
        </div>

        {/* ── Appointments Timeline ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm h-full">
            <h3 className="text-lg font-black text-black mb-8 flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" /> Línea de Tiempo de Citas
            </h3>

            {appointments.length > 0 ? (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 md:before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-gray-100 before:to-transparent">
                {appointments.map(appt => (
                  <div key={appt.id} className="relative flex items-start gap-4 md:gap-6 group">
                    <div className="absolute left-0 mt-1.5 w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div className="ml-10 md:ml-14 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-sm font-black text-black block sm:inline">
                            {format(new Date(appt.startTime), "EEEE, d 'de' MMMM", { locale: es })}
                          </span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-0 sm:ml-2">
                            {format(new Date(appt.startTime), 'HH:mm')} hrs
                          </span>
                        </div>
                        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {appt.status === 'CONFIRMED' ? 'Realizada' : 'Cancelada'}
                        </span>
                      </div>
                      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: appt.service.colorCode }} />
                            <span className="font-black text-black">{appt.service.name}</span>
                          </div>
                          <span className="font-black text-gray-900">${appt.service.price.toFixed(2)}</span>
                        </div>
                        {appt.notes
                          ? <p className="text-sm font-bold text-black/60 italic border-l-2 border-gray-200 pl-3">"{appt.notes}"</p>
                          : <p className="text-xs font-bold text-black/40 italic">Sin notas para esta cita.</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <Clock className="w-12 h-12 text-gray-300" />
                </div>
                <p className="text-lg font-bold text-black mb-1">Sin historial disponible</p>
                <p className="text-sm font-bold text-black/50">Este paciente aún no ha tenido citas registradas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
