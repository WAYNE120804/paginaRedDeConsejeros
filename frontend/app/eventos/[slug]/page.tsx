'use client';

import { EmptyState } from '@/components/public/empty-state';
import { EventGalleryMosaic } from '@/components/public/event-gallery-mosaic';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { EventDetail } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';
import { Markdown } from '@/components/ui/markdown';

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
      {!event && !error ? (
        <EmptyState message="Cargando evento..." />
      ) : null}

      {error ? <EmptyState message={error} /> : null}

      {event ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <SectionHeading title={event.title} subtitle={event.location} />
            <p className="text-sm text-slate-500">
              {new Date(event.date).toLocaleDateString('es-CO')} · {event.startTime} - {event.endTime}
            </p>
            <p className="mt-4 whitespace-pre-line text-slate-700">{event.description}</p>
            
            {event.content && (
              <div className="mt-8 border-t border-slate-100 pt-6 text-slate-700 max-w-none">
                <Markdown content={event.content} />
              </div>
            )}
          </section>

          <section>
            <SectionHeading title="Galería del evento" subtitle="Fotos y momentos destacados" />
            <EventGalleryMosaic photos={event.photos ?? []} />
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
