'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { SkeletonGrid } from '@/components/public/skeleton-grid';
import { PageShell } from '@/components/ui/page-shell';
import { EventSummary } from '@/lib/types/public';
import { formatEventSlot, getEventEnd, getEventTimeSlots, getNextEventMoment, isEventCurrent } from '@/lib/event-time';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';

function EventCard({ event, accent }: { event: EventSummary; accent: string }) {
  const slots = getEventTimeSlots(event);

  return (
    <Link href={`/eventos/${event.slug}`} className="block h-full">
      <motion.article whileHover={{ y: -2 }} className="h-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>{event.computedStatus.replace('_', ' ')}</p>
        <h4 className="mt-1 text-lg font-semibold text-slate-900">{event.title}</h4>
        <p className="mt-2 text-sm text-slate-500">{event.description}</p>
        <p className="mt-3 text-sm text-slate-500">{new Date(event.date).toLocaleDateString('es-CO')}</p>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          {slots.map((slot, index) => (
            <p key={`${event.id}-slot-${index}`}>{formatEventSlot(slot)}</p>
          ))}
        </div>
        <p className="mt-1 text-sm text-slate-400">{event.location}</p>
        <p className="mt-3 text-sm font-semibold text-emerald-700">Ver detalle</p>
      </motion.article>
    </Link>
  );
}

export default function EventsPage() {
  const [items, setItems] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    publicApi
      .homeEvents()
      .then((data) => setItems(data as EventSummary[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { currentEvents, upcomingEvents, completedEvents } = useMemo(() => {
    const now = new Date(currentTime);
    const current = [...items]
      .filter((event) => isEventCurrent(event, now))
      .sort((a, b) => (getNextEventMoment(a, now)?.getTime() ?? 0) - (getNextEventMoment(b, now)?.getTime() ?? 0));

    const upcoming = [...items]
      .filter((event) => !isEventCurrent(event, now) && getEventEnd(event) >= now)
      .sort(
        (a, b) =>
          (getNextEventMoment(a, now)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (getNextEventMoment(b, now)?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );

    const completed = [...items]
      .filter((event) => getEventEnd(event) < now)
      .sort((a, b) => getEventEnd(b).getTime() - getEventEnd(a).getTime());

    return {
      currentEvents: current,
      upcomingEvents: upcoming,
      completedEvents: completed,
    };
  }, [items, currentTime]);

  return (
    <PageShell>
      <SectionHeading title="Eventos publicos" subtitle="." />

      {loading ? (
        <SkeletonGrid items={6} />
      ) : (
        <div className="space-y-10">
          {currentEvents.length > 0 ? (
            <section>
              <SectionHeading title="A esta hora" subtitle="Eventos que estan ocurriendo en este momento." />
              <div className="grid gap-4 md:grid-cols-2">
                {currentEvents.map((event) => (
                  <EventCard key={event.id} event={event} accent="text-emerald-700" />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading title="Proximos eventos" subtitle="Eventos pendientes por realizar." />
            {upcomingEvents.length === 0 ? (
              <EmptyState message="No hay eventos proximos programados." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} accent="text-emerald-700" />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading title="Eventos realizados" subtitle="." />
            {completedEvents.length === 0 ? (
              <EmptyState message="Aun no hay eventos realizados para mostrar." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedEvents.map((event) => (
                  <EventCard key={event.id} event={event} accent="text-slate-500" />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
