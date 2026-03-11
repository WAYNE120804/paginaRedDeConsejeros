'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { Modal } from '@/components/ui/admin/modal';
import { Select } from '@/components/ui/admin/select';
import { Badge } from '@/components/ui/admin/badge';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type EventItem = { id: string; slug: string; title: string; visibility: 'PUBLIC'|'HIDDEN'; date: string; location: string };
type Envelope<T> = { data: T; error: null | { message?: string } };

export default function EventosAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO' || role === 'COMUNICACIONES';
  const [items, setItems] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'PUBLIC_EVENT', visibility: 'PUBLIC', date: '', startTime: '08:00', endTime: '10:00', location: '' });

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<EventItem[]>>('/events');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const create = async () => {
    try {
      await apiClient.post('/events', form);
      toast.success('Evento creado');
      setOpen(false);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleVisibility = async (item: EventItem) => {
    try {
      await apiClient.patch(`/events/${item.id}`, { visibility: item.visibility === 'PUBLIC' ? 'HIDDEN' : 'PUBLIC' });
      toast.success('Visibilidad actualizada');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar eventos.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>Nuevo evento</Button>
      </Card>

      <Table>
        <table className="min-w-full">
          <thead><tr><Th>Título</Th><Th>Fecha</Th><Th>Ubicación</Th><Th>Visibilidad</Th><Th>Acción</Th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <Td>{item.title}</Td>
                <Td>{new Date(item.date).toLocaleDateString('es-CO')}</Td>
                <Td>{item.location}</Td>
                <Td><Badge>{item.visibility}</Badge></Td>
                <Td><Button className="border border-slate-200" onClick={() => toggleVisibility(item)}>Alternar</Button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Crear evento</h2>
        <div className="mt-3 grid gap-2">
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          <Input type="date" value={form.date} onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" value={form.startTime} onChange={(e) => setForm((v) => ({ ...v, startTime: e.target.value }))} />
            <Input type="time" value={form.endTime} onChange={(e) => setForm((v) => ({ ...v, endTime: e.target.value }))} />
          </div>
          <Input placeholder="Lugar" value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value }))}>
              <option value="PUBLIC_EVENT">Evento público</option>
              <option value="ASSEMBLY">Asamblea</option>
              <option value="BOARD_MEETING">Junta</option>
            </Select>
            <Select value={form.visibility} onChange={(e) => setForm((v) => ({ ...v, visibility: e.target.value }))}>
              <option value="PUBLIC">Público</option>
              <option value="HIDDEN">Oculto</option>
            </Select>
          </div>
          <Button className="bg-emerald-700 text-white" onClick={create}>Guardar evento</Button>
        </div>
      </Modal>
    </div>
  );
}
