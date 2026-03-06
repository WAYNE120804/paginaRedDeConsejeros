'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { Modal } from '@/components/ui/admin/modal';
import { Select } from '@/components/ui/admin/select';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type DocumentItem = {
  id: string;
  category: 'ESTATUTOS' | 'REGLAMENTOS' | 'LINEAMIENTOS' | 'COMUNICADOS';
  title: string;
  publishedAt: string;
  status: 'PUBLISHED' | 'ARCHIVED';
};

type Envelope<T> = { data: T; error: null | { message?: string } };

export default function DocumentosAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [items, setItems] = useState<DocumentItem[]>([]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ category: 'ESTATUTOS', title: '', description: '', status: 'PUBLISHED' });

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<DocumentItem[]>>('/documents');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const create = async () => {
    if (!file) {
      toast.error('Debes seleccionar un PDF');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('category', form.category);
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('publishedAt', new Date().toISOString());
      payload.append('status', form.status);

      await apiClient.post('/documents', payload);
      toast.success('Documento publicado');
      setOpen(false);
      setFile(null);
      setForm({ category: 'ESTATUTOS', title: '', description: '', status: 'PUBLISHED' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleArchive = async (item: DocumentItem) => {
    try {
      const next = item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
      await apiClient.patch(`/documents/${item.id}`, { status: next });
      toast.success('Estado del documento actualizado');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar documentos.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>Subir documento</Button>
      </Card>

      <Table>
        <table className="min-w-full">
          <thead><tr><Th>Título</Th><Th>Categoría</Th><Th>Estado</Th><Th>Publicado</Th><Th>Acción</Th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <Td>{item.title}</Td>
                <Td>{item.category}</Td>
                <Td>{item.status}</Td>
                <Td>{new Date(item.publishedAt).toLocaleDateString('es-CO')}</Td>
                <Td><Button className="border border-slate-200" onClick={() => toggleArchive(item)}>{item.status === 'PUBLISHED' ? 'Archivar' : 'Publicar'}</Button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Subir documento público</h2>
        <div className="mt-3 space-y-2">
          <Select value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
            <option value="ESTATUTOS">Estatutos</option>
            <option value="REGLAMENTOS">Reglamentos</option>
            <option value="LINEAMIENTOS">Lineamientos</option>
            <option value="COMUNICADOS">Comunicados</option>
          </Select>
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          <Input type="file" accept="application/pdf" onChange={onFileChange} />
          <Button className="bg-emerald-700 text-white" onClick={create}>Publicar PDF</Button>
        </div>
      </Modal>
    </div>
  );
}
