'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { publicApi } from '@/services/public-api';
import { getFileUrl } from '@/lib/utils';
import { DEFAULT_FACULTIES, mergeCatalog } from '@/lib/collegiate-bodies';

type Person = { id: string; fullName: string; publicDescription?: string; photoUrl?: string };
type Leader = {
  id: string;
  faculty: string;
  program: string;
  description?: string;
  startDate: string;
  person: Person;
};

export default function LideresPublicPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  useEffect(() => {
    publicApi
      .leaders()
      .then((data) => setLeaders(data as Leader[]))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  const faculties = useMemo(
    () => mergeCatalog(DEFAULT_FACULTIES, leaders.map((item) => item.faculty)),
    [leaders],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leaders.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        item.person.fullName.toLowerCase().includes(normalizedSearch) ||
        item.program.toLowerCase().includes(normalizedSearch) ||
        item.faculty.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch);

      const matchFaculty = !facultyFilter || item.faculty === facultyFilter;
      return matchSearch && matchFaculty;
    });
  }, [facultyFilter, leaders, search]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 py-16 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-10" />
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Lideres Institucionales
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100 sm:text-xl"
            >
              Estudiantes que impulsan procesos institucionales y fortalecen la participacion desde sus facultades.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2 lg:mx-auto lg:w-2/3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Buscar por nombre, programa, facultad o cargo</label>
              <input
                type="text"
                placeholder="Ej. Ana Gomez..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Filtrar por facultad</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition focus:border-indigo-500"
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white p-6" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm">
              <h3 className="text-lg font-medium text-slate-900">No se encontraron lideres</h3>
              <p className="mt-2 text-sm text-slate-500">Ajusta la busqueda o la facultad para ver resultados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((leader, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={leader.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative flex h-full flex-col p-6 sm:p-8">
                    <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-5">
                      <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-100 bg-slate-100 shadow-sm">
                        {leader.person.photoUrl ? (
                          <img src={getFileUrl(leader.person.photoUrl)} alt="Foto" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 text-2xl font-bold text-indigo-600">
                            {leader.person.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold leading-tight text-slate-900 transition group-hover:text-indigo-700">
                          {leader.person.fullName}
                        </h3>
                        {leader.description ? (
                          <p className="mt-1 inline-block rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                            {leader.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-6 flex-1 space-y-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Facultad</p>
                        <p className="text-sm font-medium text-slate-700">{leader.faculty}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Programa</p>
                        <p className="text-sm font-medium text-slate-700">{leader.program}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Lider desde {new Date(leader.startDate).getFullYear()}</span>
                      <Link href={`/perfil/${leader.person.id}`} className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
                        Perfil
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
