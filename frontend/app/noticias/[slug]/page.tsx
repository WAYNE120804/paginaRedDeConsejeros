'use client';

import { EmptyState } from '@/components/public/empty-state';
import { PageShell } from '@/components/ui/page-shell';
import { NewsDetail } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';
import { Markdown } from '@/components/ui/markdown';
import { env } from '@/lib/env';

function normalizeImageUrl(photoUrl: string) {
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
  return `${env.uploadsBaseUrl}${photoUrl}`;
}

export default function NewsDetailPage({ params }: { params: { slug: string } }) {
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi
      .newsBySlug(params.slug)
      .then((data) => setNews(data as NewsDetail))
      .catch(() => setError('No se pudo cargar la noticia.'));
  }, [params.slug]);

  return (
    <PageShell>
      {!news && !error ? <EmptyState message="Cargando noticia..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {news ? (
        <article className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_100%)] px-6 py-8 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Sala de redaccion</p>
            <h1 className="mt-3 max-w-4xl font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {news.title}
            </h1>
            <p className="mt-4 text-sm text-slate-500">
              {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Noticia publicada'}
            </p>
          </div>

          {news.coverPhotoUrl ? (
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <img
                src={normalizeImageUrl(news.coverPhotoUrl)}
                alt={news.title}
                className="h-[240px] w-full rounded-[1.75rem] object-cover sm:h-[420px]"
              />
            </div>
          ) : null}

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <Markdown content={news.content} variant="news" className="max-w-none text-slate-700" />
          </div>
        </article>
      ) : null}
    </PageShell>
  );
}
