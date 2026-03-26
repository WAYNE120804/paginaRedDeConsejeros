'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/admin/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const adminCards = [
  { title: 'Personas', href: '/admin/personas', desc: 'Registro base de personas y busqueda rapida.' },
  { title: 'Representantes', href: '/admin/representantes', desc: 'Gestiona representantes activos, filtros y periodos.' },
  { title: 'Lideres', href: '/admin/lideres', desc: 'Administra lideres institucionales y su informacion publica.' },
  { title: 'Junta Directiva', href: '/admin/junta', desc: 'Controla cargos, miembros activos y vigencias.' },
  { title: 'Eventos', href: '/admin/eventos', desc: 'Crear eventos y controlar visibilidad.' },
  { title: 'Asistencia', href: '/admin/asistencia', desc: 'Sesiones QR, registro manual y exportacion.' },
  { title: 'Noticias', href: '/admin/noticias', desc: 'Redaccion y publicacion de noticias.' },
  { title: 'Documentos', href: '/admin/documentos', desc: 'Publicacion de PDF y metadatos.' },
  { title: 'Usuarios', href: '/admin/usuarios', desc: 'Configura accesos, roles y permisos administrativos.' },
];

export default function AdminDashboardPage() {
  const { role } = useAdminAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard administrativo</h1>
        <p className="text-sm text-slate-500">Rol activo: {role ?? '---'}</p>
      </header>

      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Modulos administrativos</h2>
          <p className="text-sm text-slate-500">Accesos directos a todas las opciones de gestion del panel.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <Card key={card.title}>
              <h3 className="text-lg font-semibold text-slate-800">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
              <Link href={card.href} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Gestionar modulo
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
