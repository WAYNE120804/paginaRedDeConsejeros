import { ReactNode } from 'react';

export function Modal({ open, onClose, className = 'max-w-md', children }: { open: boolean; onClose: () => void; className?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4" onClick={onClose}>
      <div className="flex min-h-full items-start justify-center py-4">
        <div className={`w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ${className}`} onClick={(event) => event.stopPropagation()}>
          {children}
        </div>
      </div>
      
    </div>
  );
}
