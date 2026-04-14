import Link from 'next/link';
import {
  Calendar,
  Users,
  Bell,
  Building2,
  Zap,
  BarChart2,
  ArrowRight,
  Stethoscope,
  CheckCircle,
  Star,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Galenus AI — La Plataforma Médica más Inteligente',
  description:
    'Gestiona tu clínica con inteligencia artificial. Agenda, pacientes, notificaciones automáticas, multi-sede y reportes en tiempo real.',
};

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description:
      'Gestiona citas con detección automática de conflictos, reprogramaciones y recordatorios sin esfuerzo.',
  },
  {
    icon: Users,
    title: 'Gestión de Pacientes',
    description:
      'Historial clínico completo, búsqueda instantánea y seguimiento personalizado de cada paciente.',
  },
  {
    icon: Bell,
    title: 'Notificaciones Automáticas',
    description:
      'Confirmaciones y recordatorios por correo electrónico para reducir las inasistencias a cero.',
  },
  {
    icon: Building2,
    title: 'Multi-sede',
    description:
      'Administra todas tus sucursales, médicos y calendarios desde un único panel centralizado.',
  },
  {
    icon: Zap,
    title: 'IA Integrada',
    description:
      'Asistente inteligente para consultas rápidas, análisis de datos y soporte operativo 24/7.',
  },
  {
    icon: BarChart2,
    title: 'Panel de Reportes',
    description:
      'Métricas de ingresos, ocupación y rendimiento en tiempo real para tomar mejores decisiones.',
  },
];

const testimonials = [
  {
    quote:
      'Redujimos el tiempo de gestión de citas en un 45%. Nuestros médicos ahora se enfocan en los pacientes, no en el papeleo.',
    name: 'Dra. Ana Rodríguez',
    clinic: 'Clínica Santa María',
    specialty: 'Medicina General',
  },
  {
    quote:
      'Los ingresos crecieron un 30% en los primeros 3 meses. La automatización de cobros y recordatorios marcó la diferencia.',
    name: 'Dr. Carlos Méndez',
    clinic: 'Centro Médico Integral',
    specialty: 'Cardiología',
  },
  {
    quote:
      'Gestionar 4 sedes desde un solo lugar era impensable antes de Galenus AI. Ahora es nuestra realidad diaria.',
    name: 'Dra. María González',
    clinic: 'Policlínica Salud Total',
    specialty: 'Gerencia Médica',
  },
];

const stats = [
  { value: '500+', label: 'Clínicas activas' },
  { value: '98%', label: 'Satisfacción de clientes' },
  { value: '40%', label: 'Menos tiempo administrativo' },
  { value: '30%', label: 'Aumento promedio de ingresos' },
];

const benefits = [
  'Sin contratos a largo plazo',
  'Configuración en menos de 10 minutos',
  'Soporte incluido en todos los planes',
  'Datos 100% seguros y privados',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base italic shadow-md shadow-blue-500/30">
                G
              </div>
              <span className="font-black text-gray-900 tracking-tight text-lg">
                Galenus <span className="text-blue-600">AI</span>
              </span>
            </div>

            {/* Nav links — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Características
              </a>
              <a href="#testimonios" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Casos de Éxito
              </a>
              <a href="#cta" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Precios
              </a>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
              >
                Iniciar sesión
              </Link>
              <a
                href="https://wa.link/bc4253"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
              >
                Comenzar ya
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-200">
            <Zap className="w-3.5 h-3.5" />
            IA Médica de próxima generación
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            La plataforma médica más{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              inteligente
            </span>{' '}
            para tu clínica
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Reduce un <strong className="text-gray-900">40% el tiempo administrativo</strong>, mejora la satisfacción
            de tus pacientes y haz crecer tus ingresos con automatización e inteligencia artificial.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.link/bc4253"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/30 hover:scale-105 duration-200"
            >
              Comenzar ya
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-base font-semibold text-gray-700 hover:text-blue-600 px-6 py-4 rounded-2xl hover:bg-white/60 transition-all"
            >
              Ver características
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {b}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white shadow-sm">
                <p className="text-3xl font-black text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Todo lo que necesita tu clínica
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Una plataforma completa diseñada por y para profesionales de la salud.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <f.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BANNER ── */}
      <section className="py-14 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <p className="text-2xl font-black">¿Por qué elegir Galenus AI?</p>
              <p className="text-blue-100 mt-1">La plataforma más completa para gestión clínica en Latinoamérica.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { icon: Shield, label: 'Datos seguros', sub: 'Cifrado de extremo a extremo' },
                { icon: Clock, label: 'Siempre disponible', sub: '99.9% de uptime garantizado' },
                { icon: TrendingUp, label: 'ROI comprobado', sub: '+30% de ingresos promedio' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-xs text-blue-100">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonios" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
              Casos de Éxito
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Clínicas que ya transformaron su gestión
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Resultados reales de profesionales que confiaron en Galenus AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <blockquote className="text-gray-700 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.split(' ').slice(-1)[0].charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-blue-600 font-medium">{t.clinic}</p>
                    <p className="text-xs text-gray-400">{t.specialty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="cta" className="py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl mb-6">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            ¿Listo para transformar tu clínica?
          </h2>
          <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto">
            Únete a más de <strong className="text-white">500 clínicas</strong> que ya gestionan su práctica con
            inteligencia artificial. Sin tarjeta de crédito, sin complicaciones.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.link/bc4253"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-700 text-base font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:scale-105 duration-200"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="mailto:hola@galenusai.com"
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-200 hover:text-white px-6 py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              ¿Tienes preguntas? Contáctanos
            </a>
          </div>

          {/* Mini trust row */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-sm text-blue-100">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm italic">
                G
              </div>
              <span className="font-black text-gray-900 tracking-tight">
                Galenus <span className="text-blue-600">AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              © 2026 Galenus AI. Todos los derechos reservados. Plataforma Inteligente de Gestión Médica.
            </p>
            <nav className="flex gap-5">
              <a href="/privacidad" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">
                Privacidad
              </a>
              <a href="/terminos" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">
                Términos
              </a>
              <a href="https://wa.link/bc4253" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">
                Contacto
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
