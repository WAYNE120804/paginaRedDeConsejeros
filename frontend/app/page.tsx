'use client';

import { PageShell } from '@/components/ui/page-shell';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <PageShell>
      <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-sm font-semibold text-emerald-700">Subfase 6A</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Red de Consejeros · Universidad de Manizales</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Base visual del portal institucional lista: tema, branding, navbar responsiva, footer y estructura para panel administrativo protegido.
          </p>
        </motion.div>
      </section>
    </PageShell>
  );
}
