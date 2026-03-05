# Red de Consejeros — Monorepo (Fases 1, 2 y 3)

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

## Fase 2 (modelo académico y representaciones)
Incluye `Person`, `RepresentativeMandate`, `Leader`, `BoardMandate` con reglas de exclusividad y endpoints RBAC para SECRETARIO/SUPERADMIN.

## Fase 3 (eventos + uploads + galería)

### Modelo
- `Event`: slug, título, descripción, tipo (`PUBLIC_EVENT | ASSEMBLY | BOARD_MEETING`), visibilidad (`PUBLIC | HIDDEN`), fecha, hora inicio/fin, ubicación, soft-delete.
- `EventPhoto`: URL lógica de foto, caption y orden.

### Estado computado de evento
El estado no se guarda en DB. La API calcula:
- `PROXIMO`
- `EN_REALIZACION`
- `FINALIZADO`

según fecha/hora vs now (`APP_TIMEZONE`, por defecto `America/Bogota`).

### Uploads (StorageService + LocalStorageService)
- Implementación desacoplada vía `StorageService` para migrar en futuro a S3/MinIO.
- Implementación local guarda bajo `backend/uploads` servido por `GET /uploads/*`.
- Carpetas:
  - `uploads/eventos/<slug>/...`
  - `uploads/repres/...`
  - `uploads/lideres/...`
  - `uploads/junta/...`
  - `uploads/noticias/...`
  - `uploads/documentos/...`

> Las carpetas de eventos se crean **on-demand** al subir la primera foto.
> En DB solo se almacenan rutas lógicas (ej: `/uploads/eventos/mi-evento/archivo.webp`).

### Reglas de subida de imágenes
- máximo 5MB
- tipos permitidos: `jpg`, `png`, `webp`
- nombre sanitizado + nombre único (`timestamp + random`)

## Endpoints Fase 3
### Eventos (SECRETARIO / COMUNICACIONES / SUPERADMIN)
- `POST /api/events`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id` (soft delete)

### Lectura de eventos
- `GET /api/events`
  - público: solo `visibility=PUBLIC`
  - admin autenticado: todos
- `GET /api/events/:slug`
  - público: solo eventos `PUBLIC`
  - admin autenticado: puede ver `HIDDEN`

### Fotos de evento
- `POST /api/events/:id/photos` (multipart/form-data, campo `file`)
- `PATCH /api/events/:id/photos/:photoId` (caption/sort_order)
- `DELETE /api/events/:id/photos/:photoId`

## Ejemplos curl

### Login
```bash
curl -i -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretario@umanizales.edu.co","password":"Secretario123!"}'
```

### Crear evento
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "slug":"asamblea-marzo-2026",
    "title":"Asamblea General Marzo",
    "description":"Encuentro de representantes",
    "type":"ASSEMBLY",
    "visibility":"PUBLIC",
    "date":"2026-03-15",
    "startTime":"09:00",
    "endTime":"12:00",
    "location":"Auditorio Central"
  }'
```

### Subir foto a evento
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/events/<EVENT_ID>/photos \
  -F "file=@C:/ruta/foto.webp"
```

### Ver evento por slug (público)
```bash
curl http://localhost:3001/api/events/asamblea-marzo-2026
```
