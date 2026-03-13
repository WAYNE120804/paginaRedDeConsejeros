'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { motion } from 'framer-motion';
import { getFileUrl } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';

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

type Envelope<T> = { data: T; error: null | { message?: string } };

export default function RepresentantesPublicPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [estateFilter, setEstateFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/representation/active`)
      .then(res => res.json())
      .then((res: Envelope<Mandate[]>) => {
        if (res.data) setMandates(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const uniqueEstates = useMemo(() => Array.from(new Set(mandates.map(m => m.estateType))), [mandates]);
  const uniqueFaculties = useMemo(() => Array.from(new Set(mandates.map(m => m.faculty))), [mandates]);

  const filtered = useMemo(() => {
    return mandates.filter(m => {
      const matchSearch = m.person?.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          m.program.toLowerCase().includes(search.toLowerCase());
      const matchEstate = !estateFilter || m.estateType === estateFilter;
      const matchFaculty = !facultyFilter || m.faculty === facultyFilter;
      return matchSearch && matchEstate && matchFaculty;
    });
  }, [mandates, search, estateFilter, facultyFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />
      
      <main className="flex-1 pb-16">
        <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="mx-auto max-w-4xl px-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Nuestros Representantes
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-emerald-100 sm:text-xl max-w-2xl mx-auto"
            >
              Conoce a los líderes que representan a cada estamento en la Universidad de Manizales, trabajando por la comunidad.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid gap-4 grid-cols-1 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar por nombre o programa</label>
              <input 
                type="text" 
                placeholder="Ej. Juan Pérez..." 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Filtrar por Estamento</label>
              <select 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-emerald-500 bg-white"
                value={estateFilter}
                onChange={e => setEstateFilter(e.target.value)}
              >
                <option value="">Todos los estamentos</option>
                {uniqueEstates.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Filtrar por Facultad</label>
              <select 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-emerald-500 bg-white"
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
              >
                <option value="">Todas las facultades</option>
                {uniqueFaculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-100 h-64"></div>
               ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-medium text-slate-900">No se encontraron representantes</h3>
              <p className="mt-2 text-sm text-slate-500">Intenta ajustar los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((mandate, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  key={mandate.id} 
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative"
                >
                  <div className="h-24 bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center p-4">
                    <span className="bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-emerald-900 uppercase shadow-sm">
                      {mandate.estateType}
                    </span>
                  </div>
                  <div className="flex-1 p-6 relative flex flex-col pt-12">
                    <div className="absolute -top-10 left-6 h-20 w-20 rounded-2xl border-4 border-white bg-slate-100 shadow-md overflow-hidden flex items-center justify-center">
                      {mandate.person?.photoUrl ? (
                         <img src={getFileUrl(mandate.person.photoUrl)} alt="Foto" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-2xl font-bold text-emerald-600">
                          {mandate.person?.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {mandate.person?.fullName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 font-medium">
                        {mandate.faculty}
                      </p>
                      <Markdown 
                        content={mandate.program} 
                        className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2" 
                      />
                      {mandate.description && (
                        <Markdown 
                          content={mandate.description} 
                          className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50"
                        />
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                         Desde {new Date(mandate.startDate).getFullYear()}
                       </span>
                       <a href={`/perfil/${mandate.person?.id}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition">
                         Ver perfil &rarr;
                       </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
