'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { NewsDetail } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="mb-3 mt-6 text-3xl font-bold text-slate-900" {...props} />,
                h2: ({ ...props }) => <h2 className="mb-3 mt-5 text-2xl font-semibold text-slate-900" {...props} />,
                h3: ({ ...props }) => <h3 className="mb-2 mt-4 text-xl font-semibold text-slate-900" {...props} />,
                p: ({ ...props }) => <p className="mb-3 leading-7 text-slate-700" {...props} />,
                ul: ({ ...props }) => <ul className="mb-4 list-disc space-y-1 pl-6" {...props} />,
                ol: ({ ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-6" {...props} />,
                a: ({ ...props }) => <a className="font-medium text-emerald-700 underline" {...props} />,
                blockquote: ({ ...props }) => <blockquote className="my-4 border-l-4 border-emerald-200 pl-4 italic text-slate-600" {...props} />,
                code: ({ ...props }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm" {...props} />,
              }}
            >
              {news.content}
            </ReactMarkdown>
          </div>
        </article>
      ) : null}
    </PageShell>
  );
}
