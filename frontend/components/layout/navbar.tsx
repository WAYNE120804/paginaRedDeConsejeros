'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/representantes', label: 'Representantes' },
  { href: '/lideres', label: 'Líderes' },
  { href: '/junta', label: 'Junta Directiva' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/admin/login', label: 'Admin' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/assets/logo-red.svg" alt="Logo Red de Consejeros" width={36} height={36} className="rounded-lg" />
          <span className="text-sm font-semibold text-slate-800 sm:text-base">Red de Consejeros</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-600 transition-colors hover:text-emerald-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Image
            src="/assets/logo-umanizales.svg"
            alt="Logo Universidad de Manizales"
            width={36}
            height={36}
            className="hidden rounded-lg sm:block"
          />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-lg border border-emerald-100 p-2 text-slate-700 md:hidden"
            aria-label="Abrir menú"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-emerald-100 bg-white px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-slate-700">
                {link.label}
              </Link>
            ))}
          </div>
        </motion.nav>
      )}
    </header>
  );
}
