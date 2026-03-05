'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/admin/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const cards = [
  { title: 'Personas', href: '/admin/personas', desc: 'Registro base de personas y búsqueda rápida.' },
  { title: 'Eventos', href: '/admin/eventos', desc: 'Crear eventos y controlar visibilidad.' },
  { title: 'Asistencia', href: '/admin/asistencia', desc: 'Sesiones QR, registro manual y exportación.' },
  { title: 'Noticias', href: '/admin/noticias', desc: 'Redacción y publicación de noticias.' },
  { title: 'Documentos', href: '/admin/documentos', desc: 'Publicación de PDF y metadatos.' },
];

export default function AdminDashboardPage() {
  const { role } = useAdminAuth();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard administrativo</h1>
        <p className="text-sm text-slate-500">Rol activo: {role ?? '---'}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <h2 className="text-lg font-semibold text-slate-800">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
            <Link href={card.href} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Gestionar módulo
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}
