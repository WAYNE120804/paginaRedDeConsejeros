'use client';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  CalendarDays,
  QrCode,
  UserCheck,
  Award,
  Briefcase,
  Shield,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { Toaster } from 'sonner';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/personas', label: 'Personas', icon: Users },
  { href: '/admin/representantes', label: 'Representantes', icon: UserCheck },
  { href: '/admin/lideres', label: 'Líderes', icon: Award },
  { href: '/admin/junta', label: 'Junta Directiva', icon: Briefcase },
  { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/admin/asistencia', label: 'Asistencia', icon: QrCode },
  { href: '/admin/noticias', label: 'Noticias', icon: Megaphone },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Shield },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, email } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const NavLinkItem = ({
    href,
    label,
    icon: Icon,
    exact = false,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
  }) => {
    const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-emerald-100 text-emerald-800 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-emerald-700">Panel Administrativo</h2>
        <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={toggleSidebar}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto pb-4">
        <div className="space-y-1">
          {adminLinks.map((link) => (
            <NavLinkItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              exact={link.href === '/admin'}
            />
          ))}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toaster richColors position="top-right" />
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 md:grid-cols-[250px_1fr]">
        
        {/* Desktop Sidebar (visible on md and up) */}
        <aside className="hidden border-r border-emerald-100 bg-white p-4 md:block h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* Mobile Drawer (visible only if isOpen) */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={toggleSidebar} />
            {/* Sidebar panel */}
            <aside className="relative flex w-64 max-w-sm flex-col bg-white p-4 shadow-xl">
              <SidebarContent />
            </aside>
          </div>
        )}

        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-emerald-100 bg-white/80 backdrop-blur-md px-4 py-3 sm:px-6">
            <button className="md:hidden text-slate-600 hover:text-emerald-700 transition" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-800">{email ?? 'Usuario administrador'}</p>
              <p className="text-xs text-slate-500">Rol: {role ?? '---'}</p>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
