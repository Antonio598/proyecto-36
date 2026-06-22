'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Stethoscope, MapPin, Shield, Phone, Globe, Instagram, Linkedin, MessageCircle } from 'lucide-react';

export default function DoctorPublicPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/directory/${doctorId}`)
      .then(r => r.ok ? r.json() : Promise.reject('No encontrado'))
      .then(setDoctor)
      .catch(e => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, [doctorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 max-w-sm w-full">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-black text-black text-lg mb-2">Médico no encontrado</h2>
          <p className="text-gray-500 text-sm mb-6">Este perfil no está disponible en el directorio.</p>
          <Link href="/directorio" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al directorio
          </Link>
        </div>
      </div>
    );
  }

  const social = doctor.socialLinks || {};
  const ins: string[] = doctor.insurances || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/directorio" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <span className="font-black text-black">Perfil del Médico</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                {doctor.photoUrl ? (
                  <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-black text-black">{doctor.name}</h1>
                {doctor.specialty && (
                  <p className="text-blue-600 font-bold text-sm">{doctor.specialty}</p>
                )}
                {doctor.subaccount?.name && (
                  <p className="text-gray-400 text-xs font-medium">{doctor.subaccount.name}</p>
                )}
              </div>
            </div>

            {doctor.bio && (
              <p className="text-gray-600 text-sm font-medium leading-relaxed">{doctor.bio}</p>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctor.location && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Ubicación</span>
              </div>
              <p className="text-sm font-bold text-black">{doctor.location}</p>
            </div>
          )}

          {ins.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Aseguradoras</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ins.map((i, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social + contact */}
        {Object.keys(social).length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">Contacto y redes</span>
            <div className="flex flex-col gap-2">
              {social.whatsapp && (
                <a
                  href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-green-700 font-bold text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp: {social.whatsapp}
                </a>
              )}
              {social.instagram && (
                <a
                  href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-pink-700 font-bold text-sm"
                >
                  <Instagram className="w-4 h-4" /> {social.instagram}
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-blue-700 font-bold text-sm"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {social.website && (
                <a
                  href={social.website}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 font-bold text-sm"
                >
                  <Globe className="w-4 h-4" /> {social.website}
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        {social.whatsapp ? (
          <a
            href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}?text=Hola%2C%20quisiera%20agendar%20una%20cita%20con%20el%20Dr.%20${encodeURIComponent(doctor.name)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-base transition-all shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-5 h-5" /> Agendar cita por WhatsApp
          </a>
        ) : (
          <Link
            href="/directorio"
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl text-base shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al directorio
          </Link>
        )}
      </div>
    </div>
  );
}
