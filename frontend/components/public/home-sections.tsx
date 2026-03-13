'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { publicApi } from '@/services/public-api';
import { DocumentSummary, EventSummary, NewsSummary } from '@/lib/types/public';
import { EmptyState } from './empty-state';
import { SectionHeading } from './section-heading';
import { SkeletonGrid } from './skeleton-grid';
import { getFileUrl, getNewsExcerpt } from '@/lib/utils';

function getEventStart(event: EventSummary) {
  return new Date(`${event.date.slice(0, 10)}T${event.startTime}:00`);
}

function getEventEnd(event: EventSummary) {
  return new Date(`${event.date.slice(0, 10)}T${event.endTime}:00`);
}

function scrollContainer(ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') {
  if (!ref.current) return;
  ref.current.scrollBy({
    left: direction === 'left' ? -360 : 360,
    behavior: 'smooth',
  });
}

export function HomeSections() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [news, setNews] = useState<NewsSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const eventsRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([publicApi.homeEvents(), publicApi.homeNews(), publicApi.homeDocuments()])
      .then(([eventsData, newsData, docsData]) => {
        setEvents(eventsData as EventSummary[]);
        setNews(newsData as NewsSummary[]);
        setDocuments(docsData as DocumentSummary[]);
      })
      .catch(() => {
        setEvents([]);
        setNews([]);
        setDocuments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const nextEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => getEventEnd(event) >= now && event.computedStatus !== 'FINALIZADO')
      .sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  }, [events]);

  const latestNews = useMemo(() => news.slice(0, 10), [news]);

  return (
    <div className="mt-10 grid gap-8">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionHeading title="Próximos eventos" subtitle="Agenda pública de la Red de Consejeros" />
          {nextEvents.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollContainer(eventsRef, 'left')}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                aria-label="Mover eventos hacia la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(eventsRef, 'right')}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                aria-label="Mover eventos hacia la derecha"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <SkeletonGrid items={3} columns="md:grid-cols-3" />
        ) : nextEvents.length === 0 ? (
          <EmptyState message="No hay eventos próximos publicados por ahora." />
        ) : (
          <div ref={eventsRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-modern">
            {nextEvents.map((event) => (
              <Link href={`/eventos/${event.slug}`} key={event.id} className="block min-w-[320px] flex-[0_0_320px] snap-start">
                <motion.article whileHover={{ y: -2 }} className="h-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200">
                  <p className="text-xs font-semibold uppercase text-emerald-700">{event.computedStatus}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{event.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(event.date).toLocaleDateString('es-CO')} · {event.location}
                  </p>
                </motion.article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionHeading title="Últimas noticias" subtitle="Información institucional para la comunidad" />
          {latestNews.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollContainer(newsRef, 'left')}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                aria-label="Mover noticias hacia la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(newsRef, 'right')}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                aria-label="Mover noticias hacia la derecha"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <SkeletonGrid items={3} columns="md:grid-cols-3" />
        ) : latestNews.length === 0 ? (
          <EmptyState message="No hay noticias publicadas aún." />
        ) : (
          <div ref={newsRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-modern">
            {latestNews.map((item) => (
              <Link href={`/noticias/${item.slug}`} key={item.id} className="block min-w-[320px] flex-[0_0_320px] snap-start">
                <motion.article whileHover={{ y: -2 }} className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-100">
                  {item.coverPhotoUrl ? (
                    <img
                      src={getFileUrl(item.coverPhotoUrl)}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : null}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-500">{getNewsExcerpt(item.content, 140)}</p>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="Documentos públicos destacados" />
        {loading ? (
          <SkeletonGrid items={4} columns="md:grid-cols-2" />
        ) : documents.length === 0 ? (
          <EmptyState message="Aún no se han publicado documentos." />
        ) : (
          <div className="grid gap-3">
            {documents.slice(0, 4).map((doc) => (
              <motion.article whileHover={{ y: -2 }} key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p className="font-semibold text-slate-800">{doc.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">{doc.category}</p>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
