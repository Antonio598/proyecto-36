# Guía de Integración API n8n (Webhooks)

Esta API fue diseñada específicamente para ser conectada mediante **n8n**, Make o sistemas externos. Todos los recursos se listan bajo la ruta `/api/n8n/*`.

**URL Base Local**: `http://localhost:3000` (Deberás exponerla con ngrok/localtunnel si usas n8n cloud, o usar la URL de tu servidor de producción).


---

## 1. Obtención de Catálogos (GET)

En n8n usa el nodo **HTTP Request** con método `GET`.

### 1.1 Obtener Pacientes
`GET /api/n8n/patients`
- Retornará la lista completa de pacientes (ID, nombres, teléfonos).
- *Útil si deseas sincronizar bases de datos.*

**Búsqueda específica:** `GET /api/n8n/patients?phone=1234567890`
- Útil para verificar si un cliente en WhatsApp ya existe.

### 1.2 Obtener Servicios Activos
`GET /api/n8n/services`
- Retornará tu catálogo de servicios activos para que en n8n sepas qué IDs usar al agendar.

### 1.3 Obtener Disponibilidad
`GET /api/n8n/availability`
- Por defecto devuelve 30 días de bloques horarios ocupados. 
- Puedes acotarlo por día: `GET /api/n8n/availability?date=2024-12-01`.
- *Aviso: Devolverá las horas de inicio y fin de las reservaciones ocupadas.*

---

## 2. Acciones de Citas (Agendar, Reagendar, Cancelar)

En n8n usa el nodo **HTTP Request** (método POST o PUT según indique). Formato cuerpo: `JSON`.

> [!IMPORTANT]
> A diferencia del panel web donde requieres los `IDs` internos, **estas APIs fueron construidas usando el Teléfono (`phone`) como llave primaria temporal**. Así que si tu flujo en n8n empieza en WhatsApp, solo pasas el celular de origen al webhook.

### 2.1 Agendar (Reservar)
`POST /api/n8n/appointments/book`
**Cuerpo JSON:**
```json
{
  "phone": "5551234567",         
  "fullName": "Juan Perez",    
  "serviceId": "ID_DEL_SERVICIO",  
  "startTime": "2024-05-15T10:00:00.000Z",
  "notes": "Agendado vía WhatsApp Bot"
}
```
**Comportamiento**: 
- Si `phone` no existe en tu base de datos, lo crea automáticamente.
- Asegura que no exista empalme en ese horario con ese servicio.


### 2.2 Reagendar 
`PUT /api/n8n/appointments/reschedule`
**Cuerpo JSON:**
```json
{
  "phone": "5551234567",
  "oldStartTime": "2024-05-15T10:00:00.000Z",
  "newStartTime": "2024-05-16T15:30:00.000Z"
}
```
**Comportamiento**: 
- Busca al paciente dueño de ese celular y busca si tiene una cita activa agendada previamente para `oldStartTime`.
- La mueve a la nueva fecha `newStartTime` comprobando empalmes.


### 2.3 Cancelar
`POST /api/n8n/appointments/cancel`
**Cuerpo JSON:**
```json
{
  "phone": "5551234567",
  "startTime": "2024-05-16T15:30:00.000Z"
}
```
**Comportamiento**: 
- Localiza la cita por el celular y la fecha/hora en la que iba a ocurrir, y cambia su estatus a `CANCELLED` liberando el espacio en tu calendario de Next.js de inmediato.
