import Link from 'next/link';
import {
  ArrowRight,
  MessageCircle,
  Calendar,
  Users,
  Building2,
  Clock,
  Settings,
  Zap,
  CheckCircle,
  ChevronDown,
  Star,
  Shield,
  BarChart2,
  Phone,
} from 'lucide-react';

export const metadata = {
  title: 'Galenus AI — Agente de IA y plataforma de gestión para clínicas',
  description:
    'Contrata tu agente de IA y organiza la atención de tu práctica médica en una sola plataforma. Para clínicas, consultorios y especialistas.',
};

const WA_LINK = 'https://wa.link/bc4253';

const agentCapabilities = [
  {
    title: 'Responder preguntas frecuentes',
    items: ['Servicios y precios', 'Sedes y médicos disponibles', 'Horarios y disponibilidad', 'Requisitos previos y tipos de atención'],
  },
  {
    title: 'Guiar al paciente',
    items: ['Conducir la conversación según la necesidad', 'Orientar hacia el servicio, sede o profesional correcto'],
  },
  {
    title: 'Apoyar el agendamiento',
    items: ['Acompañar el proceso de cita', 'Basar la disponibilidad en reglas configuradas'],
  },
  {
    title: 'Ayudar con reagendamientos',
    items: ['Asistir cuando un paciente necesita mover su cita', 'Ofrecer nuevas opciones según la agenda disponible'],
  },
  {
    title: 'Escalar casos especiales',
    items: ['Dirigir al paciente cuando se requiere intervención del equipo'],
  },
  {
    title: 'Operar en varios canales',
    items: ['WhatsApp', 'Instagram', 'Facebook', 'Sitio web'],
  },
];

const platformFeatures = [
  { icon: Calendar, title: 'Gestión de agenda', desc: 'Visualiza y administra la agenda con estructura clara según sede, médico y servicio.' },
  { icon: Clock, title: 'Configuración de horarios', desc: 'Define horarios de atención por médico, por sede o por tipo de servicio.' },
  { icon: Shield, title: 'Bloqueo de horarios', desc: 'Bloquea espacios no disponibles para que no sean ofrecidos por error.' },
  { icon: Settings, title: 'Servicios y precios', desc: 'Agrega, edita y organiza servicios. Configura precios con variaciones por sede.' },
  { icon: Users, title: 'Médicos y especialistas', desc: 'Agrega médicos, asígnalos a servicios y define en qué sedes atienden.' },
  { icon: Building2, title: 'Sedes', desc: 'Crea y administra distintas sedes, organizando la información relevante de cada una.' },
];

const benefits = [
  { title: 'Menos carga operativa', desc: 'Tu equipo dedica menos tiempo a contestar preguntas repetitivas y puede enfocarse en tareas de mayor valor.' },
  { title: 'Más orden en la agenda', desc: 'La disponibilidad, los horarios y los bloqueos se gestionan desde una plataforma central.' },
  { title: 'Información más consistente', desc: 'Servicios, precios, sedes y médicos se muestran con una lógica uniforme y controlada.' },
  { title: 'Mejor experiencia para el paciente', desc: 'La primera interacción se vuelve más clara, más rápida y más profesional.' },
  { title: 'Más capacidad para atender', desc: 'Puedes gestionar más conversaciones sin aumentar de inmediato la carga manual.' },
  { title: 'Más control sobre la operación', desc: 'Centralizas la lógica de atención, agenda y configuración en un mismo entorno.' },
];

const steps = [
  { n: '1', title: 'Entendemos tu operación', desc: 'Revisamos qué servicios ofreces, cuántas sedes manejas, qué médicos participan, cómo organizas la agenda y qué parte del proceso deseas automatizar.' },
  { n: '2', title: 'Configuramos tu agente y tu plataforma', desc: 'Diseñamos la lógica conversacional del agente y estructuramos la plataforma según tus necesidades operativas.' },
  { n: '3', title: 'Organizamos agenda, servicios y reglas', desc: 'Configuramos sedes, horarios, servicios, precios, médicos, bloqueos y criterios de disponibilidad para que el sistema funcione con coherencia.' },
  { n: '4', title: 'Tu solución comienza a operar', desc: 'Tu práctica cuenta con un agente de IA para atender pacientes y con una plataforma para mantener orden y control sobre la agenda y la información.' },
];

const idealFor = [
  'Clínicas multiespecialidad',
  'Consultorios médicos',
  'Médicos especialistas',
  'Prácticas privadas',
  'Centros de diagnóstico',
  'Equipos con varias sedes',
  'Organizaciones con alto volumen de mensajes',
  'Consultas que quieren crecer sin perder control',
];

