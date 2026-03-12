import { ReactNode } from 'react';

export function Modal({ open, onClose, className = 'max-w-md', children }: { open: boolean; onClose: () => void; className?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div className={`w-full rounded-2xl bg-white p-5 shadow-xl ${className}`} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
