'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/ui/page-shell';
import { HomeSections } from '@/components/public/home-sections';

export default function HomePage() {
  return (
    <PageShell>
      <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-sm font-semibold text-emerald-700">Portal institucional</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-5xl">
            Red de Consejeros
            <span className="block text-emerald-700">Universidad de Manizales</span>
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Conoce representantes, líderes, eventos y noticias en un espacio público, moderno y transparente para la comunidad estudiantil.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/eventos" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800">
              Ver próximos eventos
            </Link>
            <Link href="/representantes" className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Conoce tus representantes
            </Link>
          </div>
        </motion.div>
      </section>

      <HomeSections />
    </PageShell>
  );
}
