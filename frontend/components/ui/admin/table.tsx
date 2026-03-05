import { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200">{children}</div>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">{children}</th>;
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 text-sm text-slate-700">{children}</td>;
}
