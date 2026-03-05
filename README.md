# Red de Consejeros — Monorepo (Fases 1 a 5)

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
3. Público escanea QR y abre la página pública `/asistencia/scan/:token` (frontend).
4. Esa página envía `POST /api/attendance/scan/:token` con el código estudiantil para registrar.
5. Validaciones:
   - token válido,
   - ventana activa (`active_from`/`active_until`),
   - persona existente (si no, error `NOT_REGISTERED`),
   - no duplicado por sesión.

- Configura `FRONTEND_PUBLIC_URL` en backend para definir la URL que se codifica en el QR (por defecto `http://localhost:3000`).

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


## Fase 5 (noticias + documentos + reportes)

### Noticias
- `News`: `slug`, `title`, `content` (markdown), `status` (`DRAFT|PUBLISHED`), `published_at`, `cover_photo_url`.
- Endpoints:
  - `POST /api/news` (COMUNICACIONES/SUPERADMIN)
  - `PATCH /api/news/:id` (COMUNICACIONES/SUPERADMIN)
  - `GET /api/news` (público ve solo `PUBLISHED`)
  - `GET /api/news/:slug` (público ve solo `PUBLISHED`)
  - `POST /api/news/:id/cover` (upload imagen de portada)

### Documentos públicos
- `PublicDocument`: `category` (`ESTATUTOS|REGLAMENTOS|LINEAMIENTOS|COMUNICADOS`), `title`, `description`, `pdf_url`, `published_at`, `status` (`PUBLISHED|ARCHIVED`).
- Endpoints:
  - `POST /api/documents` (SECRETARIO/SUPERADMIN, multipart PDF + metadata)
  - `PATCH /api/documents/:id` (SECRETARIO/SUPERADMIN)
  - `GET /api/documents` (público ve solo `PUBLISHED`)
  - `GET /api/documents/:id/download` (descarga/redirección de PDF)

### Reportes Excel extra
- `GET /api/reports/representatives.xlsx` (activos)
- `GET /api/reports/representatives-history.xlsx?personId=<id>` (histórico global o por persona)
- `GET /api/reports/leaders.xlsx`
- `GET /api/reports/board.xlsx`

### Ejemplos curl Fase 5
```bash
# Crear noticia
curl -b cookies.txt -X POST http://localhost:3001/api/news   -H "Content-Type: application/json"   -d '{
    "slug":"comunicado-marzo-2026",
    "title":"Comunicado Marzo",
    "content":"# Contenido en markdown",
    "status":"PUBLISHED",
    "publishedAt":"2026-03-06T15:00:00.000Z"
  }'

# Subir portada de noticia
curl -b cookies.txt -X POST http://localhost:3001/api/news/<NEWS_ID>/cover   -F "file=@C:/ruta/portada.webp"

# Crear documento público (PDF)
curl -b cookies.txt -X POST http://localhost:3001/api/documents   -F "file=@C:/ruta/estatutos.pdf"   -F "category=ESTATUTOS"   -F "title=Estatutos vigentes"   -F "description=Versión aprobada"   -F "publishedAt=2026-03-01T00:00:00.000Z"   -F "status=PUBLISHED"

# Descargar documento
curl -L http://localhost:3001/api/documents/<DOC_ID>/download -o documento.pdf

# Reporte de representantes activos
curl -L -b cookies.txt http://localhost:3001/api/reports/representatives.xlsx -o representantes.xlsx
```

## Troubleshooting rápido

### 1) `Cannot GET /api`
Ahora `GET /api` responde health-check JSON:

```json
{ "data": { "name": "red-consejeros-api", "status": "ok" }, "error": null }
```

Si no responde así, asegúrate de estar corriendo la última versión del backend.

### 2) Error Prisma `P3006` / migración `20260305022348_`
Si te aparece una migración como `20260305022348_` pero **no existe en este repo**, quedó un archivo local viejo.

Pasos recomendados (desarrollo local):

1. Verifica migraciones del repo:
   - deben existir solo:
     - `20260304235000_init`
     - `20260305012000_phase2_data_model`
     - `20260305100000_phase3_events_uploads`
     - `20260305123000_phase4_attendance`
     - `20260305140000_phase5_news_documents`

2. Elimina carpeta local sobrante `backend/prisma/migrations/20260305022348_` (si existe).

3. Reinicia estado local de migraciones en dev:
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

Si persiste, confirma que el `DATABASE_URL` apunta a `localhost:5434` y que no estás mezclando otra copia del proyecto.
