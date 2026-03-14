'use client';

import { Terminal, Code, Webhook, FileJson } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Webhook className="w-6 h-6 text-blue-600" />
          Webhooks y Automatización (n8n API)
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Usa estos endpoints para conectar tu aplicación con n8n, Make o chatbots (ej. WhatsApp).
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-6">
            Todos los recursos se listan bajo la ruta base de tu servidor: <code>https://my-funnel-proyecto-36.d3xtpr.easypanel.host</code>.
            <br />
            <strong>IMPORTANTE:</strong> Estas APIs utilizan el número de teléfono (<code>phone</code>) como identificador principal para facilitar flujos de mensajería externa sin requerir IDs de base de datos complejos.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-gray-500" /> 1. Obtención de Catálogos (GET)
          </h3>
          
          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/patients
              </h4>
              <p className="text-sm text-gray-600">Retorna la lista de pacientes. Puedes filtrar usando <code>?phone=1234567890</code> para buscar un paciente específico.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/services
              </h4>
              <p className="text-sm text-gray-600">Retorna tu catálogo de servicios activos para que en n8n conozcas qué <code>serviceId</code> enviar en las reservaciones.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/availability
              </h4>
              <p className="text-sm text-gray-600">Retorna los horarios <strong>ocupados</strong>. Opcionalmente acepta <code>?date=YYYY-MM-DD</code>.</p>
            </div>
          </div>


          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2 mt-8">
            <Terminal className="w-5 h-5 text-gray-500" /> 2. Gestión de Citas (POST/PUT)
          </h3>

          <div className="space-y-6">
            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">POST</span>
                /api/n8n/patients
              </h4>
              <p className="text-sm text-gray-600 mb-3">Crea un nuevo paciente de forma directa en el catálogo (ideal antes de agendar o tras enviar un formulario inicial).</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "fullName": "Maria Lopez",
  "phone": "5559876543",
  "email": "maria@ejemplo.com", // opcional
  "notes": "Paciente referida" // opcional
}`}
              </pre>
            </div>

            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">POST</span>
                /api/n8n/appointments/book
              </h4>
              <p className="text-sm text-gray-600 mb-3">Programa una nueva cita. Si el <code>phone</code> no existe, el paciente será pre-registrado automáticamente.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "phone": "5551234567",         
  "fullName": "Juan Perez",    
  "serviceId": "ID_DEL_SERVICIO",  
  "startTime": "2024-05-15T10:00:00.000Z",
  "notes": "Agendado vía WhatsApp"
}`}
              </pre>
            </div>

            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">PUT</span>
                /api/n8n/appointments/reschedule
              </h4>
              <p className="text-sm text-gray-600 mb-3">Re-asigna el horario de una cita basada en la hora anterior y el teléfono del usuario.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "phone": "5551234567",
  "oldStartTime": "2024-05-15T10:00:00.000Z",
  "newStartTime": "2024-05-16T15:30:00.000Z"
}`}
              </pre>
            </div>

            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">POST</span>
                /api/n8n/appointments/cancel
              </h4>
              <p className="text-sm text-gray-600 mb-3">Cancela una cita basándose en la fecha/hora en la que iba a ocurrir.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`{
  "phone": "5551234567",
  "startTime": "2024-05-16T15:30:00.000Z"
}`}
              </pre>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
