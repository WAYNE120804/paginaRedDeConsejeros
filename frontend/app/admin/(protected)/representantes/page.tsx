'use client';

import { useEffect, useMemo, useState } from 'react';
import { Instagram } from 'lucide-react';
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
import {
  DEFAULT_COLLEGIATE_BODIES,
  DEFAULT_FACULTIES,
  getCollegiateBodyTheme,
  mergeCatalog,
} from '@/lib/collegiate-bodies';

type Person = {
  id: string;
  fullName: string;
  studentCode: string;
  phone?: string;
  institutionalEmail?: string;
  birthday?: string;
  tshirtSize?: string;
  publicDescription?: string;
  photoUrl?: string;
  instagramUrl?: string;
  instagramLabel?: string;
};

type Mandate = {
  id: string;
  personId: string;
  estateType: string;
  faculty: string;
  program: string;
  description?: string;
  startDate: string;
  endDate?: string;
  tshirtSize?: string;
  person: Person;
};

type Envelope<T> = { data: T; error: null | { message?: string } };

type MandateForm = {
  personId: string;
  estateType: string;
  faculty: string;
  program: string;
  description: string;
  startDate: string;
  endDate: string;
  tshirtSize: string;
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
  instagramUrl: string;
  instagramLabel: string;
};

const emptyForm: MandateForm = {
  personId: '',
  estateType: DEFAULT_COLLEGIATE_BODIES[0],
  faculty: DEFAULT_FACULTIES[0],
  program: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tshirtSize: '',
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
  instagramUrl: '',
  instagramLabel: '',
};

