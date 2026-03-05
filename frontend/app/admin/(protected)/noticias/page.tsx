'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { Modal } from '@/components/ui/admin/modal';
import { Tabs } from '@/components/ui/admin/tabs';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type NewsItem = { id: string; slug: string; title: string; status: 'DRAFT' | 'PUBLISHED'; publishedAt?: string | null };
type Envelope<T> = { data: T; error: null | { message?: string } };

export default function NoticiasAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'COMUNICACIONES';

  const [items, setItems] = useState<NewsItem[]>([]);
  const [tab, setTab] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: '', title: '', content: '', status: 'DRAFT' });

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<NewsItem[]>>('/news');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const filtered = useMemo(() => items.filter((item) => tab === 'ALL' || item.status === tab), [items, tab]);

  const create = async () => {
    try {
      await apiClient.post('/news', { ...form, publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : undefined });
      toast.success('Noticia creada');
      setOpen(false);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const togglePublish = async (item: NewsItem) => {
    try {
      const status = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await apiClient.patch(`/news/${item.id}`, { status, publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null });
      toast.success('Estado de noticia actualizado');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar noticias.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={tab}
            onChange={(value) => setTab(value as 'ALL' | 'DRAFT' | 'PUBLISHED')}
            options={[{ value: 'ALL', label: 'Todas' }, { value: 'DRAFT', label: 'Borradores' }, { value: 'PUBLISHED', label: 'Publicadas' }]}
          />
          <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>Nueva noticia</Button>
        </div>
      </Card>

      <Table>
        <table className="min-w-full">
          <thead><tr><Th>Título</Th><Th>Slug</Th><Th>Estado</Th><Th>Publicado</Th><Th>Acción</Th></tr></thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <Td>{item.title}</Td>
                <Td>{item.slug}</Td>
                <Td>{item.status}</Td>
                <Td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('es-CO') : '—'}</Td>
                <Td><Button className="border border-slate-200" onClick={() => togglePublish(item)}>{item.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}</Button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Nueva noticia</h2>
        <div className="mt-3 space-y-2">
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))} />
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <textarea className="min-h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Contenido markdown" value={form.content} onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))} />
          <Button className="bg-emerald-700 text-white" onClick={create}>Guardar noticia</Button>
        </div>
      </Modal>
    </div>
  );
}
