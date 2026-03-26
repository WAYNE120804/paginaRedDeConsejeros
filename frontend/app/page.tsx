'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/ui/page-shell';
import { HomeSections } from '@/components/public/home-sections';

export default function HomePage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-[2.2rem] border border-emerald-900/10 bg-[linear-gradient(135deg,#355c46,#1e6d43_48%,#6a8d4e_82%,#d7b24a_100%)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-10 lg:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_24%)]" />
        <div className="relative max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">Portal institucional</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
              Red de Consejeros
              <span className="block text-[#d2efb0]">Universidad de Manizales</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/88 sm:text-xl">
              Conoce representantes, lideres, eventos y noticias en un espacio publico renovado, visible y con identidad institucional para la comunidad estudiantil.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/eventos"
                className="rounded-full bg-[#c7d84f] px-8 py-4 text-base font-bold text-emerald-950 shadow-[0_18px_35px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-[#d7e56d]"
              >
                Ver proximos eventos
              </Link>
              <Link
                href="/representantes"
                className="rounded-full border-2 border-white/85 bg-white/14 px-8 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/22"
              >
                Conoce tus representantes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <HomeSections />
    </PageShell>
  );
}
