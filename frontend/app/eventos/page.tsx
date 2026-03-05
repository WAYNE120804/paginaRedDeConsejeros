'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { EventSummary } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';

export default function EventsPage() {
  const [items, setItems] = useState<EventSummary[]>([]);

  useEffect(() => {
    publicApi.homeEvents().then((data) => setItems(data as EventSummary[])).catch(() => setItems([]));
  }, []);

  const upcoming = useMemo(() => items.filter((e) => e.computedStatus !== 'FINALIZADO'), [items]);
  const finished = useMemo(() => items.filter((e) => e.computedStatus === 'FINALIZADO'), [items]);

  return (
    <PageShell>
      <SectionHeading title="Eventos públicos" subtitle="Actividades, asambleas y reuniones publicadas" />

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Próximos / en realización</h3>
        {upcoming.length === 0 ? <EmptyState message="No hay eventos próximos." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((event) => (
              <article key={event.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-emerald-700">{event.computedStatus}</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">{event.title}</h4>
                <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('es-CO')} · {event.location}</p>
                <Link href={`/eventos/${event.slug}`} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">Ver detalle</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Finalizados</h3>
        {finished.length === 0 ? <EmptyState message="No hay eventos finalizados." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {finished.map((event) => (
              <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-900">{event.title}</h4>
                <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('es-CO')} · {event.location}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
