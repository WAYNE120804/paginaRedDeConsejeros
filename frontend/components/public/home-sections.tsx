'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { publicApi } from '@/services/public-api';
import { DocumentSummary, EventSummary, NewsSummary } from '@/lib/types/public';
import { EmptyState } from './empty-state';
import { SectionHeading } from './section-heading';
import { SkeletonGrid } from './skeleton-grid';

export function HomeSections() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [news, setNews] = useState<NewsSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  const nextEvents = useMemo(() => events.filter((event) => event.computedStatus !== 'FINALIZADO').slice(0, 3), [events]);

  return (
    <div className="mt-10 grid gap-8">
      <section>
        <SectionHeading title="Próximos eventos" subtitle="Agenda pública de la Red de Consejeros" />
        {loading ? (
          <SkeletonGrid items={3} columns="md:grid-cols-3" />
        ) : nextEvents.length === 0 ? (
          <EmptyState message="No hay eventos próximos publicados por ahora." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {nextEvents.map((event) => (
              <motion.article whileHover={{ y: -2 }} key={event.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-emerald-700">{event.computedStatus}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{event.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                <p className="mt-3 text-xs text-slate-400">{new Date(event.date).toLocaleDateString('es-CO')} · {event.location}</p>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="Últimas noticias" subtitle="Información institucional para la comunidad" />
        {loading ? (
          <SkeletonGrid items={3} columns="md:grid-cols-3" />
        ) : news.length === 0 ? (
          <EmptyState message="No hay noticias publicadas aún." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {news.slice(0, 3).map((item) => (
              <motion.article whileHover={{ y: -2 }} key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-500">{item.content}</p>
              </motion.article>
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
