# Guía de Integración API n8n (Webhooks)

Esta API fue diseñada específicamente para ser conectada mediante **n8n**, Make o sistemas externos. Todos los recursos se listan bajo la ruta `/api/n8n/*`.

**URL Base Local**: `http://localhost:3000` (Deberás exponerla con ngrok/localtunnel si usas n8n cloud, o usar la URL de tu servidor de producción).

---

## 1. Obtención de Catálogos (GET)

En n8n usa el nodo **HTTP Request** con método `GET`.

### 1.1 Obtener Sedes (Subaccounts)
`GET /api/n8n/subaccounts`
- Retornará la lista completa de Sedes activas (Clínicas) y sus IDs. 
- **El `subaccountId` es requerido** para agendar, cancelar y reagendar citas y mantener el orden por sucursal.

### 1.2 Obtener Pacientes
`GET /api/n8n/patients`
- Retornará la lista completa de pacientes.
- **Búsqueda específica:** `GET /api/n8n/patients?phone=1234567890`

### 1.2 Obtener Servicios Activos
`GET /api/n8n/services`
- Retornará tu catálogo de servicios activos para que en n8n sepas qué IDs usar al agendar.
- Opcionalmente puedes filtrar enviando `?subaccountId=X` o `?doctorId=Y`.

### 1.3 Obtener Calendarios Disponibles por Servicio (NUEVO)
`GET /api/n8n/calendars?serviceId=ID_DEL_SERVICIO`
- Retorna los calendarios habilitados para brindar el servicio, junto con sus precios y duraciones dinámicas.
- Acepta opcionalmente `&subaccountId=X` para filtrar por sede.

### 1.4 Obtener Disponibilidad
`GET /api/n8n/availability`
- Por defecto devuelve 30 días de bloques horarios ocupados. 
- Puedes acotar por día: `?date=2024-12-01`.
- Para una sede o médico específico: `?subaccountId=X&doctorId=Y&calendarId=Z`.

### 1.5 Listar Citas Agendadas (NUEVO)
`GET /api/n8n/appointments`
- Retorna la lista de citas filtradas por los parámetros enviados.
- **Parámetros opcionales:**
    - `subaccountId=ID`: Filtrar por clínica/sede.
    - `calendarId=ID`: Filtrar por médico/calendario específico.
    - `doctorId=ID`: Filtrar por médico asignado.
    - `serviceId=ID`: Filtrar por tipo de servicio.
    - `phone=TEL`: Filtrar por teléfono{
// Parámetros opcionales:
// ?phone=TEL &date=YYYY-MM-DD &status=CONFIRMED &limit=50
// ?subaccountId=ID &calendarId=ID &doctorId=ID &serviceId=ID
// ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
}: Citas en un rango de fechas.
    - `status=ESTADO`: Filtrar por estado (PENDING, CONFIRMED, CANCELLED, COMPLETED). Por defecto excluye CANCELLED.
    - `limit=N`: Cantidad de resultados (máx 100, defecto 50).
- **Ejemplo:** `GET /api/n8n/appointments?date=2024-05-15&status=CONFIRMED`

---

## 2. Acciones de Citas (Agendar, Reagendar, Cancelar)

En n8n usa el nodo **HTTP Request** (método POST o PUT según indique). Formato cuerpo: `JSON`.

> [!IMPORTANT]
> El sistema utiliza el **Teléfono (`phone`)** como identificador principal. No se aceptan letras. Si un paciente no existe, se registra automáticamente.

### 2.1 Crear o Actualizar Paciente (Upsert)
`POST /api/n8n/patients`
```json
{
  "fullName": "Juan Perez",
  "phone": "5551234567",
  "cedula_pasaporte": "1234567-89",
  "edad": 35,
  "email": "juan@ejemplo.com",
  "notes": "Agendado vía n8n"
}
```

### 2.2 Agendar (Reservar)
`POST /api/n8n/appointments/book`
```json
{
  "phone": "5551234567",         
  "fullName": "Juan Perez",    
  "serviceId": "ID_DEL_SERVICIO",
  "subaccountId": "ID_DE_LA_SEDE",  
  "startTime": "2024-05-15T10:00:00.000Z",
  "calendarId": "OPCIONAL_ID",
  "doctorId": "OPCIONAL_ID",
  "notes": "Agendado vía WhatsApp Bot"
}
```
**Comportamiento**: 
- Si envías `calendarId`, el sistema usará el precio y duración designados para ese calendario. La validación de empalme se limita a ese calendario.
- Si omites `calendarId`, usa los valores fijos por defecto del catálogo de servicios de toda la vida.

### 2.3 Reagendar 
`PUT /api/n8n/appointments/reschedule`
```json
{
  "phone": "5551234567",
  "subaccountId": "ID_DE_LA_SEDE",
  "oldStartTime": "2024-05-15T10:00:00.000Z",
  "newStartTime": "2024-05-16T15:30:00.000Z",
  "newCalendarId": "OPCIONAL_ID"
}
```
**Comportamiento**: 
- Si cambias `newCalendarId`, la duración de la cita es automáticamente recalculada basada en las métricas de este nuevo calendario.

### 2.4 Cancelar
`POST /api/n8n/appointments/cancel`
```json
{
  "phone": "5551234567",
  "subaccountId": "ID_DE_LA_SEDE",
  "startTime": "2024-05-16T15:30:00.000Z"
}
```
