'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { SkeletonGrid } from '@/components/public/skeleton-grid';
import { PageShell } from '@/components/ui/page-shell';
import { NewsSummary } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';

export default function NewsPage() {
  const [items, setItems] = useState<NewsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .homeNews()
      .then((data) => setItems(data as NewsSummary[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <SectionHeading title="Noticias" subtitle="Comunicados y novedades de la Red de Consejeros" />
      {loading ? (
        <SkeletonGrid items={4} columns="md:grid-cols-1" />
      ) : items.length === 0 ? (
        <EmptyState message="No hay noticias publicadas." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <motion.article whileHover={{ y: -2 }} key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.content.slice(0, 180)}...</p>
              <Link href={`/noticias/${item.slug}`} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Leer más
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
