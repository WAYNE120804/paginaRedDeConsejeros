'use client';

import { EmptyState } from '@/components/public/empty-state';
import { EventGalleryMosaic } from '@/components/public/event-gallery-mosaic';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { Markdown } from '@/components/ui/markdown';
import { EventDetail } from '@/lib/types/public';
import { formatEventSlot, getEventTimeSlots } from '@/lib/event-time';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi
      .eventBySlug(params.slug)
      .then((data) => setEvent(data as EventDetail))
      .catch(() => setError('No se pudo cargar el evento.'));
  }, [params.slug]);

  return (
    <PageShell>
      {!event && !error ? <EmptyState message="Cargando evento..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {event ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <SectionHeading title={event.title} subtitle={event.location} />
            <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('es-CO')}</p>
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Horarios del evento</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {getEventTimeSlots(event).map((slot, index) => (
                  <p key={`${event.id}-slot-${index}`}>{formatEventSlot(slot)}</p>
                ))}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-slate-700">{event.description}</p>

            {event.content ? (
              <div className="mt-8 max-w-none border-t border-slate-100 pt-6 text-slate-700">
                <Markdown content={event.content} />
              </div>
            ) : null}
          </section>

          <section>
            <SectionHeading title="Galeria del evento" subtitle="Fotos y momentos destacados" />
            <EventGalleryMosaic photos={event.photos ?? []} />
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