const goodFitIf = [
  'Recibe muchos mensajes todos los días',
  'Repite constantemente la misma información',
  'Necesita ordenar la forma en que agenda',
  'Maneja varios médicos o varias sedes',
  'Quiere controlar horarios y bloqueos desde una sola plataforma',
  'Busca reducir errores en la atención inicial',
  'Quiere mejorar la experiencia del paciente',
  'Necesita crecer sin aumentar desorden',
];

const faqs = [
  { q: '¿Qué contrata realmente una clínica con Galenus?', a: 'Contrata una solución compuesta por un agente de IA para atención y agendamiento, junto con una plataforma para gestionar agenda, horarios, servicios, médicos, sedes y reglas operativas.' },
  { q: '¿Es solo un chatbot?', a: 'No. El agente es solo una parte de la solución. Galenus también incluye una plataforma para organizar la operación que alimenta esa atención.' },
  { q: '¿La plataforma permite ver y administrar la agenda?', a: 'Sí. La plataforma permite gestionar la agenda y organizar la disponibilidad según la estructura de la práctica.' },
  { q: '¿Se pueden configurar horarios y bloquear espacios?', a: 'Sí. Puedes definir horarios y bloquear tiempos para que no sean ofrecidos como disponibles.' },
  { q: '¿Se pueden agregar servicios y precios?', a: 'Sí. Puedes configurar servicios y precios desde la plataforma.' },
  { q: '¿Se pueden agregar médicos y sedes?', a: 'Sí. La plataforma permite administrar médicos, especialistas y sedes, así como su relación con servicios y agenda.' },
  { q: '¿El agente puede responder con base en esa configuración?', a: 'Sí. Esa es precisamente una de las fortalezas de la solución: el agente opera con la información configurada dentro de la plataforma.' },
  { q: '¿Sirve solo para clínicas grandes?', a: 'No. También es útil para consultorios médicos, especialistas y prácticas privadas que quieren atender mejor y organizar su agenda con más control.' },
  { q: '¿En qué canales puede funcionar?', a: 'Puede operar en WhatsApp, Instagram, Facebook y web, según la solución contratada.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base italic shadow-md shadow-blue-500/30">
                G
              </div>
              <span className="font-black text-gray-900 tracking-tight text-lg">
                Galenus <span className="text-blue-600">AI</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#agente" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">Agente IA</a>
              <a href="#plataforma" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">Plataforma</a>
              <a href="#como-funciona" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">Cómo funciona</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50">
                Iniciar sesión
              </Link>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25">
                Hablar con un asesor
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-200">
            <Zap className="w-3.5 h-3.5" />
            Agente de IA para el entorno médico
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Contrata tu agente de IA y organiza la atención de tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              práctica médica
            </span>{' '}
            en una sola plataforma
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Galenus ayuda a clínicas, consultorios médicos y especialistas a automatizar la atención
            y el agendamiento de pacientes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/30 hover:scale-105 duration-200">
              Hablar con un asesor
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#agente" className="inline-flex items-center gap-2 text-base font-semibold text-gray-600 hover:text-blue-600 px-6 py-4 rounded-2xl hover:bg-white/60 transition-all">
              Conocer más <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Una mejor atención no depende solo de responder mensajes
            </h2>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <p className="text-gray-700 leading-relaxed mb-5">
              La atención al paciente empieza mucho antes de la consulta. Empieza cuando alguien pregunta por una cita, consulta un precio, quiere saber qué especialista lo atiende o intenta encontrar disponibilidad. Cuando esa conversación depende por completo de procesos manuales, la operación se vuelve más lenta, más pesada y más propensa a errores.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Galenus resuelve ese problema con una solución integral: un <strong className="text-gray-900">agente de IA que conversa con pacientes</strong> y una <strong className="text-gray-900">plataforma que te permite organizar la lógica de tu práctica</strong> desde un solo lugar.
            </p>
          </div>
        </div>
      </section>

      {/* ── AGENTE ── */}
      <section id="agente" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Agente de IA</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Contrata un agente de IA configurado para tu clínica, consultorio o especialidad
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Galenus no es un chatbot genérico. Es una solución pensada para el entorno médico, donde cada detalle de la atención importa. Tu agente de IA puede configurarse para responder según los servicios, sedes, médicos, horarios, disponibilidad, precios y criterios operativos definidos por tu práctica.
            </p>
            <p className="mt-4 text-gray-600">
              El objetivo no es solo automatizar respuestas. Es ayudarte a <strong className="text-gray-900">atender mejor, orientar mejor y convertir más conversaciones en citas reales.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agentCapabilities.map((cap) => (
              <div key={cap.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{cap.title}</h3>
                <ul className="space-y-1.5">
                  {cap.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Channels */}
          <div className="mt-10 bg-blue-600 rounded-2xl p-6 text-white text-center">
            <p className="font-bold text-lg mb-3">Canales disponibles</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['WhatsApp', 'Instagram', 'Facebook', 'Sitio web'].map((ch) => (
                <span key={ch} className="bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATAFORMA ── */}
      <section id="plataforma" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Plataforma</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Mucho más que un agente: una plataforma para gestionar tu operación
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Con Galenus no solo contratas un agente de IA. También cuentas con una plataforma desde la que puedes administrar la estructura de atención y agenda de tu práctica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformFeatures.map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Additional platform items list */}
          <div className="mt-10 bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <p className="font-semibold text-gray-900 mb-4">Desde la plataforma también puedes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Organizar disponibilidad por especialista',
                'Definir qué servicios se ofrecen en cada sede',
                'Ajustar reglas de atención',
                'Mantener actualizada la información que el agente utiliza',
                'Visualizar la agenda completa de tu práctica',
                'Controlar bloqueos y horarios desde un solo lugar',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Para quién</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-6">
                Una solución diseñada para clínicas, consultorios médicos y especialistas
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                La solución está pensada para organizaciones y profesionales que necesitan responder con mayor rapidez, ordenar su agenda, reducir carga operativa y estructurar mejor la información de servicios.
              </p>
              <div className="space-y-2">
                {idealFor.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Tiene sentido si tu práctica:</p>
              <div className="space-y-3">
                {goodFitIf.map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALOR: ORDENAR NO SOLO AUTOMATIZAR ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              El valor no está solo en automatizar, sino en ordenar
            </h2>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              Muchas clínicas ya reciben mensajes por varios canales, pero eso no significa que tengan una atención organizada. El verdadero problema suele estar en la falta de estructura:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Respuestas distintas según quién atienda',
                'Información desactualizada',
                'Dificultad para manejar varias sedes',
                'Errores en precios o servicios',
                'Tiempos bloqueados que se ofrecen por error',
                'Pacientes que no avanzan en la conversación',
              ].map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-amber-900">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
            <p className="text-gray-700 mt-5 font-medium">
              Galenus ayuda a resolver todo eso con una combinación de <strong>automatización y control operativo.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-300 uppercase tracking-widest mb-3">Beneficios</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Beneficios de contratar tu agente de IA con Galenus
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Star className="w-5 h-5 text-amber-300 mb-3" />
                <h3 className="font-bold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-blue-100 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONFIGURACIÓN ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Diseñado según la lógica real de tu práctica
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Cada clínica, consultorio o especialista tiene una manera distinta de trabajar. Por eso Galenus permite configurar la solución según tu operación real.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Servicios por sede', 'Precios por servicio', 'Médicos por ubicación',
              'Horarios de atención', 'Disponibilidad real', 'Espacios bloqueados',
              'Criterios de agenda', 'Derivaciones', 'Necesidades administrativas específicas',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 text-sm font-medium text-blue-800 border border-blue-100">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-600">
            Eso hace posible que el agente converse con contexto real y que la plataforma refleje el funcionamiento verdadero de la práctica.
          </p>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Cómo funciona</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((step) => (
              <div key={step.n} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-4">
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            La primera conversación también forma parte de la calidad del servicio
          </h2>
          <p className="mt-6 text-lg text-blue-100 leading-relaxed">
            Antes de la consulta, antes del procedimiento y antes de la atención presencial, existe un momento clave: el primer contacto. Si ese contacto es lento, confuso o desordenado, la experiencia del paciente ya empieza debilitada.
          </p>
          <p className="mt-4 text-blue-100 leading-relaxed">
            Galenus te ayuda a construir ese primer contacto con más estructura, más capacidad de respuesta y más control sobre la operación.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-700 text-base font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:scale-105 duration-200">
              Hablar con un asesor
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <p className="mt-8 text-sm text-blue-200">
            Si quieres conocer cómo un agente de IA y una plataforma de agenda pueden adaptarse a tu clínica, consultorio o especialidad, nuestro equipo puede orientarte.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
              © 2026 Galenus AI. Todos los derechos reservados.
            </p>
            <nav className="flex gap-5">
              <a href="/privacidad" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">Privacidad</a>
              <a href="/terminos" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">Términos</a>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">Contacto</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
