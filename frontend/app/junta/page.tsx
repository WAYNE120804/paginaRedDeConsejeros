'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { getFileUrl } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';

type Person = { id: string; fullName: string; publicDescription?: string; photoUrl?: string };
type BoardPosition = 'PRESIDENTE' | 'VICEPRESIDENTE' | 'FISCAL' | 'SECRETARIA_GENERAL' | 'DIRECTOR_PLANEACION' | 'JEFE_COMUNICACIONES';

type BoardMandate = {
  id: string;
  position: BoardPosition;
  startDate: string;
  isActive: boolean;
  person: Person;
};

type Envelope<T> = { data: T; error: null | { message?: string } };

// Hierarchy helper for sorting
const positionOrder: Record<BoardPosition, number> = {
  PRESIDENTE: 1,
  VICEPRESIDENTE: 2,
  FISCAL: 3,
  SECRETARIA_GENERAL: 4,
  DIRECTOR_PLANEACION: 5,
  JEFE_COMUNICACIONES: 6,
};

export default function JuntaPublicPage() {
  const [board, setBoard] = useState<BoardMandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/board/active`)
      .then(res => res.json())
      .then((res: Envelope<BoardMandate[]>) => {
        if (res.data) {
          // Sort by hierarchy automatically
          const sorted = res.data.sort((a, b) => (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99));
          setBoard(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />
      
      <main className="flex-1 pb-16">
        <section className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-950 py-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="mx-auto max-w-4xl px-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-amber-50 drop-shadow-sm"
            >
              Junta Directiva
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-amber-200/90 sm:text-xl max-w-2xl mx-auto font-medium"
            >
              Conoce a los máximos representantes de la Red de Consejeros encargados de liderar e inspirar la toma de decisiones institucionales.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Miembros Actuales</h2>
            <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-amber-500"></div>
          </div>

          {loading ? (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="animate-pulse bg-white rounded-3xl border border-slate-100 h-[380px]"></div>
               ))}
            </div>
          ) : board.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-3xl mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Junta en Transición</h3>
              <p className="mt-2 text-base text-slate-500 max-w-md mx-auto">Actualmente no hay miembros asignados a la Junta Directiva. Estamos en proceso de actualización de representaciones.</p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center">
              {board.map((member, idx) => {
                const isPresident = member.position === 'PRESIDENTE';
                const isVice = member.position === 'VICEPRESIDENTE';
                const isFiscal = member.position === 'FISCAL';
                const isSecGen = member.position === 'SECRETARIA_GENERAL';
                const isDirPla = member.position === 'DIRECTOR_PLANEACION';
                const isComms = member.position === 'JEFE_COMUNICACIONES';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                    key={member.id} 
                    className={`group flex flex-col rounded-[2rem] bg-white shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative ${
                      isPresident ? 'border-2 border-amber-300 ring-4 ring-amber-50/50 md:scale-105 z-10' : 'border border-slate-100'
                    }`}
                  >
                    {/* Position Label Banner */}
                    <div className={`p-5 text-center transition-colors ${
                      isPresident ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950' :
                      isVice ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                      isFiscal ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' :
                      isSecGen ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white' :
                      isDirPla ? 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white' :
                      isComms ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                       <h3 className="font-bold tracking-[0.15em] text-xs uppercase">{member.position.replace('_', ' ')}</h3>
                    </div>

                    <div className="p-8 flex flex-col items-center flex-1 relative bg-white">
                      
                      {/* Presidential badge icon */}
                      {isPresident && (
                        <div className="absolute top-4 right-4 text-amber-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4h7.6l-6.1 4.5 2.3 7.1-6.2-4.6-6.2 4.6 2.3-7.1-6.1-4.5h7.6z"/></svg>
                        </div>
                      )}

                      <div className={`mb-6 h-32 w-32 shrink-0 rounded-full bg-slate-100 shadow-inner overflow-hidden flex items-center justify-center p-1 ${
                        isPresident ? 'ring-4 ring-amber-100 bg-amber-50' : 'ring-4 ring-slate-50'
                      }`}>
                        <div className="h-full w-full rounded-full overflow-hidden bg-white">
                          {member.person?.photoUrl ? (
                            <img src={getFileUrl(member.person.photoUrl)} alt={member.person.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <div className={`flex h-full w-full items-center justify-center text-4xl font-black ${
                              isPresident ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50'
                            }`}>
                              {member.person?.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center w-full">
                        <h4 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {member.person?.fullName}
                        </h4>
                          {member.person?.publicDescription ? (
                            <Markdown 
                              content={member.person.publicDescription} 
                              className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-4" 
                            />
                          ) : (
                            <p className="mt-3 text-sm text-slate-400 italic">
                              Miembro designado de la junta directiva.
                            </p>
                          )}
                        </div>
                      
                      <div className="mt-auto pt-6 w-full">
                         <a href={`/perfil/${member.person?.id}`} className={`flex w-full justify-center items-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                           isPresident ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                         }`}>
                           Ver Perfil completo
                         </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
