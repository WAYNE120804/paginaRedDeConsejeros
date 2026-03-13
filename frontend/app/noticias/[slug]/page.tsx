'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
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
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <SectionHeading
            title={news.title}
            subtitle={news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('es-CO') : 'Noticia publicada'}
          />

          {news.coverPhotoUrl ? (
            <img
              src={normalizeImageUrl(news.coverPhotoUrl)}
              alt={news.title}
              className="mb-5 h-[220px] w-full rounded-xl object-cover sm:h-[340px]"
            />
          ) : null}

          <div className="max-w-none text-slate-700">
            <Markdown content={news.content} />
          </div>
        </article>
      ) : null}
    </PageShell>
  );
}
