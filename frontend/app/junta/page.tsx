'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { BoardMandate } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';

export default function BoardPage() {
  const [items, setItems] = useState<BoardMandate[]>([]);

  useEffect(() => {
    publicApi.board().then((data) => setItems(data as BoardMandate[])).catch(() => setItems([]));
  }, []);

  return (
    <PageShell>
      <SectionHeading title="Junta directiva activa" subtitle="Cargos vigentes de representación" />
      {items.length === 0 ? <EmptyState message="No hay cargos de junta activos en este momento." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-emerald-700">{item.position}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.person.fullName}</h3>
              <p className="text-sm text-slate-500">{item.person.institutionalEmail}</p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
