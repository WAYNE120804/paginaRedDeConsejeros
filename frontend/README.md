# Frontend — Red de Consejeros (Subfase 6A)

## Instalación
```bash
npm install
```

## Variables de entorno
Crear `.env.local` con:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_UPLOADS_BASE_URL=http://localhost:3001
```

## Ejecutar en desarrollo
```bash
npm run dev
```

## Estructura base
- `app/`: rutas App Router
- `components/`: UI compartida, layout público y shell admin
- `services/`: cliente API central
- `hooks/`: hooks de autenticación admin
- `lib/`: utilidades/env
- `styles/`: estilos y tokens complementarios
- `public/assets/`: logos institucionales en formato SVG (texto), compatible con revisiones/PR sin binarios.

## Rutas implementadas en 6A
- Público: `/` + placeholders (`/eventos`, `/noticias`, `/documentos`, `/junta`, `/representantes`, `/lideres`)
- Admin:
  - `/admin/login` (sin shell admin)
  - `/admin` y módulos base (`/admin/personas`, `/admin/eventos`, `/admin/noticias`, `/admin/documentos`) bajo guard

## Guard de admin
- `useAdminAuth` consulta `GET /auth/me` con cookies.
- Si no hay sesión válida en rutas protegidas, redirige a `/admin/login`.
