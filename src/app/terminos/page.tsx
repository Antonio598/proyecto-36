export const metadata = {
  title: 'Términos y Condiciones — Galenus AI',
  description: 'Términos y condiciones de uso de la plataforma Galenus AI.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar mínimo */}
      <header className="border-b border-gray-100 py-4 px-6">
        <a href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm italic">G</div>
          <span className="font-black text-gray-900 tracking-tight">Galenus <span className="text-blue-600">AI</span></span>
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder o utilizar la plataforma Galenus AI, el usuario acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, debe abstenerse de utilizar el servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descripción del servicio</h2>
            <p>Galenus AI es una plataforma de software como servicio (SaaS) que ofrece herramientas de gestión médica, incluyendo agendamiento de citas, administración de pacientes, configuración de sedes, médicos y servicios, así como integración con agentes de inteligencia artificial para atención al paciente.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Uso permitido</h2>
            <p>El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y de acuerdo con la normativa vigente. Está prohibido:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Utilizar el servicio para actividades ilegales o fraudulentas.</li>
              <li>Intentar acceder sin autorización a sistemas o datos de otros usuarios.</li>
              <li>Reproducir, copiar, vender o revender cualquier parte del servicio sin autorización expresa.</li>
              <li>Introducir virus, malware u otro código dañino.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cuentas de usuario</h2>
            <p>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier actividad realizada desde su cuenta es responsabilidad del titular. En caso de acceso no autorizado, debe notificar a Galenus AI de inmediato a través de <a href="mailto:galenus17@gmail.com" className="text-blue-600 hover:underline">galenus17@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Propiedad intelectual</h2>
            <p>Todos los contenidos, diseños, logos, software y materiales de la plataforma son propiedad exclusiva de Galenus AI o de sus licenciantes. Queda prohibida su reproducción o distribución sin autorización previa por escrito.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Privacidad y datos</h2>
            <p>El tratamiento de datos personales se rige por nuestra <a href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</a>. Al utilizar el servicio, el usuario consiente el tratamiento de sus datos conforme a dicha política.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitación de responsabilidad</h2>
            <p>Galenus AI no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del servicio. La plataforma se ofrece "tal cual" y no garantiza que el servicio esté libre de errores o interrupciones.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Modificaciones del servicio</h2>
            <p>Galenus AI se reserva el derecho de modificar, suspender o descontinuar el servicio, o cualquier parte de él, en cualquier momento y sin previo aviso. También podrá actualizar estos Términos y Condiciones, notificando a los usuarios a través de la plataforma o por correo electrónico.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Terminación</h2>
            <p>Galenus AI podrá suspender o cancelar el acceso del usuario en caso de incumplimiento de estos términos, sin necesidad de previo aviso y sin responsabilidad de ningún tipo.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contacto</h2>
            <p>Para cualquier consulta relacionada con estos Términos y Condiciones, puede contactarnos a través de: <a href="mailto:galenus17@gmail.com" className="text-blue-600 hover:underline">galenus17@gmail.com</a>.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 Galenus AI — <a href="/privacidad" className="hover:text-blue-600">Privacidad</a> · <a href="/terminos" className="hover:text-blue-600">Términos</a>
      </footer>
    </div>
  );
}
