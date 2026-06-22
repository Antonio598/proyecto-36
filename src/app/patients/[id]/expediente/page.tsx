'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, FileText, Stethoscope, Pill, Upload,
  Plus, Trash2, Download, Eye, AlertCircle, Loader2, X, Check,
  Droplets, Activity, Scissors, Users, Tablets, ClipboardList
} from 'lucide-react';
import { apiFetch, getAccountId } from '@/lib/apiFetch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

type Tab = 'antecedentes' | 'consultas' | 'archivos' | 'recetas';

interface Patient {
  id: string; fullName: string; phone: string; email?: string;
  cedula_pasaporte?: string; edad?: number;
}
interface Background {
  id?: string; bloodType?: string; allergies?: string; chronicConditions?: string;
  surgicalHistory?: string; familyHistory?: string; currentMedications?: string;
}
interface Consultation {
  id: string; visitDate: string; chiefComplaint?: string; diagnosis?: string;
  isVirtual: boolean;
  doctor?: { id: string; name: string };
  appointment?: { id: string; startTime: string; service?: { name: string } };
  prescriptions: { id: string }[];
  medicalFiles: { id: string }[];
}
interface Prescription {
  id: string; issuedAt: string; notes?: string;
  medications: { name: string; dose: string; frequency: string; duration: string; notes?: string }[];
  doctor?: { id: string; name: string };
}
interface MedicalFile {
  id: string; fileName: string; fileUrl: string; fileType: string;
  description?: string; uploadedAt: string;
}
interface Doctor { id: string; name: string; }

