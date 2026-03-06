import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
        <div>
          <p className="text-sm font-semibold text-slate-800">Red de Consejeros</p>
          <p className="text-xs text-slate-500">Universidad de Manizales • Participación estudiantil institucional</p>
        </div>
        <div className="flex items-center gap-3">
          <Image src="/assets/logo-red.svg" alt="Logo Red de Consejeros" width={36} height={36} className="rounded-lg" />
          <Image src="/assets/logo-umanizales.svg" alt="Logo Universidad de Manizales" width={36} height={36} className="rounded-lg" />
        </div>
      </div>
    </footer>
  );
}
