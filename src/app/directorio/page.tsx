'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Shield, ChevronRight, Stethoscope, Phone, Globe, Instagram, Linkedin, ArrowRight, Check } from 'lucide-react';

const COMMON_DIAGNOSES = [
  'Cirugía Vascular', 'Cardiología', 'Medicina Interna', 'Dermatología',
  'Ortopedia', 'Neurología', 'Urología', 'Ginecología',
];

const STEPS = [
  {
    id: 'symptom',
    question: '¿Qué te trae por aquí hoy?',
    subtitle: 'Cuéntanos cómo podemos ayudarte',
    chips: ['Dolor o molestia', 'Consulta general', 'Cirugía o procedimiento', 'Seguimiento médico', 'Resultado de exámenes', 'Otra razón'],
    allowText: true,
    placeholder: 'Describe tus síntomas...',
  },
  {
    id: 'specialty',
    question: '¿Qué especialidad necesitas?',
    subtitle: 'Selecciona una o busca libremente',
    chips: [...COMMON_DIAGNOSES, 'Cualquier especialidad'],
    allowText: false,
  },
  {
    id: 'insurance',
    question: '¿Tienes seguro médico?',
    subtitle: 'Te ayudamos a encontrar médicos que acepten tu seguro',
    chips: ['ASSA', 'MAPFRE', 'Blue Cross', 'Pan-American Life', 'Seguro Social (CSS)', 'No tengo seguro'],
    allowText: false,
  },
];

interface Doctor {
  id: string; name: string; specialty: string | null; bio: string | null;
  photoUrl: string | null; location: string | null;
  socialLinks: Record<string, string> | null; insurances: string[] | null;
  subaccount: { id: string; name: string; account: { id: string } };
}

const keyframes = `
  @keyframes float-orb-1 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    25% { transform: translate(60px, -50px) scale(1.08); }
    50% { transform: translate(30px, 40px) scale(0.92); }
    75% { transform: translate(-40px, -20px) scale(1.05); }
  }
  @keyframes float-orb-2 {
    0%, 100% { transform: translate(0px, 0px) scale(1.1); }
    33% { transform: translate(-70px, 60px) scale(0.88); }
    66% { transform: translate(50px, -30px) scale(1.15); }
  }
  @keyframes float-orb-3 {
    0%, 100% { transform: translate(0px, 0px) scale(0.9); }
    40% { transform: translate(80px, 50px) scale(1.1); }
    80% { transform: translate(-20px, -60px) scale(0.95); }
  }
  @keyframes float-orb-4 {
    0%, 100% { transform: translate(0px, 0px) scale(1.05); }
    50% { transform: translate(-60px, 40px) scale(0.9); }
  }
  @keyframes typing-appear {
    from { opacity: 0; transform: translateY(14px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0px) scale(1); }
  }
  @keyframes chip-appear {
    from { opacity: 0; transform: translateY(10px) scale(0.88); }
    to   { opacity: 1; transform: translateY(0px) scale(1); }
  }
  @keyframes glow-ring {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%       { opacity: 0.75; transform: scale(1.18); }
  }
  @keyframes glow-ring-2 {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(1.3); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes dot-bounce {
    0%, 80%, 100% { transform: translateY(0px); opacity: 0.4; }
    40% { transform: translateY(-8px); opacity: 1; }
  }
  @keyframes scan-line {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
  .orb-1 { animation: float-orb-1 18s ease-in-out infinite; }
  .orb-2 { animation: float-orb-2 22s ease-in-out infinite; }
  .orb-3 { animation: float-orb-3 15s ease-in-out infinite; }
  .orb-4 { animation: float-orb-4 25s ease-in-out infinite; }
  .typing-appear { animation: typing-appear 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .glow-ring-1 { animation: glow-ring 2.2s ease-in-out infinite; }
  .glow-ring-2 { animation: glow-ring-2 2.8s ease-in-out infinite 0.4s; }
  .dot-1 { animation: dot-bounce 1.4s ease-in-out infinite 0ms; }
  .dot-2 { animation: dot-bounce 1.4s ease-in-out infinite 200ms; }
  .dot-3 { animation: dot-bounce 1.4s ease-in-out infinite 400ms; }
`;

