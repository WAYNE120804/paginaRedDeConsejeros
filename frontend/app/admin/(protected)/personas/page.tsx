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

type Person = {
  id: string;
  studentCode: string;
  fullName: string;
  institutionalEmail: string;
  phone?: string;
  birthday?: string;
  tshirtSize?: string;
  publicDescription?: string;
};

type Envelope<T> = { data: T; error: null | { message?: string } };

const emptyForm = {
  studentCode: '',
  fullName: '',
  institutionalEmail: '',
  phone: '',
  birthday: '',
  tshirtSize: '',
  publicDescription: '',
};

export default function PersonasAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Person[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<Person[]>>(`/people?query=${encodeURIComponent(query)}`);
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  const openEdit = (p: Person) => {
    setEditTarget(p);
    setForm({
      studentCode: p.studentCode,
      fullName: p.fullName,
      institutionalEmail: p.institutionalEmail,
      phone: p.phone ?? '',
      birthday: p.birthday ? p.birthday.split('T')[0] : '',
      tshirtSize: p.tshirtSize ?? '',
      publicDescription: p.publicDescription ?? '',
    });
  };

  const save = async () => {
    if (!form.studentCode || !form.fullName || !form.institutionalEmail || !form.phone) {
      return toast.error('Código, nombre, correo y teléfono son obligatorios');
    }
    try {
      const payload = {
        ...form,
        birthday: form.birthday ? new Date(form.birthday).toISOString() : undefined,
      };
      if (editTarget) {
        await apiClient.patch<Envelope<Person>>(`/people/${editTarget.id}`, payload);
        toast.success('Persona actualizada');
        setEditTarget(null);
      } else {
        await apiClient.post<Envelope<Person>>('/people', payload);
        toast.success('Persona creada');
        setOpenCreate(false);
      }
      setForm(emptyForm);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deletePerson = async (id: string) => {
    if (!confirm('¿Eliminar esta persona? Esta acción es irreversible.')) return;
    try {
      await apiClient.delete<Envelope<{ success: boolean }>>(`/people/${id}`);
      toast.success('Persona eliminada');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar personas.</p></Card>;

  const renderForm = () => (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Código Estudiantil *</label>
          <Input placeholder="Ej. 20260001" value={form.studentCode} onChange={(e) => setForm(v => ({ ...v, studentCode: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Teléfono *</label>
          <Input placeholder="Ej. 3001234567" value={form.phone} onChange={(e) => setForm(v => ({ ...v, phone: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Nombre Completo *</label>
        <Input placeholder="Nombre y apellidos" value={form.fullName} onChange={(e) => setForm(v => ({ ...v, fullName: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Correo Institucional *</label>
        <Input type="email" placeholder="usuario@umanizales.edu.co" value={form.institutionalEmail} onChange={(e) => setForm(v => ({ ...v, institutionalEmail: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Fecha de Cumpleaños</label>
          <Input type="date" value={form.birthday} onChange={(e) => setForm(v => ({ ...v, birthday: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Talla de Camiseta</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            value={form.tshirtSize}
            onChange={(e) => setForm(v => ({ ...v, tshirtSize: e.target.value }))}
          >
            <option value="">-- Sin talla --</option>
            {['XS','S','M','L','XL','XXL'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Descripción (visitante / invitado)</label>
        <textarea
          rows={2}
          placeholder="Ej. Representante externo invitado a la asamblea del 2026..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 resize-none"
          value={form.publicDescription}
          onChange={(e) => setForm(v => ({ ...v, publicDescription: e.target.value }))}
        />
      </div>
      <Button className="bg-emerald-700 text-white w-full mt-1" onClick={save}>
        {editTarget ? 'Guardar cambios' : 'Crear persona'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o correo" />
          <Button className="bg-slate-100 text-slate-800" onClick={load}>Buscar</Button>
          <Button className="bg-emerald-700 text-white" onClick={() => { setForm(emptyForm); setOpenCreate(true); }}>Nueva persona</Button>
        </div>
      </Card>

      <div className="w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Código</Th>
                <Th>Correo</Th>
                <Th>Teléfono</Th>
                <Th>Talla</Th>
                <Th>Cumpleaños</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <Td className="font-medium">
                    {item.fullName}
                    {item.publicDescription && <span className="block text-xs text-slate-400 truncate max-w-[180px]">{item.publicDescription}</span>}
                  </Td>
                  <Td>{item.studentCode}</Td>
                  <Td>{item.institutionalEmail}</Td>
                  <Td>{item.phone || '--'}</Td>
                  <Td>{item.tshirtSize || '--'}</Td>
                  <Td>{item.birthday ? new Date(item.birthday).toLocaleDateString() : '--'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button className="border border-blue-200 text-blue-700 hover:bg-blue-50 py-1 text-xs" onClick={() => openEdit(item)}>Editar</Button>
                      <Button className="border border-red-200 text-red-700 hover:bg-red-50 py-1 text-xs" onClick={() => deletePerson(item.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <Td colSpan={7} className="text-center py-8 text-slate-400">Sin resultados. Usa el buscador para encontrar personas.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </Table>
      </div>

      {/* Modal Crear */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} className="max-w-xl">
        <h2 className="text-lg font-semibold text-slate-900">Registrar nueva persona</h2>
        {renderForm()}
      </Modal>

      {/* Modal Editar */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} className="max-w-xl">
        <h2 className="text-lg font-semibold text-slate-900">Editar persona</h2>
        {renderForm()}
      </Modal>
    </div>
  );
}
