# Frontend — Red de Consejeros (Subfases 6A–6B)

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


## Avance 6B (páginas públicas básicas)
- Home con hero y secciones públicas conectadas a API (`/events`, `/news`, `/documents`).
- Listados públicos con filtros:
  - `/representantes` (facultad + estamento)
  - `/lideres` (facultad)
  - `/documentos` (categoría)
- Rutas públicas base implementadas:
  - `/junta`, `/eventos`, `/noticias`
- Catálogos institucionales por defecto en filtros (facultades, estamentos y cargos de junta), combinados dinámicamente con valores retornados por backend para soportar nuevos cargos/facultades sin cambios de código.
- Rutas dinámicas preparadas con placeholder para próximas subfases:
  - `/eventos/[slug]` (6C)
  - `/noticias/[slug]` (6D)
  - `/perfil/[student_code]` (subfase de perfil)


## Avance 6C (eventos + detalle + carrusel)
- `/eventos/[slug]` ahora consume `GET /api/events/:slug` y muestra:
  - título
  - descripción
  - fecha
  - lugar
  - galería de fotos
- Carrusel implementado con:
  - swipe en móvil
  - flechas de navegación
  - vista grande (lightbox)
- Las imágenes usan rutas lógicas del backend (`/uploads/...`) construidas con `NEXT_PUBLIC_UPLOADS_BASE_URL`.


## Avance 6D (noticias + markdown)
- `/noticias/[slug]` ahora consume `GET /api/news/:slug`.
- El detalle de noticia renderiza contenido markdown usando `react-markdown` con estilos tipográficos legibles.
- Soporta portada (`coverPhotoUrl`) y rutas lógicas de uploads usando `NEXT_PUBLIC_UPLOADS_BASE_URL`.
