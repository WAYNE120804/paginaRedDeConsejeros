# Red de Consejeros — Monorepo (Fases 1 y 2)

Monorepo con backend NestJS + Prisma + PostgreSQL y frontend Next.js placeholder.

## Estructura
- `backend/`: API NestJS 10 + Prisma
- `frontend/`: Next.js + Tailwind (placeholder)

## Requisitos (Windows)
- Node.js 20+
- npm 10+
- PostgreSQL local

## Base de datos local (obligatoria en este proyecto)
Configurar PostgreSQL con:
- host: `localhost`
- port: `5434`
- user: `postgres`
- password: `postgres`
- db: `red_consejeros`

`DATABASE_URL` esperada:
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

Base URL API: `http://localhost:3001/api`

## Frontend placeholder
```bash
cd frontend
npm install
npm run dev
```

## Modelo de datos
- `AdminUser`: autenticación de administradores.
- `AuditLog`: trazabilidad mínima de acciones.
- `Person`: persona base (código, nombre, correo institucional, teléfono, descripción pública, foto).
- `RepresentativeMandate` (histórico): mandatos de representación por persona.
- `Leader`: liderazgos por persona.
- `BoardMandate`: cargos en mesa/consejo por persona.

## Reglas críticas de negocio
1. Una persona solo puede tener **1 RepresentativeMandate ACTIVE** a la vez.
2. Una persona no puede tener **Leader activo** si tiene `RepresentativeMandate ACTIVE`.
3. Una persona no puede tener `RepresentativeMandate ACTIVE` si tiene **Leader activo**.
4. Crear mandato exige `start_date`.
5. Cerrar mandato exige `end_date` válida y `end_date >= start_date`.

### Enforcement
- DB: índice único parcial `uq_rep_active_per_person` para impedir más de 1 mandato ACTIVE por persona.
- DB: índice único parcial `uq_leader_active_per_person` para impedir más de 1 liderazgo activo por persona.
- Servicio: validaciones cruzadas transaccionales entre `RepresentativeMandate` y `Leader`.

## Endpoints implementados
### Auth/Admin (Fase 1)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/admin-users` (SUPERADMIN)
- `PATCH /api/admin-users/:id/reset-password` (SUPERADMIN)
- `PATCH /api/admin-users/:id/disable` (SUPERADMIN)

### People (SECRETARIO y SUPERADMIN)
- `POST /api/people`
- `GET /api/people?query=...`
- `GET /api/people/:id`
- `PATCH /api/people/:id`

### Representation (SECRETARIO y SUPERADMIN)
- `POST /api/representation/mandates`
- `PATCH /api/representation/mandates/:id/close`
- `GET /api/representation/active`
- `GET /api/representation/history/:personId`

### Leaders (SECRETARIO y SUPERADMIN)
- `POST /api/leaders`
- `PATCH /api/leaders/:id/deactivate`
- `GET /api/leaders/active`

### Board (SECRETARIO y SUPERADMIN)
- `POST /api/board/mandates`
- `PATCH /api/board/mandates/:id/close`
- `GET /api/board/active`
- `GET /api/board/history/:personId`

## Seed inicial admins
- `admin.ti@umanizales.edu.co / Admin123!`
- `secretario@umanizales.edu.co / Secretario123!`
- `comunicaciones@umanizales.edu.co / Comms123!`

> Cambiar contraseñas/secretos en producción.
