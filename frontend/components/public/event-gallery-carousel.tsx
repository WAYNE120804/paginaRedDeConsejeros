'use client';

import { TouchEvent, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EventPhoto } from '@/lib/types/public';
import { env } from '@/lib/env';

function normalizeImageUrl(photoUrl: string) {
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
  return `${env.uploadsBaseUrl}${photoUrl}`;
}

export function EventGalleryCarousel({ photos }: { photos: EventPhoto[] }) {
  const ordered = useMemo(
    () => [...photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [photos],
  );
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = ordered[index];

  const goPrev = () => setIndex((prev) => (prev === 0 ? ordered.length - 1 : prev - 1));
  const goNext = () => setIndex((prev) => (prev === ordered.length - 1 ? 0 : prev + 1));

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
    if (delta > 45) goPrev();
    if (delta < -45) goNext();
    setTouchStartX(null);
  };

  if (ordered.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">Sin fotos en la galería.</div>;
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={normalizeImageUrl(current.photoUrl)}
          alt={current.caption ?? 'Foto del evento'}
          className="h-[260px] w-full cursor-zoom-in object-cover sm:h-[380px]"
          onClick={() => setViewerOpen(true)}
        />

        {ordered.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/70"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/70"
              aria-label="Siguiente imagen"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}

        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {index + 1}/{ordered.length}
        </div>
      </div>

      {current.caption ? <p className="text-sm text-slate-600">{current.caption}</p> : null}

      {viewerOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" onClick={() => setViewerOpen(false)}>
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/20 p-2 text-white"
            aria-label="Cerrar vista grande"
            onClick={() => setViewerOpen(false)}
          >
            <X size={20} />
          </button>
          <img
            src={normalizeImageUrl(current.photoUrl)}
            alt={current.caption ?? 'Foto ampliada'}
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
