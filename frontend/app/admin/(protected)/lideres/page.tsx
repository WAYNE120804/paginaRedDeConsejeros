'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_FACULTIES, mergeCatalog } from '@/lib/collegiate-bodies';

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

type LeaderForm = {
  personId: string;
  faculty: string;
  program: string;
  description: string;
  startDate: string;
};

type PersonForm = {
  studentCode: string;
  fullName: string;
  institutionalEmail: string;
  phone: string;
  birthday: string;
  tshirtSize: string;
  publicDescription: string;
  photoUrl: string;
};

const emptyForm: LeaderForm = {
  personId: '',
  faculty: DEFAULT_FACULTIES[0],
  program: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
};

const emptyPersonForm: PersonForm = {
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
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

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

  useEffect(() => {
    if (canManage) loadData();
  }, [canManage]);

  const faculties = useMemo(
    () => mergeCatalog(DEFAULT_FACULTIES, leaders.map((item) => item.faculty)),
    [leaders],
  );

  const filteredLeaders = useMemo(() => {
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return leaders.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        item.person.fullName.toLowerCase().includes(normalizedSearch) ||
        item.person.studentCode.toLowerCase().includes(normalizedSearch) ||
        item.program.toLowerCase().includes(normalizedSearch) ||
        item.faculty.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch);

      const matchFaculty = !facultyFilter || item.faculty === facultyFilter;
      return matchSearch && matchFaculty;
    });
  }, [facultyFilter, leaders, tableSearch]);

  const searchPeople = async (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setPeopleResults([]);
      return;
    }

    setSearchingPeople(true);
    try {
      const res = await apiClient.get<Envelope<Person[]>>(`/people?query=${encodeURIComponent(normalizedQuery)}`);
      setPeopleResults(res.data);
    } catch {
      toast.error('Error buscando personas');
    } finally {
      setSearchingPeople(false);
    }
  };

  useEffect(() => {
    if (selectedPerson || showNewPerson) return;

    const normalizedQuery = peopleSearch.trim();
    if (!normalizedQuery) {
      setPeopleResults([]);
      setSearchingPeople(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchPeople(normalizedQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [peopleSearch, selectedPerson, showNewPerson]);

  const createNewPerson = async () => {
    if (!personForm.studentCode || !personForm.fullName || !personForm.institutionalEmail || !personForm.phone) {
      return toast.error('Codigo, nombre, correo y telefono son obligatorios');
    }

    try {
      const res = await apiClient.post<Envelope<Person>>('/people', {
        ...personForm,
        birthday: personForm.birthday ? new Date(personForm.birthday).toISOString() : undefined,
      });
      toast.success('Persona creada');
      setSelectedPerson(res.data);
      setForm((value) => ({ ...value, personId: res.data.id }));
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

      const { personId, ...leaderData } = form;
      const payload = {
        ...(isEdit ? leaderData : form),
        personId: personIdToUpdate,
        startDate: new Date(form.startDate).toISOString(),
      };

      if (isEdit) {
        await apiClient.patch(`/leaders/${editTarget.id}`, payload);
        toast.success('Lider y datos personales actualizados');
      } else {
        await apiClient.post('/leaders', payload);
        toast.success('Lider registrado con exito');
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
    if (!confirm('Desactivar este lider?')) return;
    try {
      await apiClient.patch(`/leaders/${id}/deactivate`, { endDate: new Date().toISOString() });
      toast.success('Lider desactivado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteLeader = async (id: string) => {
    if (!confirm('Eliminar permanentemente este registro de liderazgo?')) return;
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
    setSearchingPeople(false);
  };

  const fillPersonData = (person: Person) => {
    setSelectedPerson(person);
    setForm((value) => ({ ...value, personId: person.id }));
    setPersonForm({
      studentCode: person.studentCode,
      fullName: person.fullName,
      institutionalEmail: person.institutionalEmail || '',
      phone: person.phone || '',
      birthday: person.birthday ? new Date(person.birthday).toISOString().split('T')[0] : '',
      tshirtSize: person.tshirtSize || '',
      publicDescription: person.publicDescription || '',
      photoUrl: person.photoUrl || '',
    });
  };

  const startEdit = (leader: Leader) => {
    setEditTarget(leader);
    setSelectedPerson(leader.person);
    setForm({
      personId: leader.personId,
      faculty: leader.faculty,
      program: leader.program,
      description: leader.description || '',
      startDate: new Date(leader.startDate).toISOString().split('T')[0],
    });
    setPersonForm({
      studentCode: leader.person.studentCode,
      fullName: leader.person.fullName,
      institutionalEmail: leader.person.institutionalEmail || '',
      phone: leader.person.phone || '',
      birthday: leader.person.birthday ? new Date(leader.person.birthday).toISOString().split('T')[0] : '',
      tshirtSize: leader.person.tshirtSize || '',
      publicDescription: leader.person.publicDescription || '',
      photoUrl: leader.person.photoUrl || '',
    });
    setOpenCreate(true);
  };

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Sin permisos para gestionar lideres.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Lideres Institucionales Activos</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>
            Registrar Lider
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Buscar por nombre, codigo, programa, facultad o cargo</label>
            <Input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Ej. Ana, Derecho o coordinacion" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Filtrar por facultad</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
      </Card>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>Persona</Th>
                <Th>Cumpleanos</Th>
                <Th>Facultad / Programa</Th>
                <Th>Descripcion / Cargo</Th>
                <Th>Inicio</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <Td>
                    <span className="font-medium">{item.person.fullName}</span>
                    <span className="block text-xs text-slate-500">{item.person.studentCode}</span>
                  </Td>
                  <Td>{item.person.birthday ? new Date(item.person.birthday).toLocaleDateString() : '--'}</Td>
                  <Td>
                    {item.faculty}
                    <span className="block text-xs text-slate-500">{item.program}</span>
                  </Td>
                  <Td>{item.description || <span className="text-slate-400">--</span>}</Td>
                  <Td>{new Date(item.startDate).toLocaleDateString()}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button className="border border-indigo-200 py-1 text-xs text-indigo-700 hover:bg-indigo-50" onClick={() => startEdit(item)}>
                        Editar
                      </Button>
                      <Button className="border border-amber-200 py-1 text-xs text-amber-700 hover:bg-amber-50" onClick={() => deactivateLeader(item.id)}>
                        Desactivar
                      </Button>
                      <Button className="border border-red-200 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => deleteLeader(item.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filteredLeaders.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay lideres que coincidan con los filtros
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Table>
      </div>

      <Modal open={openCreate} onClose={resetModal} className="max-w-xl">
        <div className="custom-scrollbar max-h-[80vh] overflow-y-auto p-1 pr-2">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Lider Institucional</h2>
          <div className="mt-4 space-y-4">
            {!showNewPerson ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Buscar persona</label>
                <Input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Codigo o nombre" onKeyDown={(e) => e.key === 'Enter' && searchPeople(peopleSearch)} />
                {peopleSearch.trim() && !selectedPerson ? (
                  <p className="text-xs text-slate-500">
                    {searchingPeople ? 'Buscando coincidencias...' : 'Escribe y veras coincidencias en tiempo real.'}
                  </p>
                ) : null}
                {peopleResults.length > 0 && !selectedPerson ? (
                  <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {peopleResults.map((person) => (
                      <div key={person.id} className="cursor-pointer rounded-lg p-2 text-sm transition hover:bg-emerald-50" onClick={() => fillPersonData(person)}>
                        <span className="font-medium text-slate-800">{person.fullName}</span>
                        <span className="ml-2 text-xs text-slate-500">{person.studentCode}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {peopleSearch.trim() && !selectedPerson && !searchingPeople && peopleResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No encontramos coincidencias para <span className="font-semibold text-slate-700">{peopleSearch}</span>.
                  </div>
                ) : null}
                {selectedPerson ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <span>
                      ✓ <strong>{selectedPerson.fullName}</strong>
                    </span>
                    <button onClick={() => setSelectedPerson(null)} className="text-xs text-emerald-700 underline">
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewPerson(true)} className="text-sm text-emerald-700 underline hover:text-emerald-900">
                    No existe aun? + Registrar nueva persona
                  </button>
                )}
              </div>
            ) : null}

            {(showNewPerson || editTarget) ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{editTarget ? 'Editar datos personales' : 'Nueva persona'}</h3>
                  {!editTarget ? (
                    <button onClick={() => setShowNewPerson(false)} className="text-xs text-slate-500 underline">
                      Cancelar
                    </button>
                  ) : null}
                </div>

                <div className="mb-2 flex items-center gap-4 border-b border-slate-100 py-2">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm">
                    {personForm.photoUrl ? (
                      <img src={getFileUrl(personForm.photoUrl)} className="h-full w-full object-cover" alt="Profile" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                        {personForm.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <Button className="border border-slate-200 bg-white py-1 text-xs text-slate-700" onClick={() => { setWikiSelectionMode(true); setOpenWiki(true); }}>
                      Cambiar Foto
                    </Button>
                    {personForm.photoUrl ? (
                      <button onClick={() => setPersonForm((value) => ({ ...value, photoUrl: '' }))} className="ml-2 text-xs text-red-500 underline">
                        Quitar
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Codigo *" value={personForm.studentCode} onChange={(e) => setPersonForm((value) => ({ ...value, studentCode: e.target.value }))} />
                  <Input placeholder="Telefono *" value={personForm.phone} onChange={(e) => setPersonForm((value) => ({ ...value, phone: e.target.value }))} />
                </div>
                <Input placeholder="Nombre completo *" value={personForm.fullName} onChange={(e) => setPersonForm((value) => ({ ...value, fullName: e.target.value }))} />
                <Input type="email" placeholder="Correo institucional *" value={personForm.institutionalEmail} onChange={(e) => setPersonForm((value) => ({ ...value, institutionalEmail: e.target.value }))} />
                <div>
                  <label className="text-xs text-slate-500">Cumpleanos</label>
                  <Input type="date" value={personForm.birthday} onChange={(e) => setPersonForm((value) => ({ ...value, birthday: e.target.value }))} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500">Perfil / Biografia (Markdown)</label>
                    <button onClick={() => { setWikiSelectionMode(false); setOpenWiki(true); }} className="flex items-center gap-1 text-xs text-emerald-600 underline">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      Wiki Imagen
                    </button>
                  </div>
                  <textarea className="scroll-modern min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" placeholder="Descripcion publica..." value={personForm.publicDescription} onChange={(e) => setPersonForm((value) => ({ ...value, publicDescription: e.target.value }))} />
                </div>

                {!editTarget ? (
                  <Button className="w-full bg-indigo-600 text-white" onClick={createNewPerson}>
                    Crear y seleccionar
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Facultad *</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.faculty} onChange={(e) => setForm((value) => ({ ...value, faculty: e.target.value }))}>
                    {faculties.map((faculty) => (
                      <option key={faculty} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Talla de Camiseta</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={personForm.tshirtSize} onChange={(e) => setPersonForm((value) => ({ ...value, tshirtSize: e.target.value }))}>
                    <option value="">-- Sin talla --</option>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Descripcion / Cargo (opcional)</label>
                <Input placeholder="Ej. Coordinador de proyeccion social" value={form.description} onChange={(e) => setForm((value) => ({ ...value, description: e.target.value }))} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Programa</label>
                <Input placeholder="Ej. Psicologia" value={form.program} onChange={(e) => setForm((value) => ({ ...value, program: e.target.value }))} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((value) => ({ ...value, startDate: e.target.value }))} />
              </div>

              <Button className="mt-2 w-full bg-emerald-700 text-white" disabled={loading} onClick={saveLeader}>
                {loading ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Guardar Lider'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl overflow-hidden p-0">
        <WikiMediaManager
          onClose={() => setOpenWiki(false)}
          selectionMode={wikiSelectionMode}
          onSelect={(url) => {
            if (wikiSelectionMode) {
              setPersonForm((value) => ({ ...value, photoUrl: url }));
              setOpenWiki(false);
            } else {
              navigator.clipboard.writeText(`![imagen](${url})`);
              toast.success('Link de imagen copiado');
            }
          }}
        />
      </Modal>
    </div>
  );
}
