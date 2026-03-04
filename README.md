# Red de Consejeros — Monorepo (Fase 1)

Esta FASE 1 deja listo el **backend completo** (NestJS + Prisma + PostgreSQL) con Auth, roles, endpoints de administración, auditoría y seed inicial; y además crea el **esqueleto del frontend** (Next.js + Tailwind) como placeholder.

## Estructura

- `backend/`: API NestJS 10 + Prisma + PostgreSQL
- `frontend/`: Next.js 14 + Tailwind (placeholder)

## Requisitos (Windows)

- Node.js 20+
- npm 10+ (o pnpm)
- PostgreSQL 14+ corriendo localmente

## Configuración de PostgreSQL local

Asegúrate de tener esta instancia:

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `red_consejeros`

Crear DB (ejemplo con `psql`):

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE red_consejeros;"
```

## Backend

### 1) Variables de entorno

Copiar y ajustar:

```bash
cd backend
copy .env.example .env
```

`.env` por defecto:

```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/red_consejeros?schema=public"
JWT_SECRET="dev-secret"
JWT_EXPIRES_IN="8h"
```

> ⚠️ En producción cambia secretos y contraseñas inmediatamente.

### 2) Instalar dependencias

```bash
cd backend
npm install
```

### 3) Prisma migrate + generate + seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4) Correr backend en desarrollo

```bash
cd backend
npm run start:dev
```

Base URL backend: `http://localhost:3001/api`

## Frontend (placeholder)

```bash
cd frontend
npm install
npm run dev
```

URL frontend: `http://localhost:3000`

## Auth y Roles implementados

Roles:
- `SUPERADMIN`
- `SECRETARIO`
- `COMUNICACIONES`

Seed inicial:
- `admin.ti@umanizales.edu.co / Admin123!`
- `secretario@umanizales.edu.co / Secretario123!`
- `comunicaciones@umanizales.edu.co / Comms123!`

> ⚠️ Cambiar estas contraseñas en cualquier entorno real.

## Endpoints Fase 1

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/admin-users` (solo SUPERADMIN)
- `PATCH /api/admin-users/:id/reset-password` (solo SUPERADMIN)
- `PATCH /api/admin-users/:id/disable` (solo SUPERADMIN)

Respuesta JSON consistente:

```json
{
  "data": {},
  "error": null
}
```

Errores:

```json
{
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "..."
  }
}
```

## Seguridad básica implementada

- Hash de contraseñas con `bcrypt`
- JWT con expiración (`8h` por defecto)
- JWT en cookie `httpOnly` + token en body para compatibilidad
- Guards `JwtAuthGuard` + `RolesGuard`
- Decorador `@Roles(...)`
- DTOs con `class-validator`
- ExceptionFilter global
- Registro básico de acciones en `AuditLog`
- Tests e2e mínimos para login, `/me` y restricción de rol
