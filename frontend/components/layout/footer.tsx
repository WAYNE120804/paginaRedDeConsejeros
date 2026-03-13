import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 text-slate-900">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 text-center lg:text-left">
          <div>
            <p className="text-xl font-semibold text-slate-900">Red de Consejeros</p>
            <p className="mt-1 text-sm text-slate-600">Universidad de Manizales • Participacion estudiantil institucional</p>
          </div>

          <p className="text-base font-medium leading-relaxed text-slate-800">
            Cra 9 a # 19-03
            <br />
            Manizales, Caldas.
            <br />
            Colombia
          </p>

          <p className="text-sm text-slate-600">
            Desarrollado por:{' '}
            <Link
              href="https://www.linkedin.com/in/jhon-sebastian-diaz-villa-6ab0a51ab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 underline decoration-2 underline-offset-4 transition hover:bg-blue-200 hover:text-blue-800"
            >
              Jhon Sebastian Diaz Villa
              <span className="ml-2 text-xs no-underline">↗</span>
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Image
            src="/assets/logo-red-de-consejeros.png"
            alt="Logo Red de Consejeros"
            width={140}
            height={140}
            className="h-24 w-auto object-contain sm:h-28"
          />
          <Image
            src="/assets/logo-universidad-de-manizales.png"
            alt="Logo Universidad de Manizales"
            width={140}
            height={140}
            className="h-24 w-auto object-contain sm:h-28"
          />
        </div>
      </div>
    </footer>
  );
}
