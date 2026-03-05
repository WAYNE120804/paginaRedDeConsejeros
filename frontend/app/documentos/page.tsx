'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { DocumentSummary } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';

export default function DocumentsPage() {
  const [items, setItems] = useState<DocumentSummary[]>([]);
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    publicApi.homeDocuments().then((data) => setItems(data as DocumentSummary[])).catch(() => setItems([]));
  }, []);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const filtered = items.filter((item) => category === 'ALL' || item.category === category);

  return (
    <PageShell>
      <SectionHeading title="Documentos públicos" subtitle="Normativa, lineamientos y comunicados" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        {categories.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'Todas las categorías' : value}</option>)}
      </select>

      {filtered.length === 0 ? <EmptyState message="No hay documentos para esta categoría." /> : (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
              <p className="text-xs uppercase text-emerald-700">{doc.category}</p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
