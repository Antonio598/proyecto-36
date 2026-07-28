'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
  Home, Link2, Calendar, Stethoscope, FileText, Image,
  Video, BookOpen, LogOut, Loader2, Check, X, ExternalLink,
  ChevronDown, ChevronUp, Pill, Menu,
} from 'lucide-react';

/* ── Types ── */
interface Session { id: string; name: string; email: string; phone: string | null; patientId: string | null; }
interface Cita { id: string; startTime: string; endTime: string; status: string; notes: string | null; service: { name: string; price: number; colorCode: string }; }
interface Consulta { id: string; visitDate: string; diagnosis: string | null; chiefComplaint: string | null; observations: string | null; treatmentPlan: string | null; doctor: { name: string } | null; prescriptions: any[]; medicalFiles: any[]; }
interface Receta { id: string; issuedAt: string; medications: any[]; notes: string | null; doctor: { name: string } | null; consultationRecord: { visitDate: string; diagnosis: string | null } | null; }
interface Examen { id: string; fileName: string; fileUrl: string; fileType: string; description: string | null; uploadedAt: string; }
interface Teleconsulta { id: string; startedAt: string; status: string; roomUrl: string; notes: string | null; doctor: { name: string } | null; }

const NAV = [
  { key: 'inicio',        label: 'Inicio',          icon: Home },
  { key: 'vincular',      label: 'Vincular',         icon: Link2 },
  { key: 'citas',         label: 'Mis Citas',        icon: Calendar },
  { key: 'consultas',     label: 'Consultas',        icon: Stethoscope },
  { key: 'recetas',       label: 'Recetas',          icon: Pill },
  { key: 'examenes',      label: 'Exámenes',         icon: Image },
  { key: 'teleconsultas', label: 'Teleconsultas',    icon: Video },
  { key: 'directorio',    label: 'Directorio',       icon: BookOpen },
];

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  CONFIRMED: { bg: 'rgba(52,211,153,.12)', color: '#34d399', label: 'Confirmada' },
  CANCELLED: { bg: 'rgba(248,113,113,.12)', color: '#f87171', label: 'Cancelada' },
  PENDING:   { bg: 'rgba(251,191,36,.12)', color: '#fbbf24', label: 'Pendiente' },
  OPEN:      { bg: 'rgba(52,211,153,.12)', color: '#34d399', label: 'Activa' },
  CLOSED:    { bg: 'rgba(148,163,184,.12)', color: '#94a3b8', label: 'Finalizada' },
};

function pacienteFetch(path: string, session: Session) {
  return fetch(path, { headers: { 'x-paciente-id': session.id } }).then(r => r.json());
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,.04)' }}>
        <Icon className="w-7 h-7 text-white/20" />
      </div>
      <p className="text-white/30 font-bold text-sm">{text}</p>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const b = STATUS_BADGE[status] ?? { bg: 'rgba(255,255,255,.08)', color: '#fff', label: status };
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-black"
      style={{ background: b.bg, color: b.color }}>
      {b.label}
    </span>
  );
}

function SinVinculo() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-6"
      style={{ background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.18)' }}>
      <Link2 className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
      <p className="text-sm font-bold" style={{ color: '#fde68a' }}>
        Vincula tu expediente en la sección "Vincular" para ver tu información médica.
      </p>
    </div>
  );
}

