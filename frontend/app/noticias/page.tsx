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
import { getFileUrl, getNewsExcerpt } from '@/lib/utils';

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
        <div className="grid gap-5">
          {items.map((item) => (
            <Link href={`/noticias/${item.slug}`} key={item.id} className="block h-full">
              <motion.article whileHover={{ y: -2 }} className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-100">
                {item.coverPhotoUrl ? (
                  <img
                    src={getFileUrl(item.coverPhotoUrl)}
                    alt={item.title}
                    className="h-56 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{getNewsExcerpt(item.content, 180)}</p>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
