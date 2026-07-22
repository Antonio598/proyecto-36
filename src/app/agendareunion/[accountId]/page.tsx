'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Video, ArrowLeft, ChevronRight, User, Phone, Calendar,
  CheckCircle2, Stethoscope, Loader2, Clock
} from 'lucide-react';

interface Doctor {
  id: string; name: string; specialty: string | null;
  bio: string | null; photoUrl: string | null;
  subaccount: { id: string; name: string; account: { id: string } };
}

type Step = 'select-doctor' | 'fill-form' | 'confirm';

export default function AgendaReunionPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);

  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [step, setStep]           = useState<Step>('select-doctor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', reason: '', preferredDate: '', preferredTime: '',
  });

  useEffect(() => {
    fetch(`/api/directory?accountId=${accountId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [accountId]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !selectedDoctor) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/agendareunion/${accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId:      selectedDoctor.id,
          patientName:   form.name,
          patientPhone:  form.phone,
          reason:        form.reason,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al enviar');
      setStep('confirm');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float-orb {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(40px,-30px) scale(1.05)}
          66%{transform:translate(-20px,20px) scale(0.95)}
        }
        @keyframes slide-up {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
        .slide-up{animation:slide-up .4s ease-out both}
        .orb1{animation:float-orb 18s ease-in-out infinite}
        .orb2{animation:float-orb 22s ease-in-out infinite reverse; animation-delay:-7s}
        .orb3{animation:float-orb 16s ease-in-out infinite; animation-delay:-3s}
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(.3); }
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{ background: '#060612' }}>
        {/* Orbs */}
        <div className="orb1 absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ top: '-8rem', left: '-8rem', background: 'radial-gradient(circle,rgba(59,130,246,.35),transparent 70%)', filter: 'blur(60px)' }} />
        <div className="orb2 absolute w-80 h-80 rounded-full pointer-events-none"
          style={{ bottom: '10%', right: '-6rem', background: 'radial-gradient(circle,rgba(139,92,246,.3),transparent 70%)', filter: 'blur(60px)' }} />
        <div className="orb3 absolute w-64 h-64 rounded-full pointer-events-none"
          style={{ top: '40%', right: '20%', background: 'radial-gradient(circle,rgba(6,182,212,.2),transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Header */}
        <header className="relative z-10 px-4 py-5 flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/directorio" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> Directorio
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-sm">Solicitar Teleconsulta</span>
          </div>
        </header>

        <main className="relative z-10 max-w-2xl mx-auto px-4 pb-16 pt-4">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {(['select-doctor','fill-form','confirm'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  s === step
                    ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,.6)]'
                    : i < ['select-doctor','fill-form','confirm'].indexOf(step)
                      ? 'bg-white/20 text-white'
                      : 'bg-white/8 text-white/30'
                }`}>{i + 1}</div>
                {i < 2 && <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,.15)' }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Select Doctor ── */}
          {step === 'select-doctor' && (
            <div className="slide-up">
              <h1 className="text-2xl font-black text-white mb-1 text-center">Elige tu médico</h1>
              <p className="text-white/40 text-sm text-center mb-8 font-medium">
                Selecciona el especialista con quien deseas tu teleconsulta
              </p>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-16">
                  <Stethoscope className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 font-bold">No hay médicos disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctors.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDoctor(d); setStep('fill-form'); }}
                      className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all group"
                      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,.35)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)';
                      }}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                        {d.photoUrl
                          ? <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                          : <Stethoscope className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm">{d.name}</p>
                        {d.specialty && <p className="text-xs font-bold mt-0.5" style={{ color: '#22d3ee' }}>{d.specialty}</p>}
                        {d.subaccount?.name && <p className="text-xs text-white/30 font-medium mt-0.5">{d.subaccount.name}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Fill Form ── */}
          {step === 'fill-form' && selectedDoctor && (
            <div className="slide-up">
              {/* Selected doctor chip */}
              <button
                onClick={() => setStep('select-doctor')}
                className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                  {selectedDoctor.photoUrl
                    ? <img src={selectedDoctor.photoUrl} alt="" className="w-full h-full object-cover" />
                    : <Stethoscope className="w-3 h-3 text-white" />}
                </div>
                {selectedDoctor.name}{selectedDoctor.specialty ? ` · ${selectedDoctor.specialty}` : ''}
              </button>

              <h1 className="text-2xl font-black text-white mb-1">Tus datos</h1>
              <p className="text-white/40 text-sm mb-8 font-medium">
                Tu solicitud llegará directamente al panel del médico
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-white/40 uppercase tracking-wider block mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1.5" />Nombre completo *
                  </label>
                  <input
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-white/40 uppercase tracking-wider block mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1.5" />Teléfono / WhatsApp *
                  </label>
                  <input
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+507 6000-0000"
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-white/40 uppercase tracking-wider block mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1.5" />Fecha preferida
                    </label>
                    <input
                      type="date" value={form.preferredDate}
                      onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-white/40 uppercase tracking-wider block mb-1.5">
                      <Clock className="w-3.5 h-3.5 inline mr-1.5" />Hora preferida
                    </label>
                    <input
                      type="time" value={form.preferredTime}
                      onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-white/40 uppercase tracking-wider block mb-1.5">
                    Motivo de consulta
                  </label>
                  <textarea
                    rows={3} value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="¿Por qué deseas la consulta? (opcional)"
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
                  />
                </div>

                {error && (
                  <div className="text-sm font-bold text-red-400 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!form.name || !form.phone || submitting}
                  className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 32px rgba(59,130,246,.35)' }}
                >
                  {submitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando solicitud...</>
                    : <><Video className="w-5 h-5" /> Solicitar teleconsulta</>}
                </button>

                <p className="text-center text-xs text-white/25 font-medium">
                  Tu solicitud será visible para el médico en su panel. Te contactarán para confirmar el horario.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && (
            <div className="slide-up text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 40px rgba(16,185,129,.3)' }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">¡Solicitud enviada!</h1>
              <p className="text-white/50 font-medium text-sm mb-2">
                Tu solicitud fue recibida por el consultorio.
              </p>
              <p className="text-white/35 font-medium text-sm mb-8">
                El médico revisará tu solicitud y se pondrá en contacto contigo para confirmar el horario de tu teleconsulta.
              </p>

              <div className="rounded-2xl p-5 text-left mb-6"
                style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }}>
                <p className="text-xs font-black text-blue-300/60 uppercase tracking-wider mb-2">Tu solicitud incluye</p>
                <div className="space-y-1.5 text-sm font-bold text-white/70">
                  <p><span className="text-white/30">Médico:</span> {selectedDoctor?.name}</p>
                  <p><span className="text-white/30">Nombre:</span> {form.name}</p>
                  <p><span className="text-white/30">Teléfono:</span> {form.phone}</p>
                  {form.preferredDate && <p><span className="text-white/30">Fecha preferida:</span> {form.preferredDate}{form.preferredTime ? ` a las ${form.preferredTime}` : ''}</p>}
                  {form.reason && <p><span className="text-white/30">Motivo:</span> {form.reason}</p>}
                </div>
              </div>

              <Link href="/directorio"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/30 hover:text-white/60 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al directorio
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
