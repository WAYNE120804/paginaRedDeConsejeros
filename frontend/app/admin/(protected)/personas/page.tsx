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

type Person = { id: string; studentCode: string; fullName: string; institutionalEmail: string };

type Envelope<T> = { data: T; error: null | { message?: string } };

export default function PersonasAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentCode: '', fullName: '', institutionalEmail: '' });

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

  const create = async () => {
    try {
      await apiClient.post<Envelope<Person>>('/people', form);
      toast.success('Persona creada');
      setOpen(false);
      setForm({ studentCode: '', fullName: '', institutionalEmail: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar personas.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o correo" />
          <Button className="bg-emerald-700 text-white" onClick={load}>Buscar</Button>
          <Button className="border border-emerald-200 text-emerald-700" onClick={() => setOpen(true)}>Nueva persona</Button>
        </div>
      </Card>

      <Table>
        <table className="min-w-full">
          <thead><tr><Th>Nombre</Th><Th>Código</Th><Th>Correo</Th></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.id} className="border-t border-slate-100"><Td>{item.fullName}</Td><Td>{item.studentCode}</Td><Td>{item.institutionalEmail}</Td></tr>)}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Crear persona</h2>
        <div className="mt-3 space-y-2">
          <Input placeholder="Código estudiantil" value={form.studentCode} onChange={(e) => setForm((v) => ({ ...v, studentCode: e.target.value }))} />
          <Input placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} />
          <Input placeholder="Correo institucional" value={form.institutionalEmail} onChange={(e) => setForm((v) => ({ ...v, institutionalEmail: e.target.value }))} />
          <Button className="bg-emerald-700 text-white" onClick={create}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}
