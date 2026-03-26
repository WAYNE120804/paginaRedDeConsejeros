import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/10 bg-white text-emerald-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 text-center lg:text-left">
          <div>
            <p className="text-xl font-semibold text-emerald-950">Red de Consejeros</p>
            <p className="mt-1 text-sm text-slate-600">
              <Link
                href="https://umanizales.edu.co/"
                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 transition hover:text-emerald-950"
              >
                Universidad de Manizales
              </Link>{' '}
              - Participacion estudiantil institucional
            </p>
          </div>

          <p className="text-base font-medium leading-relaxed text-slate-700">
            Cra 9 a # 19-03
            <br />
            Manizales, Caldas.
            <br />
            Colombia
          </p>

          <p className="text-sm text-slate-600">
            Desarrollado por{' '}
            <Link
              href="https://www.linkedin.com/in/jhon-sebastian-diaz-villa-6ab0a51ab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 underline decoration-2 underline-offset-4 transition hover:bg-emerald-100 hover:text-emerald-950"
            >
              Jhon Sebastian Diaz Villa
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 rounded-[2rem] border border-emerald-900/10 bg-slate-50 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <Link href="/" aria-label="Ir al inicio">
            <Image
              src="/assets/logo-red-de-consejeros.png"
              alt="Logo Red de Consejeros"
              width={140}
              height={140}
              className="h-24 w-auto object-contain transition hover:scale-[1.02] sm:h-28"
            />
          </Link>
          <Link href="https://umanizales.edu.co/" aria-label="Ir a Universidad de Manizales">
            <Image
              src="/assets/logo-universidad-de-manizales.png"
              alt="Logo Universidad de Manizales"
              width={140}
              height={140}
              className="h-24 w-auto object-contain transition hover:scale-[1.02] sm:h-28"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
