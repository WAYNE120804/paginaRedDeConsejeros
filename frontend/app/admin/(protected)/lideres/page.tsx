'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { Modal } from '@/components/ui/admin/modal';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { WikiMediaManager } from '@/components/admin/wiki-media-manager';
import { getFileUrl } from '@/lib/utils';

const FACULTIES = [
  'Facultad de Ciencias e Ingeniería',
  'Facultad de Ciencias de la Salud',
  'Facultad de Derecho y Ciencias Jurídicas',
  'Facultad de Ciencias Contables, Económicas y Administrativas',
  'Facultad de Ciencias Sociales y Humanas',
  'N/A – Aplica a toda la universidad',
];

type Person = { 
  id: string; 
  fullName: string; 
  studentCode: string; 
  birthday?: string;
  phone?: string;
  institutionalEmail?: string;
  tshirtSize?: string;
  publicDescription?: string;
  photoUrl?: string;
};
type Leader = {
  id: string;
  personId: string;
  faculty: string;
  program: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  person: Person;
};
type Envelope<T> = { data: T; error: null | { message?: string } };

const emptyForm = {
  personId: '',
  faculty: FACULTIES[0],
  program: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
};

const emptyPersonForm = {
  studentCode: '',
  fullName: '',
  institutionalEmail: '',
  phone: '',
  birthday: '',
  tshirtSize: '',
  publicDescription: '',
  photoUrl: '',
};

