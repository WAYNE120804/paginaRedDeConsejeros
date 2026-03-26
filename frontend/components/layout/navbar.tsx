'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const primaryLinks = [
  { href: '/representantes', label: 'Representantes' },
  { href: '/lideres', label: 'Lideres' },
  { href: '/junta', label: 'Junta Directiva' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/noticias', label: 'Noticias' },
];

const secondaryLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/admin/login', label: 'Admin' },
];

function PrimaryButton({
  href,
  label,
  active,
  compact = false,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl border text-center font-semibold transition ${
        compact
          ? active
            ? 'border-emerald-700 bg-emerald-100 px-4 py-3 text-sm text-emerald-950 shadow-sm'
            : 'border-emerald-900/10 bg-white px-4 py-3 text-sm text-emerald-950 hover:border-emerald-700 hover:bg-emerald-50'
          : active
            ? 'border-emerald-700 bg-emerald-100 px-4 py-2.5 text-sm text-emerald-950 shadow-[0_14px_35px_rgba(16,185,129,0.12)]'
            : 'border-emerald-900/10 bg-white px-4 py-2.5 text-sm text-emerald-950 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/96 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:gap-6 lg:py-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/logo-red-de-consejeros.png"
              alt="Logo Red de Consejeros"
              width={88}
              height={88}
              className="h-14 w-auto rounded-2xl border border-emerald-900/10 bg-white p-1.5 object-contain shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:h-16"
            />
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">Red de Consejeros</p>
              <p className="truncate text-base font-semibold text-emerald-950 sm:text-xl">Universidad de Manizales</p>
            </div>
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-[1.75rem] border border-emerald-900/10 bg-slate-50/80 p-2">
            {primaryLinks.map((link) => (
              <div key={link.href} className="min-w-0">
                <PrimaryButton href={link.href} label={link.label} active={pathname === link.href} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="https://www.instagram.com/redconsejeros_um?igsh=MXRmbXdrYTI5eXhwYg=="
            target="_blank"
            rel="noreferrer"
            className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-100 lg:inline-flex"
            aria-label="Instagram de la Red de Consejeros"
          >
            <Instagram size={21} />
          </Link>
          <Link href="https://umanizales.edu.co/" className="block" aria-label="Ir a Universidad de Manizales">
            <Image
              src="/assets/logo-universidad-de-manizales.png"
              alt="Logo Universidad de Manizales"
              width={72}
              height={72}
              className="h-10 w-auto object-contain transition hover:scale-[1.02] sm:h-12 lg:h-14"
            />
          </Link>
          <button
            type="button"
            onClick={() => setSecondaryOpen((prev) => !prev)}
            className="hidden items-center gap-2 rounded-2xl border border-emerald-900/10 bg-slate-50 px-5 py-3.5 text-base font-semibold text-emerald-950 transition hover:border-emerald-600 hover:bg-emerald-50 lg:inline-flex"
            aria-label="Abrir menu secundario"
            aria-expanded={secondaryOpen}
          >
            {secondaryOpen ? <X size={20} /> : <Menu size={20} />}
            Menu
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-emerald-700/20 bg-emerald-50 text-emerald-950 shadow-sm lg:hidden"
            aria-label="Abrir menu movil"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} strokeWidth={2.4} /> : <Menu size={24} strokeWidth={2.4} />}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 xl:hidden">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-emerald-900/10 bg-slate-50/80 p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2">
            {primaryLinks.map((link) => (
              <PrimaryButton key={link.href} href={link.href} label={link.label} active={pathname === link.href} compact />
            ))}
          </div>
        </div>
      </div>

      {secondaryOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="hidden border-t border-emerald-900/10 bg-white lg:block"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap gap-3">
              {secondaryLinks.map((link) => {
                const active = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSecondaryOpen(false)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'border border-emerald-700 bg-emerald-100 text-emerald-950'
                        : 'border border-emerald-900/10 bg-slate-50 text-slate-700 hover:border-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <p className="text-sm text-slate-500">Accesos complementarios y administrativos</p>
          </div>
        </motion.div>
      ) : null}

      {mobileOpen ? (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-emerald-900/10 bg-white px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-3">
            <div className="grid gap-2">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm transition ${
                    pathname === link.href
                      ? 'border border-emerald-700 bg-emerald-100 text-emerald-950'
                      : 'text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              href="https://www.instagram.com/redconsejeros_um?igsh=MXRmbXdrYTI5eXhwYg=="
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
            >
              <Instagram size={18} />
              Instagram
            </Link>
          </div>
        </motion.nav>
      ) : null}
    </header>
  );
}
