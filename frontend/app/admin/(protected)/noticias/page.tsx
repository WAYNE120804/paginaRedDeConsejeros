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
import { WikiMediaManager } from '@/components/admin/wiki-media-manager';

type NewsItem = { id: string; slug: string; title: string; content: string; status: 'DRAFT' | 'PUBLISHED'; publishedAt?: string | null };
type Envelope<T> = { data: T; error: null | { message?: string } };

export default function NoticiasAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'COMUNICACIONES';
  const [items, setItems] = useState<NewsItem[]>([]);
  const [tab, setTab] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [open, setOpen] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', status: 'DRAFT' as any });

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<NewsItem[]>>('/news');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const filtered = useMemo(() => items.filter((item) => tab === 'ALL' || (item.status as any) === tab), [items, tab]);

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.patch(`/news/${editingId}`, form);
        toast.success('Noticia actualizada');
      } else {
        await apiClient.post('/news', { ...form, publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : undefined });
        toast.success('Noticia creada');
      }
      setOpen(false);
      setEditingId(null);
      setForm({ title: '', content: '', status: 'DRAFT' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta noticia permanentemente?')) return;
    try {
      await apiClient.delete(`/news/${id}`);
      toast.success('Noticia eliminada');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, status: item.status });
    setOpen(true);
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
            onChange={(value) => setTab(value as any)}
            options={[{ value: 'ALL', label: 'Todas' }, { value: 'DRAFT', label: 'Borradores' }, { value: 'PUBLISHED', label: 'Publicadas' }]}
          />
          <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>Nueva noticia</Button>
        </div>
      </Card>

      <Table>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <Th>Título</Th>
                <Th>Slug</Th>
                <Th>Estado</Th>
                <Th>Publicación</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id}>
                  <Td className="font-medium text-slate-900">{item.title}</Td>
                  <Td>{item.slug}</Td>
                  <Td>{item.status}</Td>
                  <Td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('es-CO') : '—'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button className="border border-slate-200" onClick={() => startEdit(item)}>Editar</Button>
                      <Button className="border border-slate-200" onClick={() => togglePublish(item)}>{item.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}</Button>
                      <Button className="border border-red-200 text-red-600" onClick={() => remove(item.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Table>

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null); }}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar noticia' : 'Nueva noticia'}</h2>
        <div className="mt-3 space-y-3">
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-500">Contenido Markdown</label>
              <button onClick={() => setOpenWiki(true)} className="text-xs text-emerald-600 underline flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                 Insertar Imagen
              </button>
            </div>
            <textarea 
              className="min-h-[200px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono overflow-auto scroll-modern" 
              placeholder="Contenido markdown..." 
              value={form.content} 
              onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))} 
            />
          </div>

          <div className="flex gap-2">
            <select 
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm(v => ({ ...v, status: e.target.value as any }))}
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
            <Button className="bg-emerald-700 text-white flex-1" onClick={save}>
              {editingId ? 'Actualizar noticia' : 'Guardar noticia'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-4xl p-0 overflow-hidden">
         <WikiMediaManager onClose={() => setOpenWiki(false)} />
      </Modal>
    </div>
  );
}