export default function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'antecedentes');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [subaccountId, setSubaccountId] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Antecedentes
  const [background, setBackground] = useState<Background>({});
  const [bgEditing, setBgEditing] = useState(false);

  // Consultas
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [newConsult, setNewConsult] = useState({ chiefComplaint: '', diagnosis: '', observations: '', treatmentPlan: '', doctorId: '', isVirtual: false });

  // Archivos
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Recetas
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showNewRx, setShowNewRx] = useState(false);
  const [newRx, setNewRx] = useState({
    doctorId: '', notes: '', consultationRecordId: '',
    medications: [{ name: '', dose: '', frequency: '', duration: '', notes: '' }]
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [patRes, sedeRes] = await Promise.all([
          apiFetch(`/api/patients/${patientId}`),
          apiFetch('/api/subaccounts'),
        ]);
        if (!patRes.ok) throw new Error('Paciente no encontrado');
        const pat = await patRes.json();
        setPatient(pat);

        const sedes = await sedeRes.json();
        const sid = sedes[0]?.id || '';
        setSubaccountId(sid);

        if (sid) {
          const [bgRes, consultRes, filesRes, rxRes, docRes] = await Promise.all([
            apiFetch(`/api/patients/${patientId}/background?subaccountId=${sid}`),
            apiFetch(`/api/consultations?patientId=${patientId}`),
            apiFetch(`/api/medical-files?patientId=${patientId}`),
            apiFetch(`/api/prescriptions?patientId=${patientId}`),
            apiFetch(`/api/doctors?subaccountId=${sid}`),
          ]);
          const bg = await bgRes.json();
          if (bg) setBackground(bg);
          setConsultations(await consultRes.json());
          setFiles(await filesRes.json());
          setPrescriptions(await rxRes.json());
          setDoctors(await docRes.json());
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [patientId]);

  async function saveBackground() {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/patients/${patientId}/background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...background, subaccountId }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const data = await res.json();
      setBackground(data);
      setBgEditing(false);
      showToast('Antecedentes guardados');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function createConsultation() {
    if (!newConsult.chiefComplaint && !newConsult.diagnosis) {
      showToast('Ingresa al menos motivo de consulta o diagnóstico');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newConsult, patientId, subaccountId, doctorId: newConsult.doctorId || undefined }),
      });
      if (!res.ok) throw new Error('Error al crear consulta');
      const created = await res.json();
      setConsultations(prev => [created, ...prev]);
      setShowNewConsultation(false);
      setNewConsult({ chiefComplaint: '', diagnosis: '', observations: '', treatmentPlan: '', doctorId: '', isVirtual: false });
      showToast('Consulta registrada');
      // Navigate to the consultation detail for full editing
      router.push(`/patients/${patientId}/expediente/consulta/${created.id}`);
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patientId);
      fd.append('subaccountId', subaccountId);
      fd.append('fileType', file.type.startsWith('image/') ? 'image' : 'document');

      const res = await fetch('/api/medical-files/upload', {
        method: 'POST',
        headers: { 'x-account-id': getAccountId() || '' },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al subir');
      const uploaded = await res.json();
      setFiles(prev => [uploaded, ...prev]);
      showToast('Archivo subido correctamente');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setUploadLoading(false); e.target.value = ''; }
  }

  async function deleteFile(fileId: string) {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await apiFetch(`/api/medical-files/${fileId}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== fileId));
      showToast('Archivo eliminado');
    } catch { showToast('Error al eliminar'); }
  }

  async function createPrescription() {
    const meds = newRx.medications.filter(m => m.name.trim());
    if (meds.length === 0) { showToast('Agrega al menos un medicamento'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, subaccountId,
          doctorId: newRx.doctorId || undefined,
          consultationRecordId: newRx.consultationRecordId || undefined,
          medications: meds,
          notes: newRx.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al crear receta');
      const created = await res.json();
      setPrescriptions(prev => [created, ...prev]);
      setShowNewRx(false);
      setNewRx({ doctorId: '', notes: '', consultationRecordId: '', medications: [{ name: '', dose: '', frequency: '', duration: '', notes: '' }] });
      showToast('Receta creada');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  function printBackground() {
    const w = window.open('', '_blank');
    if (!w || !patient) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Antecedentes - ${patient.fullName}</title>
    <style>body{font-family:sans-serif;padding:30px;max-width:800px;margin:0 auto}h1{font-size:22px;font-weight:900}h2{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;margin-top:20px;color:#374151}p{font-size:13px;margin:4px 0;color:#111}hr{margin:12px 0;border-color:#e5e7eb}.label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}@media print{body{padding:20px}}</style></head><body>
    <h1>Antecedentes Clínicos</h1>
    <p><strong>Paciente:</strong> ${patient.fullName}</p>
    <p><strong>Teléfono:</strong> ${patient.phone}</p>
    ${patient.cedula_pasaporte ? `<p><strong>Cédula:</strong> ${patient.cedula_pasaporte}</p>` : ''}
    ${patient.edad ? `<p><strong>Edad:</strong> ${patient.edad} años</p>` : ''}
    <hr/>
    ${background.bloodType ? `<p class="label">Tipo de sangre</p><p>${background.bloodType}</p>` : ''}
    ${background.allergies ? `<p class="label">Alergias</p><p>${background.allergies}</p>` : ''}
    ${background.chronicConditions ? `<p class="label">Condiciones crónicas</p><p>${background.chronicConditions}</p>` : ''}
    ${background.surgicalHistory ? `<p class="label">Historial quirúrgico</p><p>${background.surgicalHistory}</p>` : ''}
    ${background.familyHistory ? `<p class="label">Antecedentes familiares</p><p>${background.familyHistory}</p>` : ''}
    ${background.currentMedications ? `<p class="label">Medicamentos actuales</p><p>${background.currentMedications}</p>` : ''}
    <hr/><p style="font-size:10px;color:#9ca3af">Generado el ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}</p>
    <script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  if (error || !patient) return (
    <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 font-bold">{error || 'Error al cargar'}</p>
      <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold">Volver</button>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'antecedentes', label: 'Antecedentes', icon: <Activity className="w-4 h-4" /> },
    { key: 'consultas',    label: 'Consultas',    icon: <Stethoscope className="w-4 h-4" /> },
    { key: 'archivos',     label: 'Archivos',     icon: <Upload className="w-4 h-4" /> },
    { key: 'recetas',      label: 'Recetas',      icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {/* Toast */}
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
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Expediente Clínico
          </h2>
          <div className="flex items-center text-sm font-bold text-black/50 gap-2">
            <Link href="/patients" className="hover:text-blue-600">Pacientes</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/patients/${patientId}`} className="hover:text-blue-600">{patient.fullName}</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Expediente</span>
          </div>
        </div>
      </div>

      {/* Patient summary bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="font-black text-lg">{patient.fullName}</p>
          <p className="text-blue-100 text-sm font-bold">{patient.phone}{patient.edad ? ` · ${patient.edad} años` : ''}{patient.cedula_pasaporte ? ` · ${patient.cedula_pasaporte}` : ''}</p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <span className="bg-white/20 px-3 py-1 rounded-full">{consultations.length} consultas</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{prescriptions.length} recetas</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{files.length} archivos</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-sm font-black transition-colors ${
                activeTab === t.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── ANTECEDENTES ── */}
          {activeTab === 'antecedentes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-black">Antecedentes del Paciente</h3>
                <div className="flex gap-2">
                  <button onClick={printBackground} className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <FileText className="w-4 h-4" /> Imprimir
                  </button>
                  <button onClick={() => setBgEditing(!bgEditing)} className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                    {bgEditing ? <X className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    {bgEditing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'bloodType', label: 'Tipo de sangre', icon: <Droplets className="w-4 h-4 text-red-500" />, ph: 'Ej. O+' },
                  { key: 'allergies', label: 'Alergias', icon: <AlertCircle className="w-4 h-4 text-orange-500" />, ph: 'Alergias conocidas...' },
                  { key: 'chronicConditions', label: 'Condiciones crónicas', icon: <Activity className="w-4 h-4 text-purple-500" />, ph: 'Diabetes, hipertensión...' },
                  { key: 'currentMedications', label: 'Medicamentos actuales', icon: <Tablets className="w-4 h-4 text-blue-500" />, ph: 'Medicamentos que toma actualmente...' },
                  { key: 'surgicalHistory', label: 'Historial quirúrgico', icon: <Scissors className="w-4 h-4 text-gray-500" />, ph: 'Cirugías previas...' },
                  { key: 'familyHistory', label: 'Antecedentes familiares', icon: <Users className="w-4 h-4 text-green-500" />, ph: 'Historial familiar relevante...' },
                ].map(field => (
                  <div key={field.key} className={`rounded-2xl border ${bgEditing ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-gray-50'} p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      {field.icon}
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{field.label}</label>
                    </div>
                    {bgEditing ? (
                      <textarea
                        value={(background as any)[field.key] || ''}
                        onChange={e => setBackground(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.ph}
                        rows={3}
                        className="w-full text-sm font-bold text-black bg-transparent outline-none resize-none placeholder:text-gray-300"
                      />
                    ) : (
                      <p className="text-sm font-bold text-black">{(background as any)[field.key] || <span className="text-gray-300">Sin registro</span>}</p>
                    )}
                  </div>
                ))}
              </div>

              {bgEditing && (
                <button onClick={saveBackground} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar antecedentes
                </button>
              )}
            </div>
          )}

          {/* ── CONSULTAS ── */}
          {activeTab === 'consultas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-black">Historial de Consultas</h3>
                <button
                  onClick={() => setShowNewConsultation(!showNewConsultation)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Nueva Consulta
                </button>
              </div>

              {showNewConsultation && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-black text-blue-900">Nueva Consulta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Doctor</label>
                      <select value={newConsult.doctorId} onChange={e => setNewConsult(p => ({ ...p, doctorId: e.target.value }))}
                        className="w-full mt-1 text-sm font-bold border border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <option value="">Sin asignar</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <input type="checkbox" id="isVirtual" checked={newConsult.isVirtual} onChange={e => setNewConsult(p => ({ ...p, isVirtual: e.target.checked }))} className="w-4 h-4" />
                      <label htmlFor="isVirtual" className="text-sm font-bold text-gray-700">Consulta virtual</label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Motivo de consulta</label>
                    <textarea value={newConsult.chiefComplaint} onChange={e => setNewConsult(p => ({ ...p, chiefComplaint: e.target.value }))}
                      rows={2} placeholder="¿Por qué viene el paciente hoy?"
                      className="w-full mt-1 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 bg-white resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Diagnóstico inicial</label>
                    <datalist id="dx-list-exp">
                      {['Hipertensión arterial','Diabetes mellitus tipo 2','Insuficiencia venosa crónica','Várices de miembros inferiores',
                        'Trombosis venosa profunda (TVP)','Arteriopatía periférica','Enfermedad coronaria','Pie diabético',
                        'Aneurisma aórtico abdominal','Embolia pulmonar','Hiperlipidemia','Edema de miembros inferiores',
                        'Claudicación intermitente','Úlcera venosa','Síndrome metabólico','Insuficiencia cardíaca',
                        'Fibrilación auricular','Estenosis arterial','Linfedema','Tromboflebitis superficial'].map(d => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                    <input list="dx-list-exp" value={newConsult.diagnosis} onChange={e => setNewConsult(p => ({ ...p, diagnosis: e.target.value }))}
                      placeholder="Escribe o selecciona un diagnóstico..."
                      className="w-full mt-1 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createConsultation} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Crear y editar consulta
                    </button>
                    <button onClick={() => setShowNewConsultation(false)} className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              )}

              {consultations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay consultas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map(c => (
                    <Link key={c.id} href={`/patients/${patientId}/expediente/consulta/${c.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                      <div>
                        <p className="font-black text-black text-sm">{format(new Date(c.visitDate), "d 'de' MMMM yyyy", { locale: es })}</p>
                        <p className="text-xs font-bold text-gray-500 mt-0.5">
                          {c.doctor?.name || 'Sin doctor'} · {c.chiefComplaint || c.diagnosis || 'Sin descripción'}
                          {c.isVirtual && <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Virtual</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        {c.prescriptions.length > 0 && <span className="flex items-center gap-1"><Pill className="w-3 h-3" />{c.prescriptions.length}</span>}
                        {c.medicalFiles.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c.medicalFiles.length}</span>}
                        <ChevronRight className="w-5 h-5 group-hover:text-blue-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ARCHIVOS ── */}
          {activeTab === 'archivos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-black">Archivos Clínicos</h3>
                <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 cursor-pointer ${uploadLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Subir archivo
                  <input type="file" className="hidden" onChange={uploadFile} disabled={uploadLoading} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
                </label>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay archivos subidos</p>
                  <p className="text-sm">Sube estudios, análisis o imágenes del paciente</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map(f => (
                    <div key={f.id} className="border border-gray-200 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-black truncate">{f.fileName}</p>
                          <p className="text-xs font-bold text-gray-400">{format(new Date(f.uploadedAt), "d MMM yyyy", { locale: es })}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">{f.fileType}</span>
                      </div>
                      {f.description && <p className="text-xs text-gray-500 font-bold mb-3">{f.description}</p>}
                      <div className="flex gap-2">
                        <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                          <Eye className="w-3 h-3" /> Ver
                        </a>
                        <a href={f.fileUrl} download={f.fileName}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Download className="w-3 h-3" /> Descargar
                        </a>
                        <button onClick={() => deleteFile(f.id)}
                          className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RECETAS ── */}
          {activeTab === 'recetas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-black">Recetas Médicas</h3>
                <button onClick={() => setShowNewRx(!showNewRx)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Nueva Receta
                </button>
              </div>

              {showNewRx && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-black text-blue-900">Nueva Receta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Doctor</label>
                      <select value={newRx.doctorId} onChange={e => setNewRx(p => ({ ...p, doctorId: e.target.value }))}
                        className="w-full mt-1 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <option value="">Sin asignar</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Vincular a consulta</label>
                      <select value={newRx.consultationRecordId} onChange={e => setNewRx(p => ({ ...p, consultationRecordId: e.target.value }))}
                        className="w-full mt-1 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <option value="">Sin consulta</option>
                        {consultations.map(c => (
                          <option key={c.id} value={c.id}>{format(new Date(c.visitDate), "d MMM yyyy", { locale: es })} — {c.chiefComplaint || c.diagnosis || 'Consulta'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2 block">Medicamentos</label>
                    <div className="space-y-3">
                      {newRx.medications.map((med, i) => (
                        <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-3">
                          <input placeholder="Medicamento*" value={med.name} onChange={e => { const m = [...newRx.medications]; m[i].name = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                            className="text-sm font-bold text-gray-900 border-0 outline-none col-span-2" />
                          <input placeholder="Dosis" value={med.dose} onChange={e => { const m = [...newRx.medications]; m[i].dose = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                            className="text-sm font-bold text-gray-900 border-0 outline-none" />
                          <input placeholder="Frecuencia" value={med.frequency} onChange={e => { const m = [...newRx.medications]; m[i].frequency = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                            className="text-sm font-bold text-gray-900 border-0 outline-none" />
                          <input placeholder="Duración" value={med.duration} onChange={e => { const m = [...newRx.medications]; m[i].duration = e.target.value; setNewRx(p => ({ ...p, medications: m })); }}
                            className="text-sm font-bold text-gray-900 border-0 outline-none col-span-2" />
                          <div className="col-span-2 flex justify-end">
                            {newRx.medications.length > 1 && (
                              <button onClick={() => setNewRx(p => ({ ...p, medications: p.medications.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setNewRx(p => ({ ...p, medications: [...p.medications, { name: '', dose: '', frequency: '', duration: '', notes: '' }] }))}
                        className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800">
                        <Plus className="w-4 h-4" /> Agregar medicamento
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Notas adicionales</label>
                    <textarea value={newRx.notes} onChange={e => setNewRx(p => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="Instrucciones especiales..."
                      className="w-full mt-1 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 bg-white resize-none" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={createPrescription} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Crear receta
                    </button>
                    <button onClick={() => setShowNewRx(false)} className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              )}

              {prescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay recetas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map(rx => (
                    <div key={rx.id} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-black text-black text-sm">{format(new Date(rx.issuedAt), "d 'de' MMMM yyyy", { locale: es })}</p>
                          {rx.doctor && <p className="text-xs font-bold text-gray-400">Dr. {rx.doctor.name}</p>}
                        </div>
                        <button
                          onClick={() => {
                            const w = window.open('', '_blank');
                            if (!w || !patient) return;
                            const medsHtml = (rx.medications as any[]).map(m =>
                              `<div style="margin:8px 0;padding:8px;border:1px solid #e5e7eb;border-radius:6px">
                                <strong>${m.name}</strong>${m.dose ? ` — ${m.dose}` : ''}<br>
                                ${m.frequency ? `Frecuencia: ${m.frequency}` : ''}${m.duration ? ` · Duración: ${m.duration}` : ''}
                                ${m.notes ? `<br><em>${m.notes}</em>` : ''}
                              </div>`).join('');
                            w.document.write(`<!DOCTYPE html><html><head><title>Receta</title>
                            <style>body{font-family:sans-serif;padding:30px;max-width:600px;margin:0 auto}h1{font-size:20px;font-weight:900}p{font-size:13px}hr{margin:10px 0}@media print{body{padding:20px}}</style></head><body>
                            <h1>Receta Médica</h1>
                            <p><strong>Paciente:</strong> ${patient.fullName}</p>
                            ${rx.doctor ? `<p><strong>Doctor:</strong> ${rx.doctor.name}</p>` : ''}
                            <p><strong>Fecha:</strong> ${format(new Date(rx.issuedAt), "d 'de' MMMM yyyy", { locale: es })}</p>
                            <hr/><h3 style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.05em">Medicamentos</h3>
                            ${medsHtml}
                            ${rx.notes ? `<hr/><p><strong>Notas:</strong> ${rx.notes}</p>` : ''}
                            <script>window.print();<\/script></body></html>`);
                            w.document.close();
                          }}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                        >
                          <FileText className="w-4 h-4" /> Imprimir
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(rx.medications as any[]).map((m: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Pill className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="font-bold text-black">{m.name}</span>
                            {m.dose && <span className="text-gray-500">· {m.dose}</span>}
                            {m.frequency && <span className="text-gray-400">· {m.frequency}</span>}
                            {m.duration && <span className="text-gray-400">· {m.duration}</span>}
                          </div>
                        ))}
                      </div>
                      {rx.notes && <p className="text-xs text-gray-500 mt-3 font-bold">{rx.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
