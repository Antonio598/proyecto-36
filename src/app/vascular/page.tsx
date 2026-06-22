import Link from 'next/link';
import { Activity, Heart, ArrowRight, MapPin, Phone, Clock, CheckCircle, Stethoscope, ChevronRight } from 'lucide-react';

const SERVICES = [
  { icon: '🩸', title: 'Varices y Venas Varicosas', desc: 'Diagnóstico y tratamiento con técnicas mínimamente invasivas: escleroterapia, láser endovenoso y EVLT.' },
  { icon: '🔬', title: 'Ecografía Doppler Vascular', desc: 'Estudio diagnóstico de arterias y venas de miembros inferiores, cuello y abdomen.' },
  { icon: '🫀', title: 'Arteriopatía Periférica', desc: 'Evaluación y tratamiento de la enfermedad arterial periférica, angioplastia y revascularización.' },
  { icon: '🩹', title: 'Pie Diabético', desc: 'Manejo integral del pie diabético con enfoque multidisciplinario para preservar la extremidad.' },
  { icon: '💉', title: 'Trombosis Venosa Profunda', desc: 'Diagnóstico precoz y tratamiento anticoagulante personalizado para TVP y embolia pulmonar.' },
  { icon: '🏥', title: 'Cirugía Vascular Abierta', desc: 'Procedimientos de revascularización, bypass arterial y cirugía de aneurismas de aorta.' },
];

const TEAM_HIGHLIGHTS = [
  { stat: '15+', label: 'Años de experiencia' },
  { stat: '3,000+', label: 'Pacientes atendidos' },
  { stat: '98%', label: 'Tasa de satisfacción' },
  { stat: '2', label: 'Sedes disponibles' },
];

export default function VascularLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-900 to-cyan-600 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-blue-900 text-lg leading-none block">Clínica Vascular</span>
              <span className="text-xs font-bold text-cyan-600 leading-none">Especialistas en salud vascular</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#servicios" className="text-sm font-bold text-gray-600 hover:text-blue-900 transition-colors">Servicios</a>
            <a href="#equipo" className="text-sm font-bold text-gray-600 hover:text-blue-900 transition-colors">Equipo</a>
            <a href="#ubicacion" className="text-sm font-bold text-gray-600 hover:text-blue-900 transition-colors">Ubicación</a>
            <Link href="/directorio" className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors">
              Buscar Médico <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-800 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Heart className="w-3.5 h-3.5" /> Especialistas en Cirugía Vascular
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Tu salud vascular<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                en manos expertas
              </span>
            </h1>
            <p className="text-blue-100/80 text-lg font-medium leading-relaxed mb-8">
              Diagnóstico preciso y tratamiento avanzado de enfermedades vasculares.
              Atendemos varices, arteriopatías, trombosis, pie diabético y más.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/directorio"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-blue-950 font-black rounded-2xl transition-all shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5"
              >
                Buscar Médico <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#servicios"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl transition-all"
              >
                Ver Servicios
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {TEAM_HIGHLIGHTS.map(item => (
              <div key={item.stat} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-cyan-300 mb-1">{item.stat}</div>
                <div className="text-blue-100/70 text-sm font-bold">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Lo que hacemos</span>
            <h2 className="text-3xl md:text-4xl font-black text-blue-950 mt-2 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">
              Ofrecemos atención integral en enfermedades vasculares con tecnología de punta y los más altos estándares de calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(service => (
              <div key={service.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="font-black text-blue-950 text-base mb-2 group-hover:text-blue-700 transition-colors">{service.title}</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Directory CTA */}
      <section id="equipo" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-blue-900 to-cyan-800 rounded-3xl p-10 md:p-16 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Stethoscope className="w-14 h-14 mx-auto mb-6 text-cyan-300" />
              <h2 className="text-3xl md:text-4xl font-black mb-4">Conoce a Nuestro Equipo</h2>
              <p className="text-blue-100/80 font-medium max-w-xl mx-auto mb-8">
                Cirujanos vasculares certificados con años de experiencia en los principales centros médicos del país. Busca al especialista ideal para ti.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/directorio"
                  className="flex items-center justify-center gap-2 px-7 py-4 bg-cyan-500 hover:bg-cyan-400 text-blue-950 font-black rounded-2xl transition-all shadow-xl"
                >
                  Ver Directorio de Médicos <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">¿Por qué elegirnos?</span>
            <h2 className="text-3xl md:text-4xl font-black text-blue-950 mt-2">Tu salud, nuestra prioridad</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Tecnología avanzada', desc: 'Equipos de diagnóstico de última generación para resultados precisos.' },
              { title: 'Atención personalizada', desc: 'Cada paciente recibe un plan de tratamiento adaptado a su caso específico.' },
              { title: 'Mínimamente invasivo', desc: 'Procedimientos endovasculares con menor tiempo de recuperación.' },
              { title: 'Seguimiento continuo', desc: 'Acompañamiento durante todo el proceso de diagnóstico y recuperación.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <CheckCircle className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className="font-black text-blue-950 text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section id="ubicacion" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Dónde estamos</span>
            <h2 className="text-3xl md:text-4xl font-black text-blue-950 mt-2">Nuestras Sedes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Sede Principal — Ciudad de Panamá',
                address: 'Torre Medical Center, Vía España, Piso 8',
                phone: '+507 269-0000',
                hours: 'Lunes a Viernes: 8:00am – 5:00pm',
              },
              {
                name: 'Sede Secundaria — San Miguelito',
                address: 'Clínica Santa Fé, Ave. Domingo Díaz',
                phone: '+507 269-1111',
                hours: 'Lunes, Miércoles y Viernes: 8:00am – 2:00pm',
              },
            ].map(sede => (
              <div key={sede.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-blue-950 text-base mb-4">{sede.name}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm font-medium text-gray-600">
                    <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <span>{sede.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Phone className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <a href={`tel:${sede.phone.replace(/\D/g, '')}`} className="hover:text-blue-700 transition-colors">{sede.phone}</a>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-medium text-gray-600">
                    <Clock className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <span>{sede.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-cyan-800 text-white text-center px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-4">¿Listo para tu consulta?</h2>
        <p className="text-blue-100/80 font-medium mb-8 max-w-md mx-auto">
          Agenda tu cita con nuestros especialistas y da el primer paso hacia una mejor salud vascular.
        </p>
        <Link
          href="/directorio"
          className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-blue-950 font-black rounded-2xl transition-all shadow-xl text-base"
        >
          Agendar cita ahora <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-blue-300 py-8 px-4 text-center">
        <p className="text-sm font-bold">© 2025 Clínica Vascular. Todos los derechos reservados.</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link href="/privacidad" className="text-xs hover:text-white transition-colors">Privacidad</Link>
          <Link href="/terminos" className="text-xs hover:text-white transition-colors">Términos</Link>
          <Link href="/directorio" className="text-xs hover:text-white transition-colors">Directorio</Link>
        </div>
      </footer>
    </div>
  );
}
