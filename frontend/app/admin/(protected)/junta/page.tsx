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

type Person = { id: string; fullName: string; studentCode: string; photoUrl?: string };
type BoardMandate = {
  id: string;
  position: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  person: Person;
};
type Envelope<T> = { data: T; error: null | { message?: string } };

const POSITIONS = ['PRESIDENTE', 'VICEPRESIDENTE', 'FISCAL', 'SECRETARIA_GENERAL', 'DIRECTOR_PLANEACION', 'JEFE_COMUNICACIONES'];

const emptyPersonForm = {
  studentCode: '',
  fullName: '',
  institutionalEmail: '',
  phone: '',
  birthday: '',
  tshirtSize: '',
  photoUrl: '',
};

export default function JuntaAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [mandates, setMandates] = useState<BoardMandate[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [form, setForm] = useState({
    personId: '',
    position: 'PRESIDENTE',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [personForm, setPersonForm] = useState(emptyPersonForm);

  const loadData = async () => {
    try {
      const res = await apiClient.get<Envelope<BoardMandate[]>>('/board/active');
      setMandates(res.data);
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

  const createMandate = async () => {
    if (!selectedPerson) return toast.error('Selecciona una persona');
    try {
      await apiClient.post('/board/mandates', {
        ...form,
        personId: selectedPerson.id,
        startDate: new Date(form.startDate).toISOString(),
      });
      toast.success('Miembro de junta registrado');
      resetModal();
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const closeMandate = async (id: string) => {
    if (!confirm('¿Finalizar este mandato?')) return;
    try {
      await apiClient.patch(`/board/mandates/${id}/close`, { endDate: new Date().toISOString() });
      toast.success('Mandato finalizado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteMandate = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este registro de junta directiva?')) return;
    try {
      await apiClient.delete(`/board/mandates/${id}`);
      toast.success('Registro eliminado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetModal = () => {
    setOpenCreate(false);
    setForm({ personId: '', position: 'PRESIDENTE', startDate: new Date().toISOString().split('T')[0] });
    setPeopleSearch('');
    setPeopleResults([]);
    setSelectedPerson(null);
    setShowNewPerson(false);
    setPersonForm(emptyPersonForm);
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">Sin permisos para gestionar la Junta Directiva.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">Junta Directiva Vigente</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>Agregar Miembro</Button>
        </div>
      </Card>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>Persona</Th>
                <Th>Cargo</Th>
                <Th>Inicio</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {mandates.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <Td>
                    <span className="font-medium">{m.person?.fullName}</span>
                    <span className="block text-xs text-slate-500">{m.person?.studentCode}</span>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.position === 'PRESIDENTE' ? 'bg-amber-100 text-amber-800' :
                      m.position === 'VICEPRESIDENTE' ? 'bg-blue-100 text-blue-800' :
                      m.position === 'FISCAL' ? 'bg-red-100 text-red-800' :
                      m.position === 'SECRETARIA_GENERAL' ? 'bg-purple-100 text-purple-800' :
                      m.position === 'DIRECTOR_PLANEACION' ? 'bg-indigo-100 text-indigo-800' :
                      m.position === 'JEFE_COMUNICACIONES' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {m.position.replace('_', ' ')}
                    </span>
                  </Td>
                  <Td>{new Date(m.startDate).toLocaleDateString()}</Td>
                  <Td>
                    <span className="text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">Activo</span>
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      <Button className="border border-amber-200 text-amber-700 hover:bg-amber-50 py-1 text-xs" onClick={() => closeMandate(m.id)}>Finalizar</Button>
                      <Button className="border border-red-200 text-red-700 hover:bg-red-50 py-1 text-xs" onClick={() => deleteMandate(m.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {mandates.length === 0 && (
                <tr><Td colSpan={5} className="text-center py-8 text-slate-400">No hay miembros en la junta directiva actual</Td></tr>
              )}
            </tbody>
          </table>
        </Table>
      </div>

      <Modal open={openCreate} onClose={resetModal} className="max-w-xl">
        <h2 className="text-lg font-semibold text-slate-900">Agregar Miembro a la Junta Directiva</h2>
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
                    <div key={p.id} className="p-2 hover:bg-emerald-50 cursor-pointer rounded-lg text-sm transition" onClick={() => { setSelectedPerson(p); setForm(v => ({ ...v, personId: p.id })); }}>
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
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Nueva persona</h3>
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
                      className="bg-white border border-slate-200 text-slate-700 text-[10px] py-1 h-7"
                      onClick={() => setOpenWiki(true)}
                    >
                      Cambiar Foto
                    </Button>
                    {personForm.photoUrl && (
                      <button 
                        onClick={() => setPersonForm(v => ({ ...v, photoUrl: '' }))}
                        className="ml-2 text-[10px] text-red-500 underline"
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Cumpleaños</label>
                  <Input type="date" value={personForm.birthday} onChange={e => setPersonForm(v => ({ ...v, birthday: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Talla</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" value={personForm.tshirtSize} onChange={e => setPersonForm(v => ({ ...v, tshirtSize: e.target.value }))}>
                    <option value="">--</option>
                    {['XS','S','M','L','XL','XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <Button className="bg-indigo-600 text-white w-full" onClick={createNewPerson}>Crear y seleccionar</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Cargo *</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                value={form.position}
                onChange={(e) => setForm(v => ({ ...v, position: e.target.value }))}
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm(v => ({ ...v, startDate: e.target.value }))} />
            </div>
          </div>

          <Button className="bg-emerald-700 text-white w-full mt-2" onClick={createMandate}>Guardar Miembro</Button>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl p-0 overflow-hidden">
         <WikiMediaManager 
            onClose={() => setOpenWiki(false)} 
            selectionMode={true}
            onSelect={(url) => {
                setPersonForm(v => ({ ...v, photoUrl: url }));
                setOpenWiki(false);
            }}
         />
      </Modal>
    </div>
  );
}
