'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Save, FileText, Pill, Upload,
  Plus, Trash2, Eye, Download, Loader2, Check, AlertCircle,
  Stethoscope, Video
} from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface Consultation {
  id: string; patientId: string; subaccountId: string; visitDate: string;
  chiefComplaint?: string; diagnosis?: string; observations?: string; treatmentPlan?: string;
  isVirtual: boolean;
  doctor?: { id: string; name: string };
  patient: { id: string; fullName: string; phone: string; cedula_pasaporte?: string; edad?: number };
  prescriptions: Prescription[];
  medicalFiles: MedicalFile[];
}
interface Prescription {
  id: string; issuedAt: string; notes?: string;
  medications: { name: string; dose: string; frequency: string; duration: string; notes?: string }[];
  doctor?: { id: string; name: string };
}
interface MedicalFile {
  id: string; fileName: string; fileUrl: string; fileType: string; description?: string; uploadedAt: string;
}
interface Doctor { id: string; name: string; }

export default function ConsultationDetailPage({ params }: { params: Promise<{ id: string; consultationId: string }> }) {
  const { id: patientId, consultationId } = use(params);
  const router = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({ chiefComplaint: '', diagnosis: '', observations: '', treatmentPlan: '', doctorId: '', isVirtual: false });

  // New prescription state
  const [showNewRx, setShowNewRx] = useState(false);
  const [newRx, setNewRx] = useState({ doctorId: '', notes: '', medications: [{ name: '', dose: '', frequency: '', duration: '', notes: '' }] });
  const [rxSaving, setRxSaving] = useState(false);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res, docRes] = await Promise.all([
          apiFetch(`/api/consultations/${consultationId}`),
          apiFetch(`/api/doctors`),
        ]);
        if (!res.ok) throw new Error('Consulta no encontrada');
        const data = await res.json();
        setConsultation(data);
        setForm({
          chiefComplaint: data.chiefComplaint || '',
          diagnosis: data.diagnosis || '',
          observations: data.observations || '',
          treatmentPlan: data.treatmentPlan || '',
          doctorId: data.doctor?.id || '',
          isVirtual: data.isVirtual,
        });
        setDoctors(await docRes.json());
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [consultationId]);

  async function save() {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, doctorId: form.doctorId || undefined }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated = await res.json();
      setConsultation(prev => prev ? { ...prev, ...updated } : prev);
      showToast('Consulta guardada');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !consultation) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patientId);
      fd.append('subaccountId', consultation.subaccountId);
      fd.append('consultationRecordId', consultationId);
      fd.append('fileType', file.type.startsWith('image/') ? 'image' : 'document');
      const session = JSON.parse(localStorage.getItem('galenus_session') || '{}');
      const res = await fetch('/api/medical-files/upload', {
        method: 'POST',
        headers: { 'x-account-id': session.accountId || '' },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al subir');
      const uploaded = await res.json();
      setConsultation(prev => prev ? { ...prev, medicalFiles: [uploaded, ...prev.medicalFiles] } : prev);
      showToast('Archivo subido');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setUploadLoading(false); e.target.value = ''; }
  }

  async function deleteFile(fileId: string) {
    if (!confirm('¿Eliminar archivo?')) return;
    await apiFetch(`/api/medical-files/${fileId}`, { method: 'DELETE' });
    setConsultation(prev => prev ? { ...prev, medicalFiles: prev.medicalFiles.filter(f => f.id !== fileId) } : prev);
    showToast('Archivo eliminado');
  }

  async function createRx() {
    const meds = newRx.medications.filter(m => m.name.trim());
    if (!meds.length) { showToast('Agrega al menos un medicamento'); return; }
    if (!consultation) return;
    setRxSaving(true);
    try {
      const res = await apiFetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, subaccountId: consultation.subaccountId,
          doctorId: newRx.doctorId || form.doctorId || undefined,
          consultationRecordId: consultationId,
          medications: meds, notes: newRx.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al crear receta');
      const created = await res.json();
      setConsultation(prev => prev ? { ...prev, prescriptions: [created, ...prev.prescriptions] } : prev);
      setShowNewRx(false);
      setNewRx({ doctorId: '', notes: '', medications: [{ name: '', dose: '', frequency: '', duration: '', notes: '' }] });
      showToast('Receta creada');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setRxSaving(false); }
  }

  function printConsultation() {
    if (!consultation) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const p = consultation.patient;
    w.document.write(`<!DOCTYPE html><html><head><title>Consulta</title>
    <style>body{font-family:sans-serif;padding:30px;max-width:800px;margin:0 auto}h1{font-size:20px;font-weight:900}h2{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-top:16px;color:#374151}p{font-size:13px;margin:3px 0}hr{margin:10px 0;border-color:#e5e7eb}@media print{body{padding:20px}}</style></head><body>
    <h1>Registro de Consulta</h1>
    <p><strong>Paciente:</strong> ${p.fullName}</p>
    <p><strong>Fecha:</strong> ${format(new Date(consultation.visitDate), "d 'de' MMMM yyyy", { locale: es })}</p>
    ${consultation.doctor ? `<p><strong>Doctor:</strong> ${consultation.doctor.name}</p>` : ''}
    ${consultation.isVirtual ? '<p><em>Consulta virtual</em></p>' : ''}
    <hr/>
    ${form.chiefComplaint ? `<h2>Motivo de consulta</h2><p>${form.chiefComplaint}</p>` : ''}
    ${form.diagnosis ? `<h2>Diagnóstico</h2><p>${form.diagnosis}</p>` : ''}
    ${form.observations ? `<h2>Observaciones</h2><p>${form.observations}</p>` : ''}
    ${form.treatmentPlan ? `<h2>Plan de tratamiento</h2><p>${form.treatmentPlan}</p>` : ''}
    <script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;
  if (error || !consultation) return (
    <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <p className="font-bold text-red-600">{error || 'Consulta no encontrada'}</p>
      <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold">Volver</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 text-green-800 font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            Consulta — {format(new Date(consultation.visitDate), "d 'de' MMMM yyyy", { locale: es })}
            {consultation.isVirtual && <span className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><Video className="w-3 h-3" />Virtual</span>}
          </h2>
          <div className="flex items-center text-xs font-bold text-black/50 gap-1.5">
            <Link href="/patients" className="hover:text-blue-600">Pacientes</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/patients/${patientId}`} className="hover:text-blue-600">{consultation.patient.fullName}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/patients/${patientId}/expediente?tab=consultas`} className="hover:text-blue-600">Expediente</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Consulta</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={printConsultation} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            <FileText className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Doctor</label>
                <select value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))}
                  className="w-full mt-1 text-sm font-bold border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-300 outline-none">
                  <option value="">Sin asignar</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input type="checkbox" id="isVirtual" checked={form.isVirtual} onChange={e => setForm(p => ({ ...p, isVirtual: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="isVirtual" className="text-sm font-bold text-gray-700">Consulta virtual</label>
              </div>
            </div>

            {[
              { key: 'chiefComplaint', label: 'Motivo de consulta', ph: '¿Por qué viene el paciente?' },
              { key: 'diagnosis', label: 'Diagnóstico', ph: 'Diagnóstico clínico...' },
              { key: 'observations', label: 'Observaciones', ph: 'Hallazgos relevantes, signos vitales, notas...' },
              { key: 'treatmentPlan', label: 'Plan de tratamiento', ph: 'Indicaciones, seguimiento, referencias...' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide">{field.label}</label>
                <textarea
                  value={(form as any)[field.key]}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.ph}
                  rows={3}
                  className="w-full mt-1 text-sm font-bold border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-300 outline-none resize-none"
                />
              </div>
            ))}
          </div>

          {/* Files */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-black flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" />Archivos de esta consulta</h3>
              <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 cursor-pointer ${uploadLoading ? 'opacity-60' : ''}`}>
                {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Subir
                <input type="file" className="hidden" onChange={uploadFile} disabled={uploadLoading} accept="image/*,.pdf,.doc,.docx" />
              </label>
            </div>
            {consultation.medicalFiles.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center py-4">Sin archivos adjuntos</p>
            ) : (
              <div className="space-y-2">
                {consultation.medicalFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm font-bold text-black truncate">{f.fileName}</span>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></a>
                    <a href={f.fileUrl} download={f.fileName} className="text-gray-500 hover:text-gray-700"><Download className="w-4 h-4" /></a>
                    <button onClick={() => deleteFile(f.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: prescriptions */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-black flex items-center gap-2"><Pill className="w-4 h-4 text-blue-600" />Recetas</h3>
              <button onClick={() => setShowNewRx(!showNewRx)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>

            {showNewRx && (
              <div className="mb-4 space-y-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Médico</label>
                  <select value={newRx.doctorId} onChange={e => setNewRx(p => ({ ...p, doctorId: e.target.value }))}
                    className="w-full mt-1 text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                    <option value="">Sin asignar</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1">Medicamentos</label>
                  {newRx.medications.map((med, i) => (
                    <div key={i} className="grid grid-cols-2 gap-1 mb-2 bg-white border border-gray-100 rounded-lg p-2">
                      <input placeholder="Medicamento*" value={med.name} onChange={e => { const m = [...newRx.medications]; m[i].name = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                        className="col-span-2 text-xs font-bold outline-none border-b border-gray-100 pb-1" />
                      <input placeholder="Dosis" value={med.dose} onChange={e => { const m = [...newRx.medications]; m[i].dose = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                        className="text-xs font-bold outline-none" />
                      <input placeholder="Frecuencia" value={med.frequency} onChange={e => { const m = [...newRx.medications]; m[i].frequency = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                        className="text-xs font-bold outline-none" />
                    </div>
                  ))}
                  <button onClick={() => setNewRx(p => ({ ...p, medications: [...p.medications, { name: '', dose: '', frequency: '', duration: '', notes: '' }] }))}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={createRx} disabled={rxSaving} className="flex-1 text-xs font-bold bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1">
                    {rxSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
                  </button>
                  <button onClick={() => setShowNewRx(false)} className="text-xs font-bold border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">✕</button>
                </div>
              </div>
            )}

            {consultation.prescriptions.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold text-center py-3">Sin recetas en esta consulta</p>
            ) : (
              <div className="space-y-2">
                {consultation.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-black text-black">{format(new Date(rx.issuedAt), "d MMM yyyy", { locale: es })}</p>
                    {(rx.medications as any[]).slice(0, 3).map((m: any, i: number) => (
                      <p key={i} className="text-xs font-bold text-gray-500">· {m.name}{m.dose ? ` ${m.dose}` : ''}</p>
                    ))}
                    {rx.medications.length > 3 && <p className="text-xs text-gray-400">+{rx.medications.length - 3} más</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
