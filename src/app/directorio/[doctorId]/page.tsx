'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Stethoscope, MapPin, Shield, Phone, Globe,
  Instagram, Linkedin, MessageCircle, Video, Calendar, ExternalLink
} from 'lucide-react';

export default function DoctorPublicPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch(`/api/directory/${doctorId}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject('No encontrado'))
      .then(setDoctor)
      .catch(e => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, [doctorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060612' }}>
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060612' }}>
        <div className="text-center">
          <Stethoscope className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="font-black text-white text-lg mb-2">Médico no encontrado</h2>
          <p className="text-white/40 text-sm mb-6">Este perfil no está disponible en el directorio.</p>
          <Link href="/directorio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <ArrowLeft className="w-4 h-4" /> Volver al directorio
          </Link>
        </div>
      </div>
    );
  }

  const social: Record<string, string> = doctor.socialLinks || {};
  const ins: string[] = doctor.insurances || [];
  const accountId: string = doctor.subaccount?.account?.id || '';
  const whatsappPhone: string = doctor.phone || social.whatsapp || '';
  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola, quisiera agendar una consulta presencial con ${doctor.name}`)}`
    : '';

  return (
    <>
      <style>{`
        @keyframes float-orb {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(40px,-30px) scale(1.05)}
          66%{transform:translate(-20px,20px) scale(0.95)}
        }
        @keyframes glow-ring {
          0%,100%{opacity:.4;transform:scale(1)}
          50%{opacity:.8;transform:scale(1.12)}
        }
        @keyframes fade-up {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
        .orb1{animation:float-orb 18s ease-in-out infinite}
        .orb2{animation:float-orb 24s ease-in-out infinite reverse; animation-delay:-9s}
        .fade-up{animation:fade-up .5s ease-out both}
        .fade-up-1{animation:fade-up .5s .1s ease-out both}
        .fade-up-2{animation:fade-up .5s .2s ease-out both}
        .fade-up-3{animation:fade-up .5s .3s ease-out both}
        .glow-ring{animation:glow-ring 3s ease-in-out infinite}
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{ background: '#060612' }}>
        {/* Orbs */}
        <div className="orb1 absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ top: '-10rem', left: '-10rem', background: 'radial-gradient(circle,rgba(59,130,246,.3),transparent 70%)', filter: 'blur(80px)' }} />
        <div className="orb2 absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ bottom: '5%', right: '-8rem', background: 'radial-gradient(circle,rgba(139,92,246,.25),transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Header */}
        <header className="relative z-10 px-4 py-5 sticky top-0"
          style={{ background: 'rgba(6,1,18,.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Link href="/directorio" className="p-2 rounded-full hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <span className="font-black text-white text-sm">Perfil del Médico</span>
          </div>
        </header>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">

          {/* Hero card */}
          <div className="fade-up rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            {/* Banner gradient */}
            <div className="h-28 relative" style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.4),rgba(139,92,246,.4),rgba(6,182,212,.2))' }}>
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-14 mb-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="glow-ring absolute inset-0 rounded-2xl"
                    style={{ boxShadow: '0 0 0 3px rgba(6,182,212,.3)', borderRadius: '18px' }} />
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center border-4 shadow-xl relative"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderColor: 'rgba(255,255,255,.08)' }}>
                    {doctor.photoUrl
                      ? <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
                      : <Stethoscope className="w-10 h-10 text-white" />}
                  </div>
                </div>

                <div className="pb-1">
                  <h1 className="text-xl font-black text-white">{doctor.name}</h1>
                  {doctor.specialty && (
                    <p className="font-bold text-sm mt-0.5" style={{ color: '#22d3ee' }}>{doctor.specialty}</p>
                  )}
                  {doctor.subaccount?.name && (
                    <p className="text-white/30 text-xs font-medium mt-0.5">{doctor.subaccount.name}</p>
                  )}
                </div>
              </div>

              {doctor.bio && (
                <p className="text-white/55 text-sm font-medium leading-relaxed">{doctor.bio}</p>
              )}
            </div>
          </div>

          {/* ── DUAL CTA ── */}
          <div className="fade-up-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Presencial */}
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl transition-all group"
                style={{ background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(22,163,74,.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(22,163,74,.25)'; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(22,163,74,.2)' }}>
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-black text-white text-sm">Consulta Presencial</p>
                  <p className="text-xs font-medium text-white/40 mt-0.5">Agendar por WhatsApp</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </div>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl opacity-40"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.06)' }}>
                  <Calendar className="w-5 h-5 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="font-black text-white/50 text-sm">Consulta Presencial</p>
                  <p className="text-xs font-medium text-white/25 mt-0.5">Sin teléfono configurado</p>
                </div>
              </div>
            )}

            {/* Teleconsulta */}
            {accountId ? (
              <Link href={`/agendareunion/${accountId}?doctorId=${doctorId}`}
                className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl transition-all group"
                style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,.25)'; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,.2)' }}>
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-black text-white text-sm">Teleconsulta</p>
                  <p className="text-xs font-medium text-white/40 mt-0.5">Reunión en línea</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
                  <Video className="w-3.5 h-3.5" /> Agendar online
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl opacity-40"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.06)' }}>
                  <Video className="w-5 h-5 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="font-black text-white/50 text-sm">Teleconsulta</p>
                  <p className="text-xs font-medium text-white/25 mt-0.5">No disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Info cards */}
          <div className="fade-up-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctor.location && (
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-white/30 uppercase tracking-wider">Ubicación</span>
                </div>
                <p className="text-sm font-bold text-white">{doctor.location}</p>
              </div>
            )}

            {ins.length > 0 && (
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-white/30 uppercase tracking-wider">Aseguradoras</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ins.map((i, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs font-bold rounded-full"
                      style={{ color: '#34d399', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)' }}>
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social links */}
          {Object.keys(social).length > 0 && (
            <div className="fade-up-3 rounded-2xl p-5 space-y-2"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
              <span className="text-xs font-black text-white/30 uppercase tracking-wider block mb-3">Contacto y redes</span>
              {social.whatsapp && (
                <a href={`https://wa.me/${social.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
                  style={{ background: 'rgba(22,163,74,.08)', color: '#4ade80' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,.08)'}>
                  <MessageCircle className="w-4 h-4" /> {social.whatsapp}
                </a>
              )}
              {social.instagram && (
                <a href={`https://instagram.com/${social.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
                  style={{ background: 'rgba(236,72,153,.08)', color: '#f9a8d4' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(236,72,153,.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(236,72,153,.08)'}>
                  <Instagram className="w-4 h-4" /> {social.instagram}
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
                  style={{ background: 'rgba(59,130,246,.08)', color: '#93c5fd' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,.08)'}>
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {social.website && (
                <a href={social.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.6)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.09)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.05)'}>
                  <Globe className="w-4 h-4" /> {social.website} <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                </a>
              )}
            </div>
          )}

          {/* Back to directory */}
          <div className="text-center pt-2">
            <Link href="/directorio" className="text-xs font-bold text-white/25 hover:text-white/50 transition-colors">
              ← Volver al directorio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
