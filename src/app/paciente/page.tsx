import Link from 'next/link';
import { Stethoscope, Calendar, FileText, BookOpen, Video, ArrowRight } from 'lucide-react';

export default function PacienteLanding() {
  return (
    <>
      <style>{`
        @keyframes float-orb {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(50px,-35px) scale(1.08)}
          66%{transform:translate(-25px,25px) scale(0.93)}
        }
        @keyframes slide-up {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes glow-pulse {
          0%,100%{opacity:.5;transform:scale(1)}
          50%{opacity:1;transform:scale(1.12)}
        }
        .orb1{animation:float-orb 18s ease-in-out infinite}
        .orb2{animation:float-orb 22s ease-in-out infinite reverse;animation-delay:-8s}
        .orb3{animation:float-orb 16s ease-in-out infinite;animation-delay:-5s}
        .su1{animation:slide-up .6s ease-out both}
        .su2{animation:slide-up .6s .1s ease-out both}
        .su3{animation:slide-up .6s .2s ease-out both}
        .su4{animation:slide-up .6s .3s ease-out both}
        .su5{animation:slide-up .6s .4s ease-out both}
        .glow{animation:glow-pulse 3s ease-in-out infinite}
        .cta-primary{background:linear-gradient(135deg,#3b82f6,#6366f1);box-shadow:0 8px 32px rgba(59,130,246,.35);transition:box-shadow .2s,transform .2s}
        .cta-primary:hover{box-shadow:0 12px 40px rgba(59,130,246,.55);transform:translateY(-2px)}
        .cta-secondary{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);transition:background .2s,border-color .2s}
        .cta-secondary:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25)}
        .feat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);transition:background .2s,border-color .2s,transform .2s}
        .feat-card:hover{background:rgba(255,255,255,.07);border-color:rgba(34,211,238,.25);transform:translateY(-3px)}
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{ background: '#060612' }}>
        {/* Orbs */}
        <div className="orb1 absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ top: '-15rem', left: '-12rem', background: 'radial-gradient(circle,rgba(59,130,246,.28),transparent 70%)', filter: 'blur(90px)' }} />
        <div className="orb2 absolute w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ bottom: '0', right: '-10rem', background: 'radial-gradient(circle,rgba(139,92,246,.22),transparent 70%)', filter: 'blur(80px)' }} />
        <div className="orb3 absolute w-80 h-80 rounded-full pointer-events-none"
          style={{ top: '40%', right: '20%', background: 'radial-gradient(circle,rgba(6,182,212,.15),transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Header */}
        <header className="relative z-10 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg italic shadow-lg"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>G</div>
              <span className="font-black text-white text-lg">Galenus <span style={{ color: '#22d3ee' }}>AI</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/paciente/login"
                className="cta-secondary px-4 py-2 rounded-xl font-bold text-sm text-white/80">
                Iniciar sesión
              </Link>
              <Link href="/paciente/registro"
                className="cta-primary px-4 py-2 rounded-xl font-black text-sm text-white">
                Crear cuenta
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="su1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
            style={{ background: 'rgba(34,211,238,.08)', border: '1px solid rgba(34,211,238,.2)', color: '#22d3ee' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            Portal del Paciente
          </div>

          <h1 className="su2 text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Tu salud,<br />
            <span style={{ background: 'linear-gradient(135deg,#3b82f6,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              en tus manos
            </span>
          </h1>

          <p className="su3 text-white/50 text-lg font-medium max-w-xl mx-auto mb-10 leading-relaxed">
            Accede a tu historial médico, citas, recetas y exámenes desde cualquier lugar.
            Vincula tu número de teléfono y conecta con tu expediente.
          </p>

          <div className="su4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/paciente/registro"
              className="cta-primary flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-base">
              Crear mi cuenta <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/paciente/login"
              className="cta-secondary flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white/70 text-base">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
          <div className="su5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Stethoscope, color: '#22d3ee', bg: 'rgba(34,211,238,.1)', title: 'Vincula tu expediente', desc: 'Conecta tu número de teléfono con tu historial médico' },
              { icon: Calendar,    color: '#34d399', bg: 'rgba(52,211,153,.1)',  title: 'Tus citas',           desc: 'Ve el historial de citas pasadas y próximas' },
              { icon: FileText,    color: '#a78bfa', bg: 'rgba(167,139,250,.1)', title: 'Recetas médicas',     desc: 'Consulta tus medicamentos y dosificaciones' },
              { icon: BookOpen,    color: '#fb923c', bg: 'rgba(251,146,60,.1)',  title: 'Exámenes y archivos', desc: 'Accede a tus resultados e imágenes médicas' },
            ].map(({ icon: Icon, color, bg, title, desc }, i) => (
              <div key={i} className="feat-card rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-black text-white text-sm mb-1">{title}</h3>
                <p className="text-white/40 text-xs font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Directorio link */}
        <div className="relative z-10 text-center pb-12">
          <Link href="/directorio"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/30 hover:text-white/60 transition-colors">
            <Stethoscope className="w-4 h-4" />
            Ver directorio de médicos
          </Link>
        </div>
      </div>
    </>
  );
}
