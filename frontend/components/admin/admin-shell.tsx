'use client';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LayoutDashboard, Users, Megaphone, FileText, CalendarDays, QrCode } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/personas', label: 'Personas', icon: Users },
  { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/admin/asistencia', label: 'Asistencia', icon: QrCode },
  { href: '/admin/noticias', label: 'Noticias', icon: Megaphone },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, email } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-emerald-100 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold text-emerald-700">Panel Administrativo</h2>
          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-col">
          <header className="border-b border-emerald-100 bg-white px-4 py-3 sm:px-6">
            <p className="text-sm font-medium text-slate-800">{email ?? 'Usuario administrador'}</p>
            <p className="text-xs text-slate-500">Rol: {role ?? '---'}</p>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
