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

const ESTATE_TYPES = [
  'Consejo Superior',
  'Consejo Académico',
  'Consejo de Facultad',
  'Comité de Programa',
];

const FACULTIES = [
  'Facultad de Ciencias e Ingeniería',
  'Facultad de Ciencias de la Salud',
  'Facultad de Derecho y Ciencias Jurídicas',
  'Facultad de Ciencias Contables, Económicas y Administrativas',
  'Facultad de Ciencias Sociales y Humanas',
  'N/A – Aplica a toda la universidad',
];

type Person = { id: string; fullName: string; studentCode: string; phone?: string; institutionalEmail?: string; birthday?: string; tshirtSize?: string; publicDescription?: string; photoUrl?: string };
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

const emptyForm = {
  personId: '',
  estateType: ESTATE_TYPES[0],
  faculty: FACULTIES[0],
  program: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tshirtSize: '',
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

  // Búsqueda de persona
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

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

  const saveMandate = async () => {
    if (!form.personId && !selectedPerson) return toast.error('Selecciona una persona');
    setLoading(true);
    try {
      const isEdit = !!editTarget;

      // 1. Actualizar Datos de Persona
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

      // 2. Crear o Actualizar Mandato
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
        toast.success('Mandato registrado con éxito');
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
    if (!confirm('¿Eliminar permanentemente este mandato? Esta acción es irreversible.')) return;
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
    });
    setOpenCreate(true);
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">Sin permisos para gestionar representantes.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">Representantes Activos</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>Nuevo Mandato</Button>
        </div>
      </Card>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>Persona</Th>
                <Th>Estamento</Th>
                <Th>Facultad / Programa</Th>
                <Th>Descripción</Th>
                <Th>Inicio → Fin</Th>
                <Th>Talla</Th>
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
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {m.estateType}
                    </span>
                  </Td>
                  <Td>
                    {m.faculty}
                    <span className="block text-xs text-slate-500">{m.program}</span>
                  </Td>
                  <Td>{m.description || <span className="text-slate-400">--</span>}</Td>
                  <Td>
                    {new Date(m.startDate).toLocaleDateString()}
                    {m.endDate && <span className="block text-xs text-slate-500">→ {new Date(m.endDate).toLocaleDateString()}</span>}
                  </Td>
                  <Td>{m.tshirtSize || '--'}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      <Button className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-1 text-xs" onClick={() => startEdit(m)}>Editar</Button>
                      <Button className="border border-amber-200 text-amber-700 hover:bg-amber-50 py-1 text-xs" onClick={() => closeMandate(m.id)}>Finalizar</Button>
                      <Button className="border border-red-200 text-red-700 hover:bg-red-50 py-1 text-xs" onClick={() => deleteMandate(m.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {mandates.length === 0 && (
                <tr><Td colSpan={7} className="text-center py-8 text-slate-400">No hay representantes activos</Td></tr>
              )}
            </tbody>
          </table>
        </Table>
      </div>

      {/* Modal Crear */}
      <Modal open={openCreate} onClose={resetModal} className="max-w-2xl">
        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Período de Representante</h2>
          <div className="mt-4 space-y-4">

          {/* Búsqueda de persona */}
          {!showNewPerson ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Buscar persona por código o nombre</label>
              <div className="flex gap-2">
                <Input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Ej. 20260001 o Juan Pérez" onKeyDown={(e) => e.key === 'Enter' && searchPeople()} />
                <Button className="bg-slate-100 text-slate-800 shrink-0" onClick={searchPeople}>Buscar</Button>
              </div>
              {peopleResults.length > 0 && !selectedPerson && (
                <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-auto bg-slate-50">
                  {peopleResults.map(p => (
                    <div key={p.id} className="p-2 hover:bg-emerald-50 cursor-pointer rounded-lg text-sm transition" onClick={() => { 
                      setSelectedPerson(p); 
                      setForm(v => ({ ...v, personId: p.id, tshirtSize: p.tshirtSize || v.tshirtSize })); 
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
                  <span>✓ <strong>{selectedPerson.fullName}</strong> <span className="text-xs text-emerald-600">({selectedPerson.studentCode})</span></span>
                  <button onClick={() => { setSelectedPerson(null); setForm(v => ({ ...v, personId: '' })); }} className="text-emerald-700 underline text-xs">Cambiar</button>
                </div>
              ) : (
                <button onClick={() => setShowNewPerson(true)} className="text-sm text-emerald-700 underline hover:text-emerald-900">
                  ¿No existe aún? + Registrar nueva persona
                </button>
              )}
            </div>
          ) : null}

          {/* Formulario de Persona (Visible siempre en edición o si se activa registro de nueva persona) */}
            {(showNewPerson || editTarget) && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {editTarget ? 'Editar Datos Personales' : 'Registrar nueva persona'}
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

                {!editTarget && <Button className="bg-indigo-600 text-white w-full" onClick={createNewPerson}>Crear y seleccionar persona</Button>}
              </div>
            )}

          {/* Campos del mandato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Estamento *</label>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.estateType} onChange={e => setForm(v => ({ ...v, estateType: e.target.value }))}>
                {ESTATE_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Talla de Camiseta</label>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.tshirtSize} onChange={e => setForm(v => ({ ...v, tshirtSize: e.target.value }))}>
                <option value="">-- Sin talla --</option>
                {['XS','S','M','L','XL','XXL'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Facultad *</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={form.faculty} onChange={e => setForm(v => ({ ...v, faculty: e.target.value }))}>
              {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Programa</label>
            <Input placeholder="Ej. Ingeniería de Sistemas y Telecomunicaciones" value={form.program} onChange={e => setForm(v => ({ ...v, program: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Descripción del cargo / funciones</label>
            <Input placeholder="Ej. Representante estudiantil ante el Comité de Currículo" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Fecha de Inicio *</label>
              <Input type="date" value={form.startDate} onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Fecha de Fin (≈2 años)</label>
              <Input type="date" value={form.endDate} onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))} />
            </div>
          </div>

          <Button className="bg-emerald-700 text-white w-full mt-2" disabled={loading} onClick={saveMandate}>
            {loading ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Registrar Mandato'}
          </Button>
        </div>
      </div>
    </Modal>
    
      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-4xl p-0 overflow-hidden">
         <WikiMediaManager 
            onClose={() => setOpenWiki(false)} 
            selectionMode={wikiSelectionMode}
            onSelect={(url) => {
              if (wikiSelectionMode) {
                setPersonForm(v => ({ ...v, photoUrl: url }));
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
