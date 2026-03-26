'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Markdown } from '@/components/ui/markdown';
import { publicApi } from '@/services/public-api';
import { getFileUrl } from '@/lib/utils';
import { DEFAULT_COLLEGIATE_BODIES, DEFAULT_FACULTIES, getCollegiateBodyTheme, mergeCatalog } from '@/lib/collegiate-bodies';

type Person = { id: string; fullName: string; publicDescription?: string; photoUrl?: string };
type Mandate = {
  id: string;
  estateType: string;
  faculty: string;
  program: string;
  description?: string;
  startDate: string;
  person: Person;
};

export default function RepresentantesPublicPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  useEffect(() => {
    publicApi
      .representatives()
      .then((data) => setMandates(data as Mandate[]))
      .catch(() => setMandates([]))
      .finally(() => setLoading(false));
  }, []);

  const collegiateBodies = useMemo(
    () => mergeCatalog(DEFAULT_COLLEGIATE_BODIES, mandates.map((item) => item.estateType)),
    [mandates],
  );
  const faculties = useMemo(
    () => mergeCatalog(DEFAULT_FACULTIES, mandates.map((item) => item.faculty)),
    [mandates],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return mandates.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        item.person.fullName.toLowerCase().includes(normalizedSearch) ||
        item.program.toLowerCase().includes(normalizedSearch) ||
        item.faculty.toLowerCase().includes(normalizedSearch);

      const matchBody = !bodyFilter || item.estateType === bodyFilter;
      const matchFaculty = !facultyFilter || item.faculty === facultyFilter;

      return matchSearch && matchBody && matchFaculty;
    });
  }, [bodyFilter, facultyFilter, mandates, search]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-16 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-10" />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Nuestros Representantes
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-emerald-100 sm:text-xl"
            >
              Conoce a quienes representan a la comunidad en los diferentes cuerpos colegiados de la Universidad de Manizales.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Buscar por nombre, programa o facultad</label>
              <input
                type="text"
                placeholder="Ej. Juan Perez..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Filtrar por cuerpo colegiado</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-emerald-500"
                value={bodyFilter}
                onChange={(e) => setBodyFilter(e.target.value)}
              >
                <option value="">Todos los cuerpos colegiados</option>
                {collegiateBodies.map((body) => (
                  <option key={body} value={body}>
                    {body}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Filtrar por facultad</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-emerald-500"
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
              >
                <option value="">Todas las facultades</option>
                {faculties.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white p-6" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm">
              <h3 className="text-lg font-medium text-slate-900">No se encontraron representantes</h3>
              <p className="mt-2 text-sm text-slate-500">Ajusta la busqueda o los filtros para ver resultados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((mandate, idx) => {
                const theme = getCollegiateBodyTheme(mandate.estateType);

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={mandate.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className={`flex h-28 items-center justify-center bg-gradient-to-r p-4 ${theme.header}`}>
                      <span className={`rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md ${theme.badge}`}>
                        {mandate.estateType}
                      </span>
                    </div>
                    <div className="relative flex flex-1 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,#ffffff_22%)] p-6 pt-12">
                      <div className="absolute -top-10 left-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md">
                        {mandate.person.photoUrl ? (
                          <img src={getFileUrl(mandate.person.photoUrl)} alt="Foto" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl font-bold ${theme.avatar}`}>
                            {mandate.person.fullName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-emerald-700">{mandate.person.fullName}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-600">{mandate.faculty}</p>
                        <Markdown content={mandate.program} className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500" />
                        {mandate.description ? (
                          <Markdown content={mandate.description} className={`mt-2 rounded-lg border p-2 text-xs font-semibold ${theme.detail}`} />
                        ) : null}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Desde {new Date(mandate.startDate).getFullYear()}</span>
                        <Link href={`/perfil/${mandate.person.id}`} className={`text-xs font-semibold transition ${theme.link}`}>
                          Ver perfil &rarr;
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
