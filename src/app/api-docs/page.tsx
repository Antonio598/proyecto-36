'use client';

import { Terminal, Code, Webhook, FileJson, Key, Shield } from 'lucide-react';

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

          {/* ── AUTENTICACIÓN ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="text-base font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" /> Autenticación requerida — API Key
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Todas las llamadas a <code>/api/n8n/*</code> deben incluir el API Key de la cuenta en el header:
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-md text-sm overflow-x-auto">
{`// Header requerido en TODAS las peticiones:
x-api-key: TU_API_KEY_AQUI

// Ejemplo con curl:
curl -H "x-api-key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \\
     https://my-funnel-proyecto-36.d3xtpr.easypanel.host/api/n8n/subaccounts

// Ejemplo en n8n (HTTP Request node):
// Headers → Add Header:
//   Name:  x-api-key
//   Value: {{ $credentials.apiKey }}  (o pégalo directo)`}
            </pre>
            <p className="text-xs text-amber-600 mt-2">
              <Shield className="w-3 h-3 inline mr-1" />
              Encuentra tu API Key en el <strong>Dashboard Madre → columna "API Key"</strong>. Cada cuenta tiene una clave única.
            </p>
          </div>

          <p className="text-gray-600 mb-6">
            Todos los recursos se listan bajo la ruta base de tu servidor: <code>https://my-funnel-proyecto-36.d3xtpr.easypanel.host</code>.
            <br />
            <strong>IMPORTANTE:</strong> Estas APIs usan <code>phone</code> como identificador principal. Ahora incluyen soporte Multi-Cuenta / Multi-Sede / Multi-Calendario.
          </p>

          {/* ── CATÁLOGOS ── */}
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-gray-500" /> 1. Catálogos (GET)
          </h3>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/subaccounts
              </h4>
              <p className="text-sm text-gray-600">Retorna las Sedes (Clínicas) de tu cuenta. Solo muestra las sedes de la cuenta del API Key usado.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 mt-3 rounded-md text-sm overflow-x-auto">
{`// Headers:
x-api-key: TU_API_KEY

// Respuesta:
{
  "success": true,
  "data": [
    { "id": "e4b6b5...", "name": "Clínica Sede Central" }
  ]
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/services
              </h4>
              <p className="text-sm text-gray-600">Retorna servicios activos de tu cuenta. Opcional: <code>?subaccountId=X</code> o <code>?doctorId=Y</code>.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/calendars
              </h4>
              <p className="text-sm text-gray-600">Retorna calendarios, precios y duraciones para un servicio. Requerido: <code>?serviceId=ID</code>. Opcional: <code>?subaccountId=X</code>.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">GET</span>
                /api/n8n/availability
              </h4>
              <p className="text-sm text-gray-600">Retorna horarios <strong>ocupados</strong>. Acepta <code>?date=YYYY-MM-DD</code> y <code>?calendarId=X</code>, <code>?subaccountId=Y</code>, <code>?doctorId=Z</code>.</p>
            </div>
          </div>

          {/* ── GESTIÓN DE CITAS ── */}
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2 mt-8">
            <Terminal className="w-5 h-5 text-gray-500" /> 2. Gestión de Citas (POST/PUT)
          </h3>

          <div className="space-y-6">
            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">POST</span>
                /api/n8n/appointments/book
              </h4>
              <p className="text-sm text-gray-600 mb-3">Programa una nueva cita. La cuenta se identifica por el API Key — no hace falta pasar <code>accountId</code>.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`// Headers:
x-api-key: TU_API_KEY

// Body:
{
  "phone": "5551234567",
  "fullName": "Juan Perez",
  "serviceId": "ID_DEL_SERVICIO",
  "subaccountId": "ID_DE_LA_SEDE",
  "startTime": "2024-05-15T10:00:00.000Z",
  "calendarId": "OPCIONAL_CALENDARIO_ID"
}`}
              </pre>
            </div>

            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">PUT</span>
                /api/n8n/appointments/reschedule
              </h4>
              <p className="text-sm text-gray-600 mb-3">Re-asigna el horario de una cita.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`// Headers:
x-api-key: TU_API_KEY

// Body:
{
  "phone": "5551234567",
  "subaccountId": "ID_DE_LA_SEDE",
  "oldStartTime": "2024-05-15T10:00:00.000Z",
  "newStartTime": "2024-05-16T15:30:00.000Z",
  "newCalendarId": "OPCIONAL_NUEVO_CALENDARIO_ID"
}`}
              </pre>
            </div>

            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">POST</span>
                /api/n8n/appointments/cancel
              </h4>
              <p className="text-sm text-gray-600 mb-3">Cancela una cita.</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
{`// Headers:
x-api-key: TU_API_KEY

// Body:
{
  "phone": "5551234567",
  "subaccountId": "ID_DE_LA_SEDE",
  "startTime": "2024-05-16T15:30:00.000Z"
}`}
              </pre>
            </div>
          </div>

          {/* ── ERRORES COMUNES ── */}
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2 mt-8">
            <Code className="w-5 h-5 text-gray-500" /> 3. Errores comunes
          </h3>
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b pb-1">
                  <th className="pr-4 pb-2">Código</th>
                  <th className="pr-4 pb-2">Error</th>
                  <th className="pb-2">Solución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 font-mono text-red-600">401</td>
                  <td className="py-2 pr-4">Invalid or missing API key</td>
                  <td className="py-2 text-gray-600">Agrega el header <code>x-api-key</code> con tu clave</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-red-600">404</td>
                  <td className="py-2 pr-4">Patient not found</td>
                  <td className="py-2 text-gray-600">El teléfono no existe en esta cuenta</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-red-600">409</td>
                  <td className="py-2 pr-4">Time slot already booked</td>
                  <td className="py-2 text-gray-600">El horario está ocupado, elige otro</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-red-600">400</td>
                  <td className="py-2 pr-4">Clínica cerrada este día</td>
                  <td className="py-2 text-gray-600">El día no tiene horario configurado en Ajustes</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
