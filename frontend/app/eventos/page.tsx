'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { SkeletonGrid } from '@/components/public/skeleton-grid';
import { PageShell } from '@/components/ui/page-shell';
import { EventSummary } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';

function getEventStart(event: EventSummary) {
  return new Date(`${event.date.slice(0, 10)}T${event.startTime}:00`);
}

function getEventEnd(event: EventSummary) {
  return new Date(`${event.date.slice(0, 10)}T${event.endTime}:00`);
}

export default function EventsPage() {
  const [items, setItems] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .homeEvents()
      .then((data) => setItems(data as EventSummary[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleEvents = useMemo(() => {
    const now = new Date();
    return [...items]
      .filter((event) => getEventEnd(event) >= now && event.computedStatus !== 'FINALIZADO')
      .sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  }, [items]);

  return (
    <PageShell>
      <SectionHeading title="Eventos públicos" subtitle="Ordenados desde el más cercano hasta el más lejano" />

      {loading ? (
        <SkeletonGrid items={4} />
      ) : visibleEvents.length === 0 ? (
        <EmptyState message="No hay eventos próximos o activos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleEvents.map((event) => (
            <Link href={`/eventos/${event.slug}`} key={event.id} className="block h-full">
              <motion.article whileHover={{ y: -2 }} className="h-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200">
                <p className="text-xs uppercase text-emerald-700">{event.computedStatus}</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">{event.title}</h4>
                <p className="mt-2 text-sm text-slate-500">{event.description}</p>
                <p className="mt-3 text-sm text-slate-500">
                  {new Date(event.date).toLocaleDateString('es-CO')} · {event.startTime} - {event.endTime}
                </p>
                <p className="text-sm text-slate-400">{event.location}</p>
                <p className="mt-3 text-sm font-semibold text-emerald-700">Ver detalle</p>
              </motion.article>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