export default function LideresAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Leader | null>(null);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [wikiSelectionMode, setWikiSelectionMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [personForm, setPersonForm] = useState(emptyPersonForm);

  const loadData = async () => {
    try {
      const res = await apiClient.get<Envelope<Leader[]>>('/leaders/active');
      setLeaders(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) loadData(); }, [canManage]);

  const searchPeople = async () => {
    if (!peopleSearch.trim()) return;
    try {
      const res = await apiClient.get<Envelope<Person[]>>(`/people?query=${encodeURIComponent(peopleSearch)}`);
      setPeopleResults(res.data);
    } catch {
      toast.error('Error buscando personas');
    }
  };

  const createNewPerson = async () => {
    if (!personForm.studentCode || !personForm.fullName || !personForm.institutionalEmail || !personForm.phone) {
      return toast.error('Código, nombre, correo y teléfono son obligatorios');
    }
    try {
      const res = await apiClient.post<Envelope<Person>>('/people', {
        ...personForm,
        birthday: personForm.birthday ? new Date(personForm.birthday).toISOString() : undefined,
      });
      toast.success('Persona creada');
      setSelectedPerson(res.data);
      setForm(v => ({ ...v, personId: res.data.id }));
      setShowNewPerson(false);
      setPersonForm(emptyPersonForm);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const saveLeader = async () => {
    if (!selectedPerson && !form.personId) return toast.error('Selecciona una persona');
    setLoading(true);
    try {
      const isEdit = !!editTarget;
      const personIdToUpdate = selectedPerson?.id ?? form.personId;

      // 1. Datos Persona
      await apiClient.patch(`/people/${personIdToUpdate}`, {
        fullName: personForm.fullName,
        studentCode: personForm.studentCode,
        institutionalEmail: personForm.institutionalEmail,
        phone: personForm.phone,
        birthday: personForm.birthday ? new Date(personForm.birthday).toISOString() : undefined,
        tshirtSize: personForm.tshirtSize || undefined,
        publicDescription: personForm.publicDescription,
        photoUrl: personForm.photoUrl,
      });

      // 2. Líder
      const { personId, ...leaderData } = form;
      const payload = {
        ...(isEdit ? leaderData : form),
        personId: personIdToUpdate,
        startDate: new Date(form.startDate).toISOString(),
      };

      if (isEdit) {
        await apiClient.patch(`/leaders/${editTarget.id}`, payload);
        toast.success('Líder y datos personales actualizados');
      } else {
        await apiClient.post('/leaders', payload);
        toast.success('Líder registrado con éxito');
      }

      resetModal();
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deactivateLeader = async (id: string) => {
    if (!confirm('¿Desactivar este líder?')) return;
    try {
      await apiClient.patch(`/leaders/${id}/deactivate`, { endDate: new Date().toISOString() });
      toast.success('Líder desactivado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteLeader = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este registro de liderazgo?')) return;
    try {
      await apiClient.delete(`/leaders/${id}`);
      toast.success('Registro eliminado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetModal = () => {
    setOpenCreate(false);
    setEditTarget(null);
    setForm(emptyForm);
    setPersonForm(emptyPersonForm);
    setPeopleSearch('');
    setPeopleResults([]);
    setSelectedPerson(null);
    setShowNewPerson(false);
  };

  const startEdit = (l: Leader) => {
    setEditTarget(l);
    setSelectedPerson(l.person);
    setForm({
      personId: l.personId,
      faculty: l.faculty,
      program: l.program,
      description: l.description || '',
      startDate: new Date(l.startDate).toISOString().split('T')[0],
    });
    setPersonForm({
      studentCode: l.person.studentCode,
      fullName: l.person.fullName,
      institutionalEmail: l.person.institutionalEmail || '',
      phone: l.person.phone || '',
      birthday: l.person.birthday ? new Date(l.person.birthday).toISOString().split('T')[0] : '',
      tshirtSize: l.person.tshirtSize || '',
      publicDescription: l.person.publicDescription || '',
      photoUrl: l.person.photoUrl || '',
    });
    setOpenCreate(true);
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">Sin permisos para gestionar líderes.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">Líderes Institucionales Activos</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>Registrar Líder</Button>
        </div>
      </Card>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>Persona</Th>
                <Th>Cumpleaños</Th>
                <Th>Facultad / Programa</Th>
                <Th>Descripción / Cargo</Th>
                <Th>Inicio</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <Td>
                    <span className="font-medium">{m.person?.fullName}</span>
                    <span className="block text-xs text-slate-500">{m.person?.studentCode}</span>
                  </Td>
                  <Td>{m.person?.birthday ? new Date(m.person.birthday).toLocaleDateString() : '--'}</Td>
                  <Td>
                    {m.faculty}
                    <span className="block text-xs text-slate-500">{m.program}</span>
                  </Td>
                  <Td>{m.description || <span className="text-slate-400">--</span>}</Td>
                  <Td>{new Date(m.startDate).toLocaleDateString()}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      <Button className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-1 text-xs" onClick={() => startEdit(m)}>Editar</Button>
                      <Button className="border border-amber-200 text-amber-700 hover:bg-amber-50 py-1 text-xs" onClick={() => deactivateLeader(m.id)}>Desactivar</Button>
                      <Button className="border border-red-200 text-red-700 hover:bg-red-50 py-1 text-xs" onClick={() => deleteLeader(m.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {leaders.length === 0 && (
                <tr><Td colSpan={6} className="text-center py-8 text-slate-400">No hay líderes activos</Td></tr>
              )}
            </tbody>
          </table>
        </Table>
      </div>

      <Modal open={openCreate} onClose={resetModal} className="max-w-xl">
        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar p-1">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Líder Institucional</h2>
          <div className="mt-4 space-y-4">

            {/* Búsqueda / creación persona */}
            {!showNewPerson ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Buscar persona</label>
                <div className="flex gap-2">
                  <Input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Código o nombre" onKeyDown={(e) => e.key === 'Enter' && searchPeople()} />
                  <Button className="bg-slate-100 text-slate-800 shrink-0" onClick={searchPeople}>Buscar</Button>
                </div>
                {peopleResults.length > 0 && !selectedPerson && (
                  <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-auto bg-slate-50">
                    {peopleResults.map(p => (
                      <div key={p.id} className="p-2 hover:bg-emerald-50 cursor-pointer rounded-lg text-sm transition" onClick={() => { 
                        setSelectedPerson(p); 
                        setForm(v => ({ ...v, personId: p.id }));
                        setPersonForm({
                          studentCode: p.studentCode,
                          fullName: p.fullName,
                          institutionalEmail: p.institutionalEmail || '',
                          phone: p.phone || '',
                          birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
                          tshirtSize: p.tshirtSize || '',
                          publicDescription: p.publicDescription || '',
                          photoUrl: p.photoUrl || '',
                        });
                      }}>
                        <span className="font-medium text-slate-800">{p.fullName}</span>
                        <span className="ml-2 text-xs text-slate-500">{p.studentCode}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPerson ? (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-sm flex justify-between items-center border border-emerald-100">
                    <span>✓ <strong>{selectedPerson.fullName}</strong></span>
                    <button onClick={() => setSelectedPerson(null)} className="text-emerald-700 underline text-xs">Cambiar</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewPerson(true)} className="text-sm text-emerald-700 underline hover:text-emerald-900">
                    ¿No existe aún? + Registrar nueva persona
                  </button>
                )}
              </div>
            ) : null}

            {(showNewPerson || editTarget) && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {editTarget ? 'Editar Datos Personales' : 'Nueva persona'}
                  </h3>
                  {!editTarget && <button onClick={() => setShowNewPerson(false)} className="text-xs text-slate-500 underline">Cancelar</button>}
                </div>

                <div className="flex items-center gap-4 py-2 border-b border-slate-100 mb-2">
                   <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                      {personForm.photoUrl ? (
                        <img src={getFileUrl(personForm.photoUrl)} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                          {personForm.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                   </div>
                   <div>
                      <Button 
                        className="bg-white border border-slate-200 text-slate-700 text-xs py-1"
                        onClick={() => { setWikiSelectionMode(true); setOpenWiki(true); }}
                      >
                        Cambiar Foto
                      </Button>
                      {personForm.photoUrl && (
                        <button 
                          onClick={() => setPersonForm(v => ({ ...v, photoUrl: '' }))}
                          className="ml-2 text-xs text-red-500 underline"
                        >
                          Quitar
                        </button>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Código *" value={personForm.studentCode} onChange={e => setPersonForm(v => ({ ...v, studentCode: e.target.value }))} />
                  <Input placeholder="Teléfono *" value={personForm.phone} onChange={e => setPersonForm(v => ({ ...v, phone: e.target.value }))} />
                </div>
                <Input placeholder="Nombre completo *" value={personForm.fullName} onChange={e => setPersonForm(v => ({ ...v, fullName: e.target.value }))} />
                <Input type="email" placeholder="Correo institucional *" value={personForm.institutionalEmail} onChange={e => setPersonForm(v => ({ ...v, institutionalEmail: e.target.value }))} />
                <div>
                  <label className="text-xs text-slate-500">Cumpleaños</label>
                  <Input type="date" value={personForm.birthday} onChange={e => setPersonForm(v => ({ ...v, birthday: e.target.value }))} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-500">Perfil / Biografía (Markdown)</label>
                    <button onClick={() => { setWikiSelectionMode(false); setOpenWiki(true); }} className="text-xs text-emerald-600 underline flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                       Wiki Imagen
                    </button>
                  </div>
                  <textarea 
                    className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono scroll-modern" 
                    placeholder="Descripción pública..." 
                    value={personForm.publicDescription} 
                    onChange={e => setPersonForm(v => ({ ...v, publicDescription: e.target.value }))} 
                  />
                </div>

                {!editTarget && <Button className="bg-indigo-600 text-white w-full" onClick={createNewPerson}>Crear y seleccionar</Button>}
              </div>
            )}

            {/* Campos del líder */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Facultad *</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.faculty} onChange={e => setForm(v => ({ ...v, faculty: e.target.value }))}>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Talla de Camiseta</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={personForm.tshirtSize} onChange={e => setPersonForm(v => ({ ...v, tshirtSize: e.target.value }))}>
                    <option value="">-- Sin talla --</option>
                    {['XS','S','M','L','XL','XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Descripción / Cargo (opcional)</label>
                <Input placeholder="Ej. Coordinador de proyección social" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
                <Input type="date" value={form.startDate} onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))} />
              </div>

              <Button className="bg-emerald-700 text-white w-full mt-2" disabled={loading} onClick={saveLeader}>
                {loading ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Guardar Líder'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl p-0 overflow-hidden">
         <WikiMediaManager 
            onClose={() => setOpenWiki(false)} 
            selectionMode={wikiSelectionMode}
            onSelect={(url) => {
              if (wikiSelectionMode) {
                setPersonForm(v => ({ ...v, photoUrl: url }));
                setOpenWiki(false);
              } else {
                // Modo markdown insertion (esto se maneja dentro del textarea usualmente, 
                // pero si el textarea no es ref, podemos intentar copiar al clipboard o similar?
                // El WikiMediaManager ya copia al clipboard por defecto si no hay onSelect? 
                // No, si hay onSelect lo usa.
                // Lo dejaremos para que copie al clipboard si no es selectionMode.
                navigator.clipboard.writeText(`![imagen](${url})`);
                toast.success('Link de imagen copiado');
              }
            }}
         />
      </Modal>
    </div>
  );
}