export default function DirectorioPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step, showResults, isLoading, isTyping]);

  const handleChip = (value: string) => {
    const currentStep = STEPS[step];
    const newAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setStep(s => s + 1);
      }, 700);
    } else {
      fetchDoctors(newAnswers);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleChip(textInput.trim());
    setTextInput('');
  };

  const fetchDoctors = async (ans: Record<string, string>) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (ans.specialty && ans.specialty !== 'Cualquier especialidad') params.set('specialty', ans.specialty);
      if (ans.insurance && !['No tengo seguro', 'Seguro Social (CSS)'].includes(ans.insurance)) params.set('insurance', ans.insurance);
      const res = await fetch(`/api/directory?${params.toString()}`);
      if (res.ok) setDoctors(await res.json());
    } catch {}
    finally { setIsLoading(false); setShowResults(true); }
  };

  const restart = () => {
    setStep(0); setAnswers({}); setTextInput('');
    setDoctors([]); setShowResults(false); setIsTyping(false);
  };

  return (
    <>
      <style>{keyframes}</style>
      <div className="min-h-screen bg-black relative overflow-x-hidden">

        {/* Dot grid overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="orb-1 absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/18"
            style={{ filter: 'blur(100px)' }} />
          <div className="orb-2 absolute top-1/3 -left-48 w-[420px] h-[420px] rounded-full bg-violet-600/15"
            style={{ filter: 'blur(110px)' }} />
          <div className="orb-3 absolute -bottom-40 right-1/4 w-[380px] h-[380px] rounded-full bg-cyan-500/12"
            style={{ filter: 'blur(90px)' }} />
          <div className="orb-4 absolute top-2/3 right-1/3 w-[300px] h-[300px] rounded-full bg-indigo-500/10"
            style={{ filter: 'blur(80px)' }} />
        </div>

        {/* Header */}
        <header className="relative z-20 sticky top-0"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 24px rgba(6,182,212,0.4)' }}>
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span className="font-black text-white text-base">Directorio</span>
                <span className="font-black text-base ml-1" style={{ color: '#22d3ee' }}> Galenus</span>
              </div>
            </div>

            {/* Step progress dots */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-500"
                    style={{
                      width: i === step && !showResults ? '20px' : '8px',
                      height: '8px',
                      background: i <= step || showResults ? '#22d3ee' : 'rgba(255,255,255,0.2)',
                      boxShadow: (i <= step || showResults) ? '0 0 8px rgba(34,211,238,0.8)' : 'none',
                    }}
                  />
                ))}
              </div>
              {showResults && (
                <button onClick={restart}
                  className="text-sm font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  Nueva búsqueda
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">

          {/* Intro */}
          <div className="flex items-start gap-3 typing-appear">
            <BotAvatar />
            <div className="rounded-3xl rounded-tl-lg px-5 py-4 max-w-sm"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-white font-black text-sm">¡Hola! Soy el asistente de Galenus.</p>
              <p className="text-sm font-medium mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Te ayudaré a encontrar el médico ideal. Responde unas preguntas rápidas.
              </p>
            </div>
          </div>

          {/* Steps */}
          {STEPS.slice(0, step + 1).map((s, idx) => (
            <div key={s.id} className="flex flex-col gap-3">
              {/* Bot question */}
              <div className="flex items-start gap-3 typing-appear">
                <BotAvatar />
                <div className="rounded-3xl rounded-tl-lg px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-white font-black text-sm">{s.question}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.subtitle}</p>
                </div>
              </div>

              {/* User answer bubble */}
              {answers[s.id] && (
                <div className="flex justify-end typing-appear">
                  <div className="flex items-center gap-2 rounded-3xl rounded-tr-lg px-5 py-3 max-w-xs"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
                    }}>
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" />
                    <p className="font-bold text-sm text-white">{answers[s.id]}</p>
                  </div>
                </div>
              )}

              {/* Chips for current step */}
              {idx === step && !answers[s.id] && !showResults && !isTyping && (
                <div className="flex flex-col gap-3 pl-[52px]">
                  <div className="flex flex-wrap gap-2">
                    {s.chips.map((chip, ci) => (
                      <ChipButton key={chip} label={chip} delay={ci * 55} onClick={() => handleChip(chip)} />
                    ))}
                  </div>
                  {s.allowText && (
                    <form onSubmit={handleTextSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder={s.placeholder}
                        className="flex-1 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/30"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.1)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button type="submit"
                        className="px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Bot typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 typing-appear">
              <BotAvatar />
              <div className="rounded-3xl rounded-tl-lg px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-1.5 items-center">
                  <div className="dot-1 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  <div className="dot-2 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  <div className="dot-3 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                </div>
              </div>
            </div>
          )}

          {/* Loading while fetching */}
          {isLoading && (
            <div className="flex items-start gap-3 typing-appear">
              <BotAvatar />
              <div className="rounded-3xl rounded-tl-lg px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-1.5 items-center">
                  <div className="dot-1 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  <div className="dot-2 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  <div className="dot-3 w-2 h-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                  <span className="text-xs font-bold ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Buscando médicos...</span>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="flex flex-col gap-5 typing-appear">
              <div className="flex items-start gap-3">
                <BotAvatar />
                <div className="rounded-3xl rounded-tl-lg px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-white font-black text-sm">
                    {doctors.length > 0
                      ? `Encontré ${doctors.length} médico${doctors.length !== 1 ? 's' : ''} para ti:`
                      : '¡No encontré médicos con esos criterios! Pronto habrá más especialistas disponibles.'}
                  </p>
                </div>
              </div>

              {doctors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map((doc, i) => (
                    <DoctorCard key={doc.id} doctor={doc} delay={i * 80} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </>
  );
}

function ChipButton({ label, delay, onClick }: { label: string; delay: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationName: 'chip-appear',
        animationDuration: '0.35s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: `${delay}ms`,
        background: hovered ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.05)',
        border: hovered ? '1px solid rgba(34,211,238,0.55)' : '1px solid rgba(255,255,255,0.12)',
        color: hovered ? '#ffffff' : 'rgba(255,255,255,0.75)',
        boxShadow: hovered ? '0 0 20px rgba(34,211,238,0.15)' : 'none',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '10px 16px',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function BotAvatar() {
  return (
    <div className="relative flex-shrink-0 mt-0.5">
      {/* Outer glow ring */}
      <div className="glow-ring-2 absolute inset-0 rounded-2xl"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.25), transparent)', transform: 'scale(1.4)' }} />
      {/* Inner glow ring */}
      <div className="glow-ring-1 absolute inset-0 rounded-2xl"
        style={{ border: '1.5px solid rgba(34,211,238,0.4)', borderRadius: '14px' }} />
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center z-10"
        style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          boxShadow: '0 0 30px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}>
        <Stethoscope className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

function DoctorCard({ doctor, delay }: { doctor: Doctor; delay: number }) {
  const social = doctor.socialLinks || {};
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationName: 'chip-appear',
        animationDuration: '0.5s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        animationFillMode: 'both',
        animationDelay: `${delay}ms`,
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        border: hovered ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered ? '0 16px 64px rgba(34,211,238,0.08), 0 0 0 1px rgba(34,211,238,0.1)' : 'none',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '20px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0px)',
      }}
    >
      {/* Cyan accent line on hover */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 0, left: '20px', right: '20px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
          borderRadius: '999px',
        }} />
      )}

      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            boxShadow: hovered ? '0 0 20px rgba(6,182,212,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'box-shadow 0.3s ease',
          }}>
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-white text-sm leading-tight">{doctor.name}</h3>
          {doctor.specialty && (
            <p className="text-xs font-bold mt-0.5" style={{ color: '#22d3ee' }}>{doctor.specialty}</p>
          )}
          {doctor.subaccount?.name && (
            <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{doctor.subaccount.name}</p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-xs font-medium leading-relaxed mb-3.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{doctor.bio}</p>
      )}

      <div className="space-y-1.5 mb-4">
        {doctor.location && (
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22d3ee' }} />
            <span className="truncate">{doctor.location}</span>
          </div>
        )}
        {doctor.insurances && doctor.insurances.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
            <div className="flex flex-wrap gap-1">
              {doctor.insurances.slice(0, 3).map((ins, i) => (
                <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  {ins}
                </span>
              ))}
              {doctor.insurances.length > 3 && (
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>+{doctor.insurances.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {Object.keys(social).length > 0 && (
        <div className="flex gap-2 mb-4">
          {social.whatsapp && (
            <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#4ade80' }}>
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {social.instagram && (
            <a href={`https://instagram.com/${social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#f472b6' }}>
              <Instagram className="w-3.5 h-3.5" />
            </a>
          )}
          {social.linkedin && (
            <a href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#60a5fa' }}>
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {social.website && (
            <a href={social.website} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <Link
        href={`/directorio/${doctor.id}`}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-black rounded-2xl transition-all"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          boxShadow: hovered ? '0 8px 28px rgba(34,211,238,0.35)' : '0 4px 16px rgba(59,130,246,0.3)',
        }}
      >
        Ver perfil completo <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
