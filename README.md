# Red de Consejeros — Monorepo (Fases 1 a 4)

Backend NestJS + Prisma + PostgreSQL y frontend Next.js placeholder.

## Estructura
- `backend/`: API NestJS 10 + Prisma
- `frontend/`: Next.js + Tailwind (placeholder)

## Base de datos local
PostgreSQL local:
- host: `localhost`
- port: `5434`
- user: `postgres`
- password: `postgres`
- db: `red_consejeros`

`DATABASE_URL`:
`postgresql://postgres:postgres@localhost:5434/red_consejeros?schema=public`

## Backend setup
```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

## Frontend placeholder
```bash
cd frontend
npm install
npm run dev
```

## Fase 3 (eventos + uploads + galería)
- Storage desacoplado con `StorageService` y `LocalStorageService`.
- Archivos servidos por `GET /uploads/*`.
- Eventos públicos/ocultos y galería por evento.
- Carpetas de eventos se crean **on-demand** al subir la primera foto.
- DB guarda solo rutas lógicas (`/uploads/...`).

## Fase 4 (asistencia QR + manual + export Excel)

### Modelo
- `AttendanceSession`:
  - `type: ASSEMBLY | BOARD | EVENT`
  - `event_id` nullable
  - `name`, `short_description`
  - `token` único secreto
  - `active_from`, `active_until`
  - `allow_manual`
  - `created_by_admin_id`
- `AttendanceRecord`:
  - `session_id`, `person_id`
  - `mode: QR | MANUAL`
  - `timestamp`, `note`, `recorded_by_admin_id`
  - `unique(session_id, person_id)` para evitar duplicados

### Flujo QR
1. Admin crea sesión (`POST /api/attendance/sessions`).
2. Obtiene detalles y QR URL (`GET /api/attendance/sessions/:id`).
3. Público escanea QR y registra con código (`POST /api/attendance/scan/:token`).
4. Validaciones:
   - token válido,
   - ventana activa (`active_from`/`active_until`),
   - persona existente (si no, error `NOT_REGISTERED`),
   - no duplicado por sesión.

### Flujo manual
- Endpoint admin: `POST /api/attendance/sessions/:id/records/manual`.
- Requiere `allow_manual=true`.
- Si `student_code` no existe, permite crear persona básica en la misma operación usando `fullName` e `institutionalEmail`.

### Export Excel
- `GET /api/attendance/sessions/:id/export.xlsx`
- Incluye columnas:
  - nombre
  - código
  - correo
  - rol actual (`REPRESENTANTE`, `LIDER`, `NINGUNO`)
  - timestamp
  - modo

## Endpoints Fase 4
### Admin (SECRETARIO/SUPERADMIN)
- `POST /api/attendance/sessions`
- `GET /api/attendance/sessions/:id`
- `GET /api/attendance/sessions/:id/records`
- `POST /api/attendance/sessions/:id/records/manual`
- `GET /api/attendance/sessions/:id/export.xlsx`

### Público
- `POST /api/attendance/scan/:token`

## Ejemplos curl (asistencia)

### Crear sesión de asistencia
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/attendance/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "type":"ASSEMBLY",
    "name":"Asamblea Marzo 2026",
    "shortDescription":"Control de ingreso",
    "activeFrom":"2026-03-20T13:00:00.000Z",
    "activeUntil":"2026-03-20T16:00:00.000Z",
    "allowManual":true
  }'
```

### Ver detalles de sesión + QR URL
```bash
curl -b cookies.txt http://localhost:3001/api/attendance/sessions/<SESSION_ID>
```

### Registrar asistencia por QR (público)
```bash
curl -X POST http://localhost:3001/api/attendance/scan/<TOKEN> \
  -H "Content-Type: application/json" \
  -d '{"studentCode":"20260001"}'
```

### Registrar asistencia manual (creando persona si no existe)
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/attendance/sessions/<SESSION_ID>/records/manual \
  -H "Content-Type: application/json" \
  -d '{
    "studentCode":"20269999",
    "fullName":"Persona Nueva",
    "institutionalEmail":"persona.nueva@umanizales.edu.co",
    "note":"Ingreso manual"
  }'
```

### Exportar excel
```bash
curl -L -b cookies.txt http://localhost:3001/api/attendance/sessions/<SESSION_ID>/export.xlsx -o asistencia.xlsx
```