export default function RepresentantesAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Mandate | null>(null);
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [wikiSelectionMode, setWikiSelectionMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [personForm, setPersonForm] = useState(emptyPersonForm);

  const loadData = async () => {
    try {
      const response = await apiClient.get<Envelope<Mandate[]>>('/representation/active');
      setMandates(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (canManage) loadData();
  }, [canManage]);

  const collegiateBodies = useMemo(
    () => mergeCatalog(DEFAULT_COLLEGIATE_BODIES, mandates.map((item) => item.estateType)),
    [mandates],
  );

  const faculties = useMemo(
    () => mergeCatalog(DEFAULT_FACULTIES, mandates.map((item) => item.faculty)),
    [mandates],
  );

  const filteredMandates = useMemo(() => {
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return mandates.filter((item) => {
      const matchSearch =
        !normalizedSearch ||
        item.person.fullName.toLowerCase().includes(normalizedSearch) ||
        item.person.studentCode.toLowerCase().includes(normalizedSearch) ||
        item.program.toLowerCase().includes(normalizedSearch) ||
        item.faculty.toLowerCase().includes(normalizedSearch);

      const matchBody = !bodyFilter || item.estateType === bodyFilter;
      const matchFaculty = !facultyFilter || item.faculty === facultyFilter;
      return matchSearch && matchBody && matchFaculty;
    });
  }, [bodyFilter, facultyFilter, mandates, tableSearch]);

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
      setForm((v) => ({ ...v, personId: res.data.id }));
      setShowNewPerson(false);
      setPersonForm(emptyPersonForm);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const saveMandate = async () => {
    if (!form.personId && !selectedPerson) return toast.error('Selecciona una persona');
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
        instagramUrl: personForm.instagramUrl || undefined,
        instagramLabel: personForm.instagramLabel || undefined,
      });

      const { personId, ...mandateData } = form;
      const mandatePayload = {
        ...(isEdit ? mandateData : form),
        personId: personIdToUpdate,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (isEdit) {
        await apiClient.patch(`/representation/mandates/${editTarget.id}`, mandatePayload);
        toast.success('Mandato y datos personales actualizados');
      } else {
        await apiClient.post('/representation/mandates', mandatePayload);
        toast.success('Mandato registrado con exito');
      }

      resetModal();
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const closeMandate = async (id: string) => {
    if (!confirm('¿Cerrar este mandato?')) return;
    try {
      await apiClient.patch<Envelope<Mandate>>(`/representation/mandates/${id}/close`, { endDate: new Date().toISOString() });
      toast.success('Mandato finalizado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteMandate = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este mandato? Esta accion es irreversible.')) return;
    try {
      await apiClient.delete(`/representation/mandates/${id}`);
      toast.success('Mandato eliminado');
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
    setForm((v) => ({ ...v, personId: person.id, tshirtSize: person.tshirtSize || v.tshirtSize }));
    setPersonForm({
      studentCode: person.studentCode,
      fullName: person.fullName,
      institutionalEmail: person.institutionalEmail || '',
      phone: person.phone || '',
      birthday: person.birthday ? new Date(person.birthday).toISOString().split('T')[0] : '',
      tshirtSize: person.tshirtSize || '',
      publicDescription: person.publicDescription || '',
      photoUrl: person.photoUrl || '',
      instagramUrl: person.instagramUrl || '',
      instagramLabel: person.instagramLabel || '',
    });
  };

  const startEdit = (m: Mandate) => {
    setEditTarget(m);
    setSelectedPerson(m.person);
    setForm({
      personId: m.personId,
      estateType: m.estateType,
      faculty: m.faculty,
      program: m.program,
      description: m.description || '',
      startDate: new Date(m.startDate).toISOString().split('T')[0],
      endDate: m.endDate ? new Date(m.endDate).toISOString().split('T')[0] : '',
      tshirtSize: m.tshirtSize || '',
    });
    setPersonForm({
      studentCode: m.person.studentCode,
      fullName: m.person.fullName,
      institutionalEmail: m.person.institutionalEmail || '',
      phone: m.person.phone || '',
      birthday: m.person.birthday ? new Date(m.person.birthday).toISOString().split('T')[0] : '',
      tshirtSize: m.person.tshirtSize || '',
      publicDescription: m.person.publicDescription || '',
      photoUrl: m.person.photoUrl || '',
      instagramUrl: m.person.instagramUrl || '',
      instagramLabel: m.person.instagramLabel || '',
    });
    setOpenCreate(true);
  };

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Sin permisos para gestionar representantes.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Representantes Activos</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>
            Nuevo Mandato
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Buscar por nombre, codigo, programa o facultad</label>
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Ej. Jhon, Derecho o 20260001"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Filtrar por cuerpo colegiado</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
                <Th>Cuerpo Colegiado</Th>
                <Th>Facultad / Programa</Th>
                <Th>Inicio {'->'} Fin</Th>
                <Th>Talla</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredMandates.map((m) => {
                const theme = getCollegiateBodyTheme(m.estateType);
                return (
                <tr key={m.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <Td>
                    <span className="font-medium">{m.person?.fullName}</span>
                    <span className="block text-xs text-slate-500">{m.person?.studentCode}</span>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${theme.adminBadge}`}>
                      {m.estateType}
                    </span>
                  </Td>
                  <Td>
                    {m.faculty}
                    <span className="block text-xs text-slate-500">{m.program}</span>
                  </Td>
                  <Td>
                    {new Date(m.startDate).toLocaleDateString()}
                    {m.endDate && <span className="block text-xs text-slate-500">{'->'} {new Date(m.endDate).toLocaleDateString()}</span>}
                  </Td>
                  <Td>{m.tshirtSize || '--'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button className="border border-indigo-200 py-1 text-xs text-indigo-700 hover:bg-indigo-50" onClick={() => startEdit(m)}>
                        Editar
                      </Button>
                      <Button className="border border-amber-200 py-1 text-xs text-amber-700 hover:bg-amber-50" onClick={() => closeMandate(m.id)}>
                        Finalizar
                      </Button>
                      <Button className="border border-red-200 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => deleteMandate(m.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </Td>
                </tr>
              )})}
              {filteredMandates.length === 0 && (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay representantes que coincidan con los filtros
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </Table>
      </div>

      <Modal open={openCreate} onClose={resetModal} className="max-w-2xl">
        <div className="custom-scrollbar max-h-[80vh] overflow-y-auto pr-2">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Periodo de Representante</h2>
          <div className="mt-4 space-y-4">
            {!showNewPerson ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Buscar persona por codigo o nombre</label>
                <Input
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  placeholder="Ej. 20260001 o Juan Perez"
                  onKeyDown={(e) => e.key === 'Enter' && searchPeople(peopleSearch)}
                />
                {peopleSearch.trim() && !selectedPerson ? (
                  <p className="text-xs text-slate-500">
                    {searchingPeople ? 'Buscando coincidencias...' : 'Escribe y te mostraremos coincidencias en tiempo real.'}
                  </p>
                ) : null}

                {peopleResults.length > 0 && !selectedPerson && (
                  <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {peopleResults.map((p) => (
                      <div
                        key={p.id}
                        className="cursor-pointer rounded-lg p-2 text-sm transition hover:bg-emerald-50"
                        onClick={() => fillPersonData(p)}
                      >
                        <span className="font-medium text-slate-800">{p.fullName}</span>
                        <span className="ml-2 text-xs text-slate-500">{p.studentCode}</span>
                      </div>
                    ))}
                  </div>
                )}

                {peopleSearch.trim() && !selectedPerson && !searchingPeople && peopleResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No encontramos coincidencias para <span className="font-semibold text-slate-700">{peopleSearch}</span>.
                  </div>
                ) : null}

                {selectedPerson ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <span>
                      ✓ <strong>{selectedPerson.fullName}</strong>{' '}
                      <span className="text-xs text-emerald-600">({selectedPerson.studentCode})</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPerson(null);
                        setForm((v) => ({ ...v, personId: '' }));
                        setPeopleResults([]);
                      }}
                      className="text-xs text-emerald-700 underline"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewPerson(true)} className="text-sm text-emerald-700 underline hover:text-emerald-900">
                    ¿No existe aun? + Registrar nueva persona
                  </button>
                )}
              </div>
            ) : null}

            {(showNewPerson || editTarget) && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{editTarget ? 'Editar Datos Personales' : 'Registrar nueva persona'}</h3>
                  {!editTarget && (
                    <button onClick={() => setShowNewPerson(false)} className="text-xs text-slate-500 underline">
                      Cancelar
                    </button>
                  )}
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
                    <Button
                      className="border border-slate-200 bg-white py-1 text-xs text-slate-700"
                      onClick={() => {
                        setWikiSelectionMode(true);
                        setOpenWiki(true);
                      }}
                    >
                      Cambiar Foto
                    </Button>
                    {personForm.photoUrl && (
                      <button onClick={() => setPersonForm((v) => ({ ...v, photoUrl: '' }))} className="ml-2 text-xs text-red-500 underline">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Codigo *" value={personForm.studentCode} onChange={(e) => setPersonForm((v) => ({ ...v, studentCode: e.target.value }))} />
                  <Input placeholder="Telefono *" value={personForm.phone} onChange={(e) => setPersonForm((v) => ({ ...v, phone: e.target.value }))} />
                </div>
                <Input placeholder="Nombre completo *" value={personForm.fullName} onChange={(e) => setPersonForm((v) => ({ ...v, fullName: e.target.value }))} />
                <Input type="email" placeholder="Correo institucional *" value={personForm.institutionalEmail} onChange={(e) => setPersonForm((v) => ({ ...v, institutionalEmail: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Nombre visible de Instagram" value={personForm.instagramLabel} onChange={(e) => setPersonForm((v) => ({ ...v, instagramLabel: e.target.value }))} />
                  <Input placeholder="https://instagram.com/tu_usuario" value={personForm.instagramUrl} onChange={(e) => setPersonForm((v) => ({ ...v, instagramUrl: e.target.value }))} />
                </div>
                {personForm.instagramLabel || personForm.instagramUrl ? (
                  <div className="flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-sm text-pink-700">
                    <Instagram size={16} />
                    <span>{personForm.instagramLabel || personForm.instagramUrl}</span>
                  </div>
                ) : null}
                <div>
                  <label className="text-xs text-slate-500">Cumpleanos</label>
                  <Input type="date" value={personForm.birthday} onChange={(e) => setPersonForm((v) => ({ ...v, birthday: e.target.value }))} />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500">Perfil / Biografia (Markdown)</label>
                    <button
                      onClick={() => {
                        setWikiSelectionMode(false);
                        setOpenWiki(true);
                      }}
                      className="flex items-center gap-1 text-xs text-emerald-600 underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      Wiki Imagen
                    </button>
                  </div>
                  <textarea
                    className="scroll-modern min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                    placeholder="Descripcion publica..."
                    value={personForm.publicDescription}
                    onChange={(e) => setPersonForm((v) => ({ ...v, publicDescription: e.target.value }))}
                  />
                </div>

                {!editTarget && (
                  <Button className="w-full bg-indigo-600 text-white" onClick={createNewPerson}>
                    Crear y seleccionar persona
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Cuerpo colegiado *</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.estateType}
                  onChange={(e) => setForm((v) => ({ ...v, estateType: e.target.value }))}
                >
                  {collegiateBodies.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Talla de Camiseta</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.tshirtSize}
                  onChange={(e) => setForm((v) => ({ ...v, tshirtSize: e.target.value }))}
                >
                  <option value="">-- Sin talla --</option>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Facultad *</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                value={form.faculty}
                onChange={(e) => setForm((v) => ({ ...v, faculty: e.target.value }))}
              >
                {faculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Programa</label>
              <Input
                placeholder="Ej. Ingenieria de Sistemas y Telecomunicaciones"
                value={form.program}
                onChange={(e) => setForm((v) => ({ ...v, program: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((v) => ({ ...v, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Fecha de Fin (~2 anos)</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((v) => ({ ...v, endDate: e.target.value }))} />
              </div>
            </div>

            <Button className="mt-2 w-full bg-emerald-700 text-white" disabled={loading} onClick={saveMandate}>
              {loading ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Registrar Mandato'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl overflow-hidden p-0">
        <WikiMediaManager
          onClose={() => setOpenWiki(false)}
          selectionMode={wikiSelectionMode}
          onSelect={(url) => {
            if (wikiSelectionMode) {
              setPersonForm((v) => ({ ...v, photoUrl: url }));
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
