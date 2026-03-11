'use client';

import { EmptyState } from '@/components/public/empty-state';
import { SectionHeading } from '@/components/public/section-heading';
import { PageShell } from '@/components/ui/page-shell';
import { DocumentSummary } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { env } from '@/lib/env';
import { DEFAULT_DOCUMENT_CATEGORIES, mergeDefaultWithDynamic } from '@/lib/institutional-catalogs';

const CATEGORY_LABEL: Record<DocumentSummary['category'], string> = {
  ESTATUTOS: 'Estatutos',
  REGLAMENTOS: 'Reglamentos',
  LINEAMIENTOS: 'Lineamientos',
  COMUNICADOS: 'Comunicados',
};

export default function DocumentsPage() {
  const [items, setItems] = useState<DocumentSummary[]>([]);
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentSummary | null>(null);

  useEffect(() => {
    publicApi.homeDocuments().then((data) => setItems(data as DocumentSummary[])).catch(() => setItems([]));
  }, []);

  const categories = useMemo(
    () => ['ALL', ...mergeDefaultWithDynamic(DEFAULT_DOCUMENT_CATEGORIES, items.map((item) => item.category))],
    [items],
  );

  const filtered = items.filter((item) => {
    const byCategory = category === 'ALL' || item.category === category;
    const byQuery =
      !query ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(query.toLowerCase());
    return byCategory && byQuery;
  });

  return (
    <PageShell>
      <SectionHeading title="Documentos públicos" subtitle="Normativa, lineamientos y comunicados para la comunidad" />

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === value
                  ? 'bg-emerald-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              {value === 'ALL' ? 'Todas' : CATEGORY_LABEL[value as DocumentSummary['category']] ?? value}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título o descripción"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No hay documentos para este filtro." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">
                    {CATEGORY_LABEL[doc.category] ?? doc.category}
                  </p>
                  {doc.description ? <p className="mt-2 text-sm text-slate-600">{doc.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-400">
                    Publicado: {new Date(doc.publishedAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                    <FileText size={16} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye size={14} /> Ver
                  </button>
                  <a
                    href={`${env.apiBaseUrl}/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Download size={14} /> Descargar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Vista previa: {previewDoc.title}</p>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
            <iframe
              title={`Vista previa ${previewDoc.title}`}
              src={`${env.apiBaseUrl}/documents/${previewDoc.id}/download`}
              className="h-full w-full rounded-b-2xl"
            />
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
