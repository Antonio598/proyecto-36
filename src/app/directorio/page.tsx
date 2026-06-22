'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Shield, ChevronRight, Stethoscope, Phone, Globe, Instagram, Linkedin, Sparkles, ArrowRight, Check } from 'lucide-react';

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

export default function DirectorioPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step, showResults, isLoading]);

  const handleChip = (value: string) => {
    const currentStep = STEPS[step];
    const newAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 350);
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
    setDoctors([]); setShowResults(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm sticky top-0">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-base">Directorio</span>
              <span className="font-black text-blue-600 text-base"> Galenus</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showResults && (
              <button onClick={restart}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all">
                Nueva búsqueda
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Intro */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200 mt-0.5">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-white shadow-sm rounded-3xl rounded-tl-lg px-5 py-4 max-w-sm">
            <p className="text-gray-900 font-black text-sm">¡Hola! Soy el asistente de Galenus.</p>
            <p className="text-gray-500 text-sm font-medium mt-1 leading-relaxed">Te ayudaré a encontrar el médico ideal. Responde unas preguntas rápidas.</p>
          </div>
        </div>

        {/* Steps */}
        {STEPS.slice(0, step + 1).map((s, idx) => (
          <div key={s.id} className="flex flex-col gap-3">
            {/* Bot question */}
            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200 mt-0.5">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-white shadow-sm rounded-3xl rounded-tl-lg px-5 py-4">
                <p className="text-gray-900 font-black text-sm">{s.question}</p>
                <p className="text-gray-400 text-xs font-medium mt-0.5">{s.subtitle}</p>
              </div>
            </div>

            {/* User answer bubble */}
            {answers[s.id] && (
              <div className="flex justify-end animate-in fade-in duration-400">
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl rounded-tr-lg px-5 py-3 shadow-lg shadow-blue-200/50 max-w-xs">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <p className="font-bold text-sm">{answers[s.id]}</p>
                </div>
              </div>
            )}

            {/* Chips for current step */}
            {idx === step && !answers[s.id] && !showResults && (
              <div className="flex flex-col gap-3 pl-[52px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-wrap gap-2">
                  {s.chips.map((chip, ci) => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      style={{ animationDelay: `${ci * 60}ms` }}
                      className="px-4 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 text-gray-800 font-bold rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-1 duration-300"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                {s.allowText && (
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder={s.placeholder}
                      className="flex-1 border-2 border-gray-100 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none shadow-sm placeholder:text-gray-400"
                    />
                    <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-200">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/80 border border-white rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 180}ms` }} />
                ))}
                <span className="text-xs font-bold text-gray-400 ml-2">Buscando médicos...</span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/80 border border-white rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm">
                <p className="text-gray-900 font-black text-sm">
                  {doctors.length > 0
                    ? `Encontré ${doctors.length} médico${doctors.length !== 1 ? 's' : ''} para ti:`
                    : 'No encontré médicos con esos criterios. ¡Pronto habrá más especialistas disponibles!'}
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
  );
}

function DoctorCard({ doctor, delay }: { doctor: Doctor; delay: number }) {
  const social = doctor.socialLinks || {};

  return (
    <div
      className="group bg-white/80 backdrop-blur-sm border border-white rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 animate-in fade-in slide-in-from-bottom-3 duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-sm leading-tight">{doctor.name}</h3>
          {doctor.specialty && (
            <p className="text-xs font-bold text-blue-600 mt-0.5">{doctor.specialty}</p>
          )}
          {doctor.subaccount?.name && (
            <p className="text-xs font-medium text-gray-400 mt-0.5 truncate">{doctor.subaccount.name}</p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-3.5 line-clamp-2">{doctor.bio}</p>
      )}

      <div className="space-y-1.5 mb-4">
        {doctor.location && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">{doctor.location}</span>
          </div>
        )}
        {doctor.insurances && doctor.insurances.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {doctor.insurances.slice(0, 3).map((ins, i) => (
                <span key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{ins}</span>
              ))}
              {doctor.insurances.length > 3 && <span className="text-xs font-bold text-gray-400">+{doctor.insurances.length - 3}</span>}
            </div>
          </div>
        )}
      </div>

      {Object.keys(social).length > 0 && (
        <div className="flex gap-2 mb-4">
          {social.whatsapp && (
            <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-green-50 rounded-xl text-green-600 hover:bg-green-100 transition-colors hover:scale-110">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {social.instagram && (
            <a href={`https://instagram.com/${social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-pink-50 rounded-xl text-pink-600 hover:bg-pink-100 transition-colors hover:scale-110">
              <Instagram className="w-3.5 h-3.5" />
            </a>
          )}
          {social.linkedin && (
            <a href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors hover:scale-110">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {social.website && (
            <a href={social.website} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors hover:scale-110">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <Link
        href={`/directorio/${doctor.id}`}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50"
      >
        Ver perfil completo <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