export default function PacientePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab]           = useState(searchParams.get('tab') ?? 'inicio');
  const [session, setSession]   = useState<Session | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  // Data states
  const [citas,         setCitas]         = useState<Cita[]>([]);
  const [consultas,     setConsultas]     = useState<Consulta[]>([]);
  const [recetas,       setRecetas]       = useState<Receta[]>([]);
  const [examenes,      setExamenes]      = useState<Examen[]>([]);
  const [teleconsultas, setTeleconsultas] = useState<Teleconsulta[]>([]);
  const [loading,       setLoading]       = useState<Record<string, boolean>>({});

  // Vincular state
  const [phone,      setPhone]      = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [vinResult,  setVinResult]  = useState<null | { found: boolean; patient?: any }>(null);

  // Consultas expand
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = localStorage.getItem('paciente_session');
    if (!raw) { router.replace('/paciente/login'); return; }
    try { setSession(JSON.parse(raw)); } catch { router.replace('/paciente/login'); }
  }, [router]);

  const fetchSection = useCallback(async (key: string, sess: Session) => {
    if (!sess.patientId) return;
    const map: Record<string, { set: (d: any) => void; url: string }> = {
      citas:         { set: setCitas,         url: '/api/paciente/citas' },
      consultas:     { set: setConsultas,     url: '/api/paciente/consultas' },
      recetas:       { set: setRecetas,       url: '/api/paciente/recetas' },
      examenes:      { set: setExamenes,      url: '/api/paciente/examenes' },
      teleconsultas: { set: setTeleconsultas, url: '/api/paciente/teleconsultas' },
    };
    if (!map[key]) return;
    setLoading(l => ({ ...l, [key]: true }));
    const data = await pacienteFetch(map[key].url, sess).catch(() => []);
    map[key].set(Array.isArray(data) ? data : []);
    setLoading(l => ({ ...l, [key]: false }));
  }, []);

  useEffect(() => {
    if (session) fetchSection(tab, session);
  }, [tab, session, fetchSection]);

  const goTab = (key: string) => { setTab(key); setMobileNav(false); };

  const logout = () => {
    localStorage.removeItem('paciente_session');
    router.replace('/paciente/login');
  };

  const vincular = async () => {
    if (!session || !phone.trim()) return;
    setVinculando(true); setVinResult(null);
    const res = await fetch('/api/paciente/vincular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-paciente-id': session.id },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = await res.json();
    setVinResult(data);
    if (data.found) {
      const updated = { ...session, phone: phone.trim(), patientId: data.patient.id };
      setSession(updated);
      localStorage.setItem('paciente_session', JSON.stringify(updated));
    }
    setVinculando(false);
  };

  const desvincular = async () => {
    if (!session) return;
    await fetch('/api/paciente/vincular', {
      method: 'DELETE',
      headers: { 'x-paciente-id': session.id },
    });
    const updated = { ...session, phone: null, patientId: null };
    setSession(updated);
    localStorage.setItem('paciente_session', JSON.stringify(updated));
    setVinResult(null); setPhone('');
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#060612' }}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  /* ── Renderizado de secciones ── */
  const renderContent = () => {
    if (tab === 'directorio') {
      router.push('/directorio');
      return null;
    }

    if (tab === 'inicio') return (
      <div className="space-y-6">
        <div className="rounded-2xl p-6" style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.18)' }}>
          <h2 className="text-lg font-black text-white mb-1">Hola, {session.name.split(' ')[0]} 👋</h2>
          <p className="text-white/50 text-sm font-medium">
            {session.patientId
              ? 'Tu expediente está vinculado. Usa la navegación para ver tu información médica.'
              : 'Ve a la sección "Vincular" para conectar tu número de teléfono con tu expediente.'}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NAV.filter(n => !['inicio','directorio'].includes(n.key)).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => goTab(key)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.07)'; }}>
              <Icon className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-black text-white/70">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );

    if (tab === 'vincular') return (
      <div className="max-w-lg space-y-5">
        <div>
          <h2 className="text-lg font-black text-white mb-1">Vincula tu expediente</h2>
          <p className="text-white/40 text-sm">Ingresa el número de teléfono con el que estás registrado en tu clínica.</p>
        </div>

        {session.patientId ? (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,.15)' }}>
                <Check className="w-5 h-5" style={{ color: '#34d399' }} />
              </div>
              <div>
                <p className="font-black text-white text-sm">Expediente vinculado</p>
                <p className="text-white/40 text-xs">{session.phone}</p>
              </div>
            </div>
            <button onClick={desvincular}
              className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(248,113,113,.1)', color: '#f87171', border: '1px solid rgba(248,113,113,.2)' }}>
              <X className="w-3.5 h-3.5" /> Desvincular
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <input value={phone} onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && vincular()}
                placeholder="Ej: 522295487426"
                className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', outline: 'none' }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(59,130,246,.6)'; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,.1)'; }}
              />
              <button onClick={vincular} disabled={vinculando || !phone.trim()}
                className="px-5 py-3 rounded-xl font-black text-white text-sm disabled:opacity-50 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 6px 20px rgba(59,130,246,.35)' }}>
                {vinculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Vincular
              </button>
            </div>

            {vinResult && !vinResult.found && (
              <div className="rounded-xl px-4 py-3 text-sm font-bold"
                style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.18)', color: '#f87171' }}>
                No encontramos un expediente con ese número. Verifica que sea el número registrado en tu clínica.
              </div>
            )}
          </>
        )}
      </div>
    );

    if (tab === 'citas') {
      if (loading.citas) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-500 animate-spin" /></div>;
      if (!session.patientId) return <SinVinculo />;
      const now = new Date();
      const proximas = citas.filter(c => new Date(c.startTime) >= now && c.status !== 'CANCELLED');
      const pasadas  = citas.filter(c => new Date(c.startTime) < now || c.status === 'CANCELLED');
      return (
        <div className="space-y-8">
          {proximas.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">Próximas</h3>
              <div className="space-y-3">
                {proximas.map(c => <CitaCard key={c.id} cita={c} />)}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">Historial</h3>
            {pasadas.length > 0
              ? <div className="space-y-3">{pasadas.map(c => <CitaCard key={c.id} cita={c} />)}</div>
              : <EmptyState icon={Calendar} text="No hay citas anteriores" />}
          </div>
        </div>
      );
    }

    if (tab === 'consultas') {
      if (loading.consultas) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-500 animate-spin" /></div>;
      if (!session.patientId) return <SinVinculo />;
      if (!consultas.length) return <EmptyState icon={Stethoscope} text="No hay consultas registradas" />;
      return (
        <div className="space-y-3">
          {consultas.map(c => {
            const open = expanded[c.id];
            return (
              <div key={c.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <button className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setExpanded(e => ({ ...e, [c.id]: !open }))}>
                  <div>
                    <p className="font-black text-white text-sm">{format(new Date(c.visitDate), "d 'de' MMMM, yyyy", { locale: es })}</p>
                    <p className="text-white/40 text-xs mt-0.5">{c.doctor?.name ?? 'Médico'}{c.diagnosis ? ` · ${c.diagnosis}` : ''}</p>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </button>
                {open && (
                  <div className="px-5 pb-5 space-y-3 border-t border-white/5">
                    {c.chiefComplaint && <InfoBlock label="Motivo" value={c.chiefComplaint} />}
                    {c.observations && <InfoBlock label="Observaciones" value={c.observations} />}
                    {c.treatmentPlan && <InfoBlock label="Plan de tratamiento" value={c.treatmentPlan} />}
                    <div className="flex gap-4 mt-2 text-xs text-white/30 font-bold">
                      {c.prescriptions.length > 0 && <span>{c.prescriptions.length} receta(s)</span>}
                      {c.medicalFiles.length > 0  && <span>{c.medicalFiles.length} archivo(s)</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (tab === 'recetas') {
      if (loading.recetas) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-500 animate-spin" /></div>;
      if (!session.patientId) return <SinVinculo />;
      if (!recetas.length) return <EmptyState icon={FileText} text="No hay recetas registradas" />;
      return (
        <div className="space-y-4">
          {recetas.map(r => {
            const meds: any[] = Array.isArray(r.medications) ? r.medications : (typeof r.medications === 'string' ? JSON.parse(r.medications) : []);
            return (
              <div key={r.id} className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-white text-sm">{format(new Date(r.issuedAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
                    <p className="text-white/40 text-xs mt-0.5">{r.doctor?.name ?? 'Médico'}</p>
                  </div>
                  {r.consultationRecord?.diagnosis && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,.12)', color: '#a5b4fc' }}>
                      {r.consultationRecord.diagnosis}
                    </span>
                  )}
                </div>
                {meds.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.06)' }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,.04)' }}>
                          {['Medicamento', 'Dosis', 'Frecuencia', 'Duración'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-black text-white/30 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {meds.map((m, i) => (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                            <td className="px-3 py-2.5 font-bold text-white">{m.name}</td>
                            <td className="px-3 py-2.5 text-white/60">{m.dose}</td>
                            <td className="px-3 py-2.5 text-white/60">{m.frequency}</td>
                            <td className="px-3 py-2.5 text-white/60">{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {r.notes && <p className="text-xs text-white/40 italic">{r.notes}</p>}
              </div>
            );
          })}
        </div>
      );
    }

    if (tab === 'examenes') {
      if (loading.examenes) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-500 animate-spin" /></div>;
      if (!session.patientId) return <SinVinculo />;
      if (!examenes.length) return <EmptyState icon={Image} text="No hay archivos médicos" />;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {examenes.map(e => (
            <div key={e.id} className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: e.fileType === 'image' ? 'rgba(251,146,60,.12)' : 'rgba(99,102,241,.12)' }}>
                {e.fileType === 'image'
                  ? <Image className="w-5 h-5" style={{ color: '#fb923c' }} />
                  : <FileText className="w-5 h-5" style={{ color: '#a5b4fc' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm truncate">{e.fileName}</p>
                <p className="text-white/30 text-xs mt-0.5">{format(new Date(e.uploadedAt), "d MMM yyyy", { locale: es })}</p>
                {e.description && <p className="text-white/40 text-xs mt-0.5 truncate">{e.description}</p>}
              </div>
              <a href={e.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(59,130,246,.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.2)' }}>
                Ver <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      );
    }

    if (tab === 'teleconsultas') {
      if (loading.teleconsultas) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-500 animate-spin" /></div>;
      if (!session.patientId) return <SinVinculo />;
      if (!teleconsultas.length) return <EmptyState icon={Video} text="No hay teleconsultas registradas" />;
      return (
        <div className="space-y-3">
          {teleconsultas.map(t => (
            <div key={t.id} className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge status={t.status} />
                  <span className="text-white/40 text-xs">{format(new Date(t.startedAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
                </div>
                <p className="font-black text-white text-sm">{t.doctor?.name ?? 'Médico'}</p>
                {t.notes && <p className="text-white/40 text-xs mt-0.5 truncate">{t.notes}</p>}
              </div>
              {t.status === 'OPEN' && (
                <a href={t.roomUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-white text-xs flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                  <Video className="w-4 h-4" /> Unirse
                </a>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <style>{`
        @keyframes float-orb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.05)}}
        .orb1{animation:float-orb 20s ease-in-out infinite}
        .orb2{animation:float-orb 25s ease-in-out infinite reverse;animation-delay:-10s}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;font-weight:800;font-size:13px;width:100%;text-align:left;transition:background .15s,color .15s;color:rgba(255,255,255,.45);border-left:2px solid transparent}
        .nav-item:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.8)}
        .nav-item.active{background:rgba(34,211,238,.08);border-left-color:#22d3ee;color:white}
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{ background: '#060612' }}>
        <div className="orb1 absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ top: '-8rem', left: '-8rem', background: 'radial-gradient(circle,rgba(59,130,246,.2),transparent 70%)', filter: 'blur(80px)' }} />
        <div className="orb2 absolute w-80 h-80 rounded-full pointer-events-none"
          style={{ bottom: '5%', right: '-6rem', background: 'radial-gradient(circle,rgba(139,92,246,.15),transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Header */}
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0"
          style={{ background: 'rgba(6,1,18,.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5"
              onClick={() => setMobileNav(v => !v)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm italic"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>G</div>
            <span className="font-black text-white text-sm hidden sm:block">Mi Portal</span>
          </div>
          <div className="flex items-center gap-3">
            {session.patientId && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(52,211,153,.1)', color: '#34d399', border: '1px solid rgba(52,211,153,.2)' }}>
                <Check className="w-3 h-3" /> Vinculado
              </span>
            )}
            <span className="text-sm font-bold text-white/50 hidden sm:block">{session.name}</span>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.4)'; }}>
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </header>

        <div className="relative z-10 flex h-[calc(100vh-65px)]">
          {/* Sidebar desktop */}
          <nav className="hidden md:flex flex-col w-52 flex-shrink-0 py-4 px-3 gap-1 overflow-y-auto"
            style={{ borderRight: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.3)' }}>
            {NAV.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => goTab(key)}
                className={`nav-item ${tab === key ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" /> {label}
              </button>
            ))}
          </nav>

          {/* Mobile nav overlay */}
          {mobileNav && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
              <nav className="relative flex flex-col w-56 h-full py-4 px-3 gap-1 overflow-y-auto"
                style={{ background: '#060612', borderRight: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex items-center gap-2 px-2 py-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs italic"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>G</div>
                  <span className="font-black text-white text-sm">Mi Portal</span>
                </div>
                {NAV.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => goTab(key)}
                    className={`nav-item ${tab === key ? 'active' : ''}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-xl font-black text-white">{NAV.find(n => n.key === tab)?.label ?? 'Panel'}</h1>
              </div>
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */
function CitaCard({ cita }: { cita: Cita }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cita.service.colorCode }} />
      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-sm">{cita.service.name}</p>
        <p className="text-white/40 text-xs mt-0.5">
          {format(new Date(cita.startTime), "d 'de' MMMM, yyyy · HH:mm", { locale: es })}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-white/60 text-xs font-bold">${cita.service.price.toFixed(2)}</span>
        <Badge status={cita.status} />
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-3">
      <p className="text-xs font-black text-white/25 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-white/70 font-medium leading-relaxed">{value}</p>
    </div>
  );
}
