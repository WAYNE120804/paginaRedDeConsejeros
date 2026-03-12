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

const FACULTIES = [
  'Facultad de Ciencias e Ingeniería',
  'Facultad de Ciencias de la Salud',
  'Facultad de Derecho y Ciencias Jurídicas',
  'Facultad de Ciencias Contables, Económicas y Administrativas',
  'Facultad de Ciencias Sociales y Humanas',
  'N/A – Aplica a toda la universidad',
];

type Person = { id: string; fullName: string; studentCode: string; birthday?: string };
type Leader = {
  id: string;
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
};

export default function LideresAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [showNewPerson, setShowNewPerson] = useState(false);

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

  const createLeader = async () => {
    if (!selectedPerson) return toast.error('Selecciona una persona');
    try {
      await apiClient.post<Envelope<Leader>>('/leaders', {
        ...form,
        personId: selectedPerson.id,
        startDate: new Date(form.startDate).toISOString(),
      });
      toast.success('Líder registrado');
      resetModal();
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
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
    setForm(emptyForm);
    setPeopleSearch('');
    setPeopleResults([]);
    setSelectedPerson(null);
    setShowNewPerson(false);
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

      {/* Modal Crear */}
      <Modal open={openCreate} onClose={resetModal} className="max-w-xl">
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
                <button onClick={() => setShowNewPerson(false)} className="text-xs text-slate-500 underline">Cancelar</button>
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

          {/* Campos del líder */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Facultad *</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.faculty} onChange={e => setForm(v => ({ ...v, faculty: e.target.value }))}>
              {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Programa</label>
            <Input placeholder="Ej. Ingeniería Biomédica" value={form.program} onChange={e => setForm(v => ({ ...v, program: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Descripción / Cargo (opcional)</label>
            <Input placeholder="Ej. Coordinador de proyección social" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
            <Input type="date" value={form.startDate} onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))} />
          </div>

          <Button className="bg-emerald-700 text-white w-full mt-2" onClick={createLeader}>Guardar Líder</Button>
        </div>
      </Modal>
    </div>
  );
}
