'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { SkeletonGrid } from '@/components/public/skeleton-grid';
import { Leader } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_FACULTIES, mergeDefaultWithDynamic } from '@/lib/institutional-catalogs';

export default function LeadersPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Leader[]>([]);
  const [faculty, setFaculty] = useState('ALL');

  useEffect(() => {
    publicApi.leaders().then((data) => setItems(data as Leader[])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const faculties = useMemo(
    () => ['ALL', ...mergeDefaultWithDynamic(DEFAULT_FACULTIES, items.map((item) => item.faculty))],
    [items],
  );
  const filtered = items.filter((item) => faculty === 'ALL' || item.faculty === faculty);

  return (
    <PageShell>
      <SectionHeading title="Líderes activos" subtitle="Liderazgo estudiantil por facultad" />
      <select
        value={faculty}
        onChange={(e) => setFaculty(e.target.value)}
        className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {faculties.map((value) => (
          <option key={value} value={value}>
            {value === 'ALL' ? 'Todas las facultades' : value}
          </option>
        ))}
      </select>
      {loading ? (
        <SkeletonGrid items={4} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay líderes para este filtro." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <motion.article whileHover={{ y: -2 }} key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.person.fullName}</h3>
              <p className="text-sm text-slate-500">
                {item.faculty} · {item.program}
              </p>
              {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
            </motion.article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
