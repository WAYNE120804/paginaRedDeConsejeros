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
import { formatEventSlot, getEventEnd, getEventTimeSlots, getNextEventMoment } from '@/lib/event-time';

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
      .sort(
        (a, b) =>
          (getNextEventMoment(a, now)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (getNextEventMoment(b, now)?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );
  }, [events]);

  const latestNews = useMemo(() => news.slice(0, 10), [news]);

  return (
    <div className="mt-10 grid gap-8">
      <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionHeading title="Proximos eventos" subtitle="Agenda publica de la Red de Consejeros" />
          {nextEvents.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollContainer(eventsRef, 'left')}
                className="rounded-full border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 transition hover:border-amber-300 hover:text-emerald-900"
                aria-label="Mover eventos hacia la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(eventsRef, 'right')}
                className="rounded-full border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 transition hover:border-amber-300 hover:text-emerald-900"
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
          <EmptyState message="No hay eventos proximos publicados por ahora." />
        ) : (
          <div ref={eventsRef} className="scroll-modern flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {nextEvents.map((event) => (
              <Link href={`/eventos/${event.slug}`} key={event.id} className="block min-w-[320px] flex-[0_0_320px] snap-start">
                <motion.article whileHover={{ y: -4 }} className="h-full rounded-[1.7rem] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff,#f8fff8)] p-5 shadow-sm transition hover:border-amber-300/80 hover:shadow-[0_20px_45px_rgba(0,102,51,0.1)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{event.computedStatus}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{event.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                  <p className="mt-3 text-xs text-slate-400">{new Date(event.date).toLocaleDateString('es-CO')} - {event.location}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {getEventTimeSlots(event).map((slot, index) => (
                      <p key={`${event.id}-slot-${index}`}>{formatEventSlot(slot)}</p>
                    ))}
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionHeading title="Ultimas noticias" subtitle="Informacion institucional para la comunidad" />
          {latestNews.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollContainer(newsRef, 'left')}
                className="rounded-full border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 transition hover:border-amber-300 hover:text-emerald-900"
                aria-label="Mover noticias hacia la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(newsRef, 'right')}
                className="rounded-full border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 transition hover:border-amber-300 hover:text-emerald-900"
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
          <EmptyState message="No hay noticias publicadas aun." />
        ) : (
          <div ref={newsRef} className="scroll-modern flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {latestNews.map((item) => (
              <Link href={`/noticias/${item.slug}`} key={item.id} className="block min-w-[320px] flex-[0_0_320px] snap-start">
                <motion.article whileHover={{ y: -4 }} className="h-full overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm transition hover:border-amber-300/70 hover:shadow-[0_20px_45px_rgba(0,102,51,0.08)]">
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

      <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
        <SectionHeading title="Documentos publicos destacados" />
        {loading ? (
          <SkeletonGrid items={4} columns="md:grid-cols-2" />
        ) : documents.length === 0 ? (
          <EmptyState message="Aun no se han publicado documentos." />
        ) : (
          <div className="grid gap-3">
            {documents.slice(0, 4).map((doc) => (
              <motion.article whileHover={{ y: -3 }} key={doc.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#fbfdf7)] p-4 text-sm shadow-sm transition hover:border-amber-300/70">
                <p className="font-semibold text-slate-800">{doc.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-700">{doc.category}</p>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
