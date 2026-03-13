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
import { WikiMediaManager } from '@/components/admin/wiki-media-manager';
import { Badge } from '@/components/ui/admin/badge';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getFileUrl } from '@/lib/utils';

type EventPhoto = { id: string; photoUrl: string; caption?: string; sortOrder: number };
type EventItem = { id: string; slug: string; title: string; description: string; content?: string; type: string; visibility: 'PUBLIC' | 'HIDDEN'; date: string; startTime: string; endTime: string; location: string; photos?: EventPhoto[] };
type Envelope<T> = { data: T; error: null | { message?: string } };

export default function EventosAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO' || role === 'COMUNICACIONES';
  const [items, setItems] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', type: 'PUBLIC_EVENT', visibility: 'PUBLIC', date: '', startTime: '08:00', endTime: '10:00', location: '' });
  const [gallery, setGallery] = useState<EventPhoto[]>([]);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<EventItem[]>>('/events');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.patch(`/events/${editingId}`, form);
        toast.success('Evento actualizado');
      } else {
        await apiClient.post('/events', form);
        toast.success('Evento creado');
      }
      setOpen(false);
      setEditingId(null);
      setForm({ title: '', description: '', content: '', type: 'PUBLIC_EVENT', visibility: 'PUBLIC', date: '', startTime: '08:00', endTime: '10:00', location: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este evento permanentemente?')) return;
    try {
      await apiClient.delete(`/events/${id}`);
      toast.success('Evento eliminado');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const startEdit = (item: EventItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      content: item.content || '',
      type: item.type,
      visibility: item.visibility,
      date: item.date.split('T')[0],
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
    });
    setGallery(item.photos || []);
    setOpen(true);
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

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingId || !e.target.files?.[0]) return;
    setLoadingPhoto(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await apiClient.post<EventPhoto>(`/events/${editingId}/photos`, formData);
      setGallery(prev => [...prev, res]);
      toast.success('Foto añadida a galería');
    } catch (err) {
      toast.error('Error al subir foto');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const updatePhoto = async (photoId: string, data: Partial<EventPhoto>) => {
    if (!editingId) return;
    try {
      await apiClient.patch(`/events/${editingId}/photos/${photoId}`, data);
      setGallery(prev => prev.map(p => p.id === photoId ? { ...p, ...data } : p));
      toast.success('Galería actualizada');
    } catch (err) {
      toast.error('Error al actualizar foto');
    }
  };

  const renamePhotoFile = async (photo: EventPhoto) => {
    const currentName = photo.photoUrl.split('/').pop() || '';
    const newName = prompt('Nuevo nombre del archivo (sin cambiar extensión):', currentName);
    if (!newName || newName === currentName) return;

    try {
      await apiClient.patch('/storage/rename', { oldPath: photo.photoUrl, newName });
      const newUrl = photo.photoUrl.replace(currentName, newName);
      await updatePhoto(photo.id, { photoUrl: newUrl });
      toast.success('Archivo renombrado');
    } catch (err) {
      toast.error('Error al renombrar archivo');
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!editingId || !confirm('¿Quitar esta foto de la galería?')) return;
    try {
      await apiClient.delete(`/events/${editingId}/photos/${photoId}`);
      setGallery(prev => prev.filter(p => p.id !== photoId));
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error('Error al eliminar foto');
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar eventos.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>Nuevo evento</Button>
      </Card>

      <Table>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <Th>Título</Th>
              <Th>Fecha</Th>
              <Th>Estado</Th>
              <Th>Visibilidad</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id}>
                <Td className="font-medium text-slate-900">{item.title}</Td>
                <Td>{new Date(item.date).toLocaleDateString('es-CO')}</Td>
                <Td>
                  <span className="text-xs text-slate-500 uppercase font-bold">{item.type}</span>
                </Td>
                <Td>
                  <Badge variant={item.visibility === 'PUBLIC' ? 'success' : 'warning'}>
                    {item.visibility === 'PUBLIC' ? 'Público' : 'Oculto'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button className="border border-slate-200" onClick={() => startEdit(item)}>Editar</Button>
                    <Button className="border border-slate-200" onClick={() => toggleVisibility(item)}>Alternar</Button>
                    <Button className="border border-red-200 text-red-600" onClick={() => remove(item.id)}>Eliminar</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null); }}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar evento' : 'Crear evento'}</h2>
        <div className="mt-3 grid gap-3 overflow-y-auto max-h-[70vh] p-1 scroll-modern">
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <Input placeholder="Resumen corto" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500">Contenido Expandido (Opcional)</label>
              <button onClick={() => setOpenWiki(true)} className="text-xs text-emerald-600 underline flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                Insertar Imagen
              </button>
            </div>
            <textarea
              className="min-h-[150px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono scroll-modern"
              placeholder="Desarrollo del evento..."
              value={form.content}
              onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Fecha</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Inicio</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((v) => ({ ...v, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Fin</label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((v) => ({ ...v, endTime: e.target.value }))} />
              </div>
            </div>
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

          {editingId && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Galería de Fotos</h3>
                <label className="cursor-pointer">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${loadingPhoto ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                    {loadingPhoto ? 'Subiendo...' : 'Añadir Foto'}
                  </div>
                  <input type="file" className="hidden" onChange={handleUploadGallery} accept="image/*" disabled={loadingPhoto} />
                </label>
              </div>

              <div className="grid max-h-[22rem] grid-cols-1 gap-4 overflow-y-auto pr-2 scroll-modern">
                {gallery.map(photo => (
                  <div key={photo.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
                      <img src={getFileUrl(photo.photoUrl)} className="w-full h-full object-cover" alt="Gallery item" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        className="w-full bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="Agregar descripción..."
                        defaultValue={photo.caption || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (photo.caption || '')) {
                            updatePhoto(photo.id, { caption: e.target.value });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).blur();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => renamePhotoFile(photo)}
                          className="text-[10px] text-slate-400 font-medium hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          Renombrar archivo
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="text-[10px] text-red-400 font-medium hover:text-red-600 transition-colors"
                        >
                          Eliminar foto
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
                    No hay fotos en la galería de este evento.
                  </div>
                )}
              </div>
            </div>
          )}

          <Button className="bg-emerald-700 text-white w-full py-2" onClick={save}>
            {editingId ? 'Actualizar evento' : 'Guardar evento'}
          </Button>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl p-0 overflow-hidden">
        <WikiMediaManager onClose={() => setOpenWiki(false)} />
      </Modal>
    </div>
  );
}
