'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Shield, ChevronRight, Stethoscope, Phone, Globe, Instagram, Linkedin } from 'lucide-react';

const STEPS = [
  {
    id: 'symptom',
    question: '¿Qué te trae por aquí hoy?',
    chips: ['Dolor o molestia', 'Consulta general', 'Cirugía o procedimiento', 'Seguimiento médico', 'Resultado de exámenes'],
    placeholder: 'Describe tus síntomas o necesidad...',
    allowText: true,
  },
  {
    id: 'specialty',
    question: '¿Tienes preferencia de especialidad?',
    chips: ['Cirugía Vascular', 'Cardiología', 'Medicina Interna', 'Dermatología', 'Cualquier especialidad'],
    allowText: false,
  },
  {
    id: 'insurance',
    question: '¿Tienes seguro médico?',
    chips: ['ASSA', 'MAPFRE', 'Blue Cross', 'Pan-American Life', 'No tengo seguro', 'Otro'],
    allowText: false,
  },
];

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photoUrl: string | null;
  location: string | null;
  socialLinks: Record<string, string> | null;
  insurances: string[] | null;
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
  }, [step, showResults]);

  const handleChip = (value: string) => {
    const currentStep = STEPS[step];
    const newAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 300);
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
      if (ans.specialty && ans.specialty !== 'Cualquier especialidad') {
        params.set('specialty', ans.specialty);
      }
      if (ans.insurance && ans.insurance !== 'No tengo seguro' && ans.insurance !== 'Otro') {
        params.set('insurance', ans.insurance);
      }
      const res = await fetch(`/api/directory?${params.toString()}`);
      if (res.ok) setDoctors(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setShowResults(true);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setTextInput('');
    setDoctors([]);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-black">Directorio Galenus</span>
          </div>
          {showResults && (
            <button onClick={restart} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Nueva búsqueda
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Intro message (always visible) */}
        <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm max-w-sm">
            <p className="text-black font-bold">¡Hola! Soy el asistente de Galenus.</p>
            <p className="text-black/60 text-sm font-medium mt-1">Te ayudaré a encontrar el médico ideal. Solo responde unas preguntas rápidas.</p>
          </div>
        </div>

        {/* Conversation steps */}
        {STEPS.slice(0, step + 1).map((s, idx) => (
          <div key={s.id} className="flex flex-col gap-3" style={{ animationDelay: `${idx * 100}ms` }}>
            {/* Bot question bubble */}
            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                <p className="text-black font-bold">{s.question}</p>
              </div>
            </div>

            {/* User answer bubble (already answered) */}
            {answers[s.id] && (
              <div className="flex justify-end animate-in fade-in duration-300">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-5 py-3 shadow-sm max-w-xs">
                  <p className="font-bold text-sm">{answers[s.id]}</p>
                </div>
              </div>
            )}

            {/* Input for current step */}
            {idx === step && !answers[s.id] && !showResults && (
              <div className="flex flex-col gap-3 pl-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-wrap gap-2">
                  {s.chips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      className="px-4 py-2.5 bg-white border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 text-black font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
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
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                <p className="text-black font-bold">
                  {doctors.length > 0
                    ? `Encontré ${doctors.length} médico${doctors.length !== 1 ? 's' : ''} que puede${doctors.length !== 1 ? 'n' : ''} ayudarte:`
                    : 'No encontré médicos con esos criterios aún. ¡Pronto habrá más especialistas disponibles!'}
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

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function DoctorCard({ doctor, delay }: { doctor: Doctor; delay: number }) {
  const social = doctor.socialLinks || {};

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-3 duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-black text-base truncate">{doctor.name}</h3>
          {doctor.specialty && (
            <p className="text-sm font-bold text-blue-600 truncate">{doctor.specialty}</p>
          )}
          {doctor.subaccount?.name && (
            <p className="text-xs font-medium text-gray-400 truncate">{doctor.subaccount.name}</p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-4 line-clamp-2">{doctor.bio}</p>
      )}

      <div className="space-y-1.5 mb-4">
        {doctor.location && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.location}</span>
          </div>
        )}
        {doctor.insurances && doctor.insurances.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs font-bold text-gray-500">
            <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{doctor.insurances.slice(0, 3).join(', ')}{doctor.insurances.length > 3 ? '...' : ''}</span>
          </div>
        )}
      </div>

      {/* Social links */}
      {Object.keys(social).length > 0 && (
        <div className="flex gap-2 mb-4">
          {social.whatsapp && (
            <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-green-50 rounded-lg text-green-600 hover:bg-green-100 transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {social.instagram && (
            <a href={`https://instagram.com/${social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-pink-50 rounded-lg text-pink-600 hover:bg-pink-100 transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
          )}
          {social.linkedin && (
            <a href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {social.website && (
            <a href={social.website} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <Link
        href={`/directorio/${doctor.id}`}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        Ver perfil completo <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
