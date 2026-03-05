'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { RepresentativeMandate } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/ui/page-shell';
import { DEFAULT_ESTATE_TYPES, DEFAULT_FACULTIES, mergeDefaultWithDynamic } from '@/lib/institutional-catalogs';

export default function RepresentativesPage() {
  const [items, setItems] = useState<RepresentativeMandate[]>([]);
  const [faculty, setFaculty] = useState('ALL');
  const [estate, setEstate] = useState('ALL');

  useEffect(() => {
    publicApi.representatives().then((data) => setItems(data as RepresentativeMandate[])).catch(() => setItems([]));
  }, []);

  const faculties = useMemo(
    () => ['ALL', ...mergeDefaultWithDynamic(DEFAULT_FACULTIES, items.map((item) => item.faculty))],
    [items],
  );
  const estates = useMemo(
    () => ['ALL', ...mergeDefaultWithDynamic(DEFAULT_ESTATE_TYPES, items.map((item) => item.estateType))],
    [items],
  );

  const filtered = items.filter(
    (item) => (faculty === 'ALL' || item.faculty === faculty) && (estate === 'ALL' || item.estateType === estate),
  );

  return (
    <PageShell>
      <SectionHeading title="Representantes activos" subtitle="Filtra por facultad y estamento" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {faculties.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'Todas las facultades' : value}
            </option>
          ))}
        </select>
        <select
          value={estate}
          onChange={(e) => setEstate(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {estates.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'Todos los estamentos' : value}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No hay representantes para este filtro." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">{item.estateType}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.person.fullName}</h3>
              <p className="text-sm text-slate-500">
                {item.faculty} · {item.program}
              </p>
              <p className="mt-2 text-xs text-slate-400">{item.person.institutionalEmail}</p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
