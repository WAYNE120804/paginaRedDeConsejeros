'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { EventPhoto } from '@/lib/types/public';
import { getFileUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function EventGalleryMosaic({ photos }: { photos: EventPhoto[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-sm text-slate-500">Sin fotos en la galería de este evento.</p>
      </div>
    );
  }

  // Sort photos by sortOrder
  const orderedPhotos = [...photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {orderedPhotos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="aspect-[4/3] w-full">
              <img
                src={getFileUrl(photo.photoUrl)}
                alt={photo.caption || 'Foto del evento'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
              <div className="rounded-full bg-white/90 p-2 text-slate-900 shadow-lg">
                <ZoomIn size={20} />
              </div>
            </div>

            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox / Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute right-6 top-6 z-[110] rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
            >
              <X size={24} />
            </button>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-full overflow-hidden flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getFileUrl(selectedPhoto.photoUrl)}
                alt={selectedPhoto.caption || 'Foto ampliada'}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              {selectedPhoto.caption && (
                <div className="mt-6 max-w-2xl text-center px-4">
                  <p className="text-lg text-white font-medium">{selectedPhoto.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
