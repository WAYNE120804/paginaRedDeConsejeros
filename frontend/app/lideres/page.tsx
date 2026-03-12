'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';

type Person = { id: string; fullName: string; publicDescription?: string; photoUrl?: string };
type Leader = {
  id: string;
  faculty: string;
  program: string;
  description?: string;
  startDate: string;
  person: Person;
};

type Envelope<T> = { data: T; error: null | { message?: string } };

export default function LideresPublicPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/leaders/active`)
      .then(res => res.json())
      .then((res: Envelope<Leader[]>) => {
        if (res.data) setLeaders(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const uniqueFaculties = useMemo(() => Array.from(new Set(leaders.map(m => m.faculty))), [leaders]);

  const filtered = useMemo(() => {
    return leaders.filter(m => {
      const matchSearch = m.person?.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          m.program.toLowerCase().includes(search.toLowerCase()) ||
                          (m.description?.toLowerCase().includes(search.toLowerCase()));
      const matchFaculty = !facultyFilter || m.faculty === facultyFilter;
      return matchSearch && matchFaculty;
    });
  }, [leaders, search, facultyFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />
      
      <main className="flex-1 pb-16">
        <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 py-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="mx-auto max-w-4xl px-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Líderes Institucionales
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-indigo-100 sm:text-xl max-w-2xl mx-auto"
            >
              Estudiantes excepcionales que impulsan el desarrollo de sus facultades mediante el liderazgo activo.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid gap-4 grid-cols-1 md:grid-cols-2 lg:w-2/3 lg:mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar por nombre, programa o cargo</label>
              <input 
                type="text" 
                placeholder="Ej. Ana Gómez..." 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Filtrar por Facultad</label>
              <select 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition focus:border-indigo-500 bg-white"
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
              >
                <option value="">Todas las facultades</option>
                {uniqueFaculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-100 h-64"></div>
               ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-slate-900">No se encontraron líderes</h3>
              <p className="mt-2 text-sm text-slate-500">Intenta ajustar los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((leader, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: idx * 0.05 }}
                  key={leader.id} 
                  className="group flex flex-col rounded-3xl bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden"
                >
                  <div className="p-6 sm:p-8 flex flex-col h-full relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                     </div>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 rounded-full border-2 border-indigo-100 bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
                        {leader.person?.photoUrl ? (
                           <img src={leader.person.photoUrl} alt="Foto" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 text-2xl font-bold text-indigo-600">
                            {leader.person?.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition">
                          {leader.person?.fullName}
                        </h3>
                        {leader.description && (
                          <p className="text-xs font-medium text-indigo-600 mt-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 inline-block">
                            {leader.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex-1 space-y-2">
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Facultad</p>
                          <p className="text-sm text-slate-700 font-medium">{leader.faculty}</p>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Programa</p>
                          <p className="text-sm text-slate-700 font-medium">{leader.program}</p>
                       </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                         Líder desde {new Date(leader.startDate).getFullYear()}
                       </span>
                       <a href={`/perfil/${leader.person?.id}`} className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition">
                         Perfil
                       </a>
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
