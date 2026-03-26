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
type EventTimeSlot = { startTime: string; endTime: string; label?: string | null };
type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  type: string;
  visibility: 'PUBLIC' | 'HIDDEN';
  date: string;
  startTime: string;
  endTime: string;
  timeSlots?: EventTimeSlot[];
  location: string;
  photos?: EventPhoto[];
};
type Envelope<T> = { data: T; error: null | { message?: string } };

const createInitialForm = () => ({
  title: '',
  description: '',
  content: '',
  type: 'PUBLIC_EVENT',
  visibility: 'PUBLIC',
  date: '',
  location: '',
  timeSlots: [{ startTime: '08:00', endTime: '10:00', label: '' }],
});

export default function EventosAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO' || role === 'COMUNICACIONES';
  const [items, setItems] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(createInitialForm);
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

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  const resetEditor = () => {
    setOpen(false);
    setEditingId(null);
    setForm(createInitialForm());
    setGallery([]);
  };

  const save = async () => {
    try {
      const timeSlots = form.timeSlots
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: slot.label?.trim() || undefined,
        }))
        .filter((slot) => slot.startTime && slot.endTime)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (timeSlots.length === 0) {
        toast.error('Agrega al menos un horario para el evento');
        return;
      }

      const payload = {
        ...form,
        timeSlots,
        startTime: timeSlots[0].startTime,
        endTime: timeSlots[timeSlots.length - 1].endTime,
      };

      if (editingId) {
        await apiClient.patch(`/events/${editingId}`, payload);
        toast.success('Evento actualizado');
      } else {
        await apiClient.post('/events', payload);
        toast.success('Evento creado');
      }

      resetEditor();
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar este evento permanentemente?')) return;
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
      location: item.location,
      timeSlots: item.timeSlots?.length
        ? item.timeSlots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            label: slot.label || '',
          }))
        : [{ startTime: item.startTime, endTime: item.endTime, label: '' }],
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

  const updateSlot = (index: number, key: keyof EventTimeSlot, value: string) => {
    setForm((current) => ({
      ...current,
      timeSlots: current.timeSlots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [key]: value } : slot,
      ),
    }));
  };

  const addSlot = () => {
    setForm((current) => ({
      ...current,
      timeSlots: [...current.timeSlots, { startTime: '08:00', endTime: '10:00', label: '' }],
    }));
  };

  const removeSlot = (index: number) => {
    setForm((current) => ({
      ...current,
      timeSlots: current.timeSlots.filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingId || !e.target.files?.[0]) return;
    setLoadingPhoto(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await apiClient.post<EventPhoto>(`/events/${editingId}/photos`, formData);
      setGallery((prev) => [...prev, res]);
      toast.success('Foto anadida a galeria');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const updatePhoto = async (photoId: string, data: Partial<EventPhoto>) => {
    if (!editingId) return;
    try {
      await apiClient.patch(`/events/${editingId}/photos/${photoId}`, data);
      setGallery((prev) => prev.map((photo) => (photo.id === photoId ? { ...photo, ...data } : photo)));
      toast.success('Galeria actualizada');
    } catch {
      toast.error('Error al actualizar foto');
    }
  };

  const renamePhotoFile = async (photo: EventPhoto) => {
    const currentName = photo.photoUrl.split('/').pop() || '';
    const newName = prompt('Nuevo nombre del archivo (sin cambiar extension):', currentName);
    if (!newName || newName === currentName) return;

    try {
      await apiClient.patch('/storage/rename', { oldPath: photo.photoUrl, newName });
      const newUrl = photo.photoUrl.replace(currentName, newName);
      await updatePhoto(photo.id, { photoUrl: newUrl });
      toast.success('Archivo renombrado');
    } catch {
      toast.error('Error al renombrar archivo');
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!editingId || !confirm('Quitar esta foto de la galeria?')) return;
    try {
      await apiClient.delete(`/events/${editingId}/photos/${photoId}`);
      setGallery((prev) => prev.filter((photo) => photo.id !== photoId));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar foto');
    }
  };

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No tienes permisos para gestionar eventos.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <Button className="bg-emerald-700 text-white" onClick={() => setOpen(true)}>
          Nuevo evento
        </Button>
      </Card>

      <Table>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <Th>Titulo</Th>
              <Th>Fecha</Th>
              <Th>Horarios</Th>
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
                  <div className="space-y-1 text-xs text-slate-500">
                    {(item.timeSlots?.length
                      ? item.timeSlots
                      : [{ startTime: item.startTime, endTime: item.endTime, label: '' }]
                    ).map((slot, index) => (
                      <p key={`${item.id}-slot-${index}`}>
                        {slot.label ? `${slot.label}: ` : ''}
                        {slot.startTime} - {slot.endTime}
                      </p>
                    ))}
                  </div>
                </Td>
                <Td>
                  <span className="text-xs font-bold uppercase text-slate-500">{item.type}</span>
                </Td>
                <Td>
                  <Badge variant={item.visibility === 'PUBLIC' ? 'success' : 'warning'}>
                    {item.visibility === 'PUBLIC' ? 'Publico' : 'Oculto'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button className="border border-slate-200" onClick={() => startEdit(item)}>
                      Editar
                    </Button>
                    <Button className="border border-slate-200" onClick={() => toggleVisibility(item)}>
                      Alternar
                    </Button>
                    <Button className="border border-red-200 text-red-600" onClick={() => remove(item.id)}>
                      Eliminar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={open} onClose={resetEditor}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar evento' : 'Crear evento'}</h2>
        <div className="mt-3 grid max-h-[70vh] gap-3 overflow-y-auto p-1 scroll-modern">
          <Input placeholder="Titulo" value={form.title} onChange={(e) => setForm((value) => ({ ...value, title: e.target.value }))} />
          <Input placeholder="Resumen corto" value={form.description} onChange={(e) => setForm((value) => ({ ...value, description: e.target.value }))} />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">Contenido expandido (opcional)</label>
              <button onClick={() => setOpenWiki(true)} className="flex items-center gap-1 text-xs text-emerald-600 underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                Insertar imagen
              </button>
            </div>
            <textarea
              className="scroll-modern min-h-[150px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              placeholder="Desarrollo del evento..."
              value={form.content}
              onChange={(e) => setForm((value) => ({ ...value, content: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <label className="ml-1 text-[10px] font-bold uppercase text-slate-400">Fecha</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((value) => ({ ...value, date: e.target.value }))} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Horarios del evento</p>
                  <p className="text-xs text-slate-400">Agrega una o varias secciones dentro del mismo dia.</p>
                </div>
                <Button type="button" className="border border-emerald-200 bg-white text-emerald-700" onClick={addSlot}>
                  Agregar horario
                </Button>
              </div>

              <div className="mt-3 space-y-3">
                {form.timeSlots.map((slot, index) => (
                  <div key={`slot-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Franja {index + 1}</p>
                      {form.timeSlots.length > 1 ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                          onClick={() => removeSlot(index)}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr]">
                      <Input
                        placeholder="Nombre opcional. Ej: Jornada tarde"
                        value={slot.label || ''}
                        onChange={(e) => updateSlot(index, 'label', e.target.value)}
                      />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      />
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Input placeholder="Lugar" value={form.location} onChange={(e) => setForm((value) => ({ ...value, location: e.target.value }))} />

          <div className="grid grid-cols-2 gap-2">
            <Select value={form.type} onChange={(e) => setForm((value) => ({ ...value, type: e.target.value }))}>
              <option value="PUBLIC_EVENT">Evento publico</option>
              <option value="ASSEMBLY">Asamblea</option>
              <option value="BOARD_MEETING">Junta</option>
            </Select>
            <Select value={form.visibility} onChange={(e) => setForm((value) => ({ ...value, visibility: e.target.value }))}>
              <option value="PUBLIC">Publico</option>
              <option value="HIDDEN">Oculto</option>
            </Select>
          </div>

          {editingId ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-700">Galeria de fotos</h3>
                <label className="cursor-pointer">
                  <div className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${loadingPhoto ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                    {loadingPhoto ? 'Subiendo...' : 'Anadir foto'}
                  </div>
                  <input type="file" className="hidden" onChange={handleUploadGallery} accept="image/*" disabled={loadingPhoto} />
                </label>
              </div>

              <div className="scroll-modern grid max-h-[22rem] grid-cols-1 gap-4 overflow-y-auto pr-2">
                {gallery.map((photo) => (
                  <div key={photo.id} className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img src={getFileUrl(photo.photoUrl)} className="h-full w-full object-cover" alt="Gallery item" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none transition-all focus:ring-1 focus:ring-emerald-500"
                        placeholder="Agregar descripcion..."
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
                          className="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-indigo-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                          Renombrar archivo
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="text-[10px] font-medium text-red-400 transition-colors hover:text-red-600"
                        >
                          Eliminar foto
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {gallery.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-100 py-6 text-center text-xs text-slate-400">
                    No hay fotos en la galeria de este evento.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button className="w-full bg-emerald-700 py-2 text-white" onClick={save}>
            {editingId ? 'Actualizar evento' : 'Guardar evento'}
          </Button>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl overflow-hidden p-0">
        <WikiMediaManager onClose={() => setOpenWiki(false)} />
      </Modal>
    </div>
  );
}
