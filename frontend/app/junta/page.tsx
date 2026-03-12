'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { SkeletonGrid } from '@/components/public/skeleton-grid';
import { BoardMandate } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_BOARD_POSITIONS, mergeDefaultWithDynamic } from '@/lib/institutional-catalogs';

export default function BoardPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BoardMandate[]>([]);
  const [position, setPosition] = useState('ALL');

  useEffect(() => {
    publicApi.board().then((data) => setItems(data as BoardMandate[])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const positions = useMemo(
    () => ['ALL', ...mergeDefaultWithDynamic(DEFAULT_BOARD_POSITIONS, items.map((item) => item.position))],
    [items],
  );

  const filtered = items.filter((item) => position === 'ALL' || item.position === position);

  return (
    <PageShell>
      <SectionHeading title="Junta directiva activa" subtitle="Cargos vigentes de representación" />
      <select
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {positions.map((value) => (
          <option key={value} value={value}>
            {value === 'ALL' ? 'Todos los cargos' : value}
          </option>
        ))}
      </select>

      {loading ? (
        <SkeletonGrid items={4} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay cargos de junta activos en este momento." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <motion.article whileHover={{ y: -2 }} key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-emerald-700">{item.position}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.person.fullName}</h3>
              <p className="text-sm text-slate-500">{item.person.institutionalEmail}</p>
            </motion.article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
