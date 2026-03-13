'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { Modal } from '@/components/ui/admin/modal';
import { Tabs } from '@/components/ui/admin/tabs';
import { Select } from '@/components/ui/admin/select';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { WikiMediaManager } from '@/components/admin/wiki-media-manager';
import { getFileUrl } from '@/lib/utils';

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  coverPhotoUrl?: string | null;
};
type Envelope<T> = { data: T; error: null | { message?: string } };

type ImageDraft = {
  src: string;
  alt: string;
  caption: string;
  size: 'small' | 'medium' | 'wide' | 'full';
  align: 'left' | 'center' | 'right';
  fit: 'cover' | 'contain';
};

const initialImageDraft: ImageDraft = {
  src: '',
  alt: '',
  caption: '',
  size: 'wide',
  align: 'center',
  fit: 'cover',
};

function escapeShortcodeValue(value: string) {
  return value.replace(/"/g, "'");
}

export default function NoticiasAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'COMUNICACIONES';
  const [items, setItems] = useState<NewsItem[]>([]);
  const [tab, setTab] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [open, setOpen] = useState(false);
  const [openWiki, setOpenWiki] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED', coverPhotoUrl: '' });
  const [imageDraft, setImageDraft] = useState<ImageDraft>(initialImageDraft);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    try {
      const response = await apiClient.get<Envelope<NewsItem[]>>('/news');
      setItems(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  const filtered = useMemo(() => items.filter((item) => tab === 'ALL' || item.status === tab), [items, tab]);

  const resetEditor = () => {
    setEditingId(null);
    setForm({ title: '', content: '', status: 'DRAFT', coverPhotoUrl: '' });
    setImageDraft(initialImageDraft);
  };

  const insertAtCursor = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      setForm((current) => ({ ...current, content: `${current.content}${text}` }));
      return;
    }

    const start = textarea.selectionStart ?? form.content.length;
    const end = textarea.selectionEnd ?? form.content.length;
    const nextContent = `${form.content.slice(0, start)}${text}${form.content.slice(end)}`;
    setForm((current) => ({ ...current, content: nextContent }));

    requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + text.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const wrapSelection = (before: string, after = before, fallback = 'Texto') => {
    const textarea = editorRef.current;
    if (!textarea) {
      insertAtCursor(`${before}${fallback}${after}`);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = form.content.slice(start, end) || fallback;
    const insertion = `${before}${selected}${after}`;
    const nextContent = `${form.content.slice(0, start)}${insertion}${form.content.slice(end)}`;
    setForm((current) => ({ ...current, content: nextContent }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertImageBlock = () => {
    if (!imageDraft.src) {
      toast.error('Selecciona una imagen antes de insertarla.');
      return;
    }

    const shortcode =
      `\n\n[[image src="${escapeShortcodeValue(imageDraft.src)}" alt="${escapeShortcodeValue(imageDraft.alt)}" caption="${escapeShortcodeValue(imageDraft.caption)}" size="${imageDraft.size}" align="${imageDraft.align}" fit="${imageDraft.fit}"]]\n\n`;

    insertAtCursor(shortcode);
    setImageDraft((current) => ({ ...initialImageDraft, src: current.src }));
    toast.success('Bloque de imagen insertado en la noticia');
  };

  const uploadCover = async (file: File | undefined) => {
    if (!editingId || !file) {
      toast.error('Guarda primero la noticia para poder cargar la portada.');
      return;
    }

    setUploadingCover(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<NewsItem>(`/news/${editingId}/cover`, formData);
      setForm((current) => ({ ...current, coverPhotoUrl: response.coverPhotoUrl || '' }));
      toast.success('Portada actualizada');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.patch(`/news/${editingId}`, {
          title: form.title,
          content: form.content,
          status: form.status,
        });
        toast.success('Noticia actualizada');
      } else {
        await apiClient.post('/news', {
          title: form.title,
          content: form.content,
          status: form.status,
          publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
        });
        toast.success('Noticia creada');
      }

      setOpen(false);
      resetEditor();
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar esta noticia permanentemente?')) return;
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
    setForm({
      title: item.title,
      content: item.content,
      status: item.status,
      coverPhotoUrl: item.coverPhotoUrl || '',
    });
    setImageDraft(initialImageDraft);
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
            onChange={(value) => setTab(value as 'ALL' | 'DRAFT' | 'PUBLISHED')}
            options={[{ value: 'ALL', label: 'Todas' }, { value: 'DRAFT', label: 'Borradores' }, { value: 'PUBLISHED', label: 'Publicadas' }]}
          />
          <Button
            className="bg-emerald-700 text-white"
            onClick={() => {
              resetEditor();
              setOpen(true);
            }}
          >
            Nueva noticia
          </Button>
        </div>
      </Card>

      <Table>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <Th>Titulo</Th>
                <Th>Slug</Th>
                <Th>Estado</Th>
                <Th>Publicacion</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id}>
                  <Td className="font-medium text-slate-900">{item.title}</Td>
                  <Td>{item.slug}</Td>
                  <Td>{item.status}</Td>
                  <Td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('es-CO') : '-'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button className="border border-slate-200" onClick={() => startEdit(item)}>Editar</Button>
                      <Button className="border border-slate-200" onClick={() => togglePublish(item)}>
                        {item.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button className="border border-red-200 text-red-600" onClick={() => remove(item.id)}>Eliminar</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Table>

      <Modal open={open} onClose={() => { setOpen(false); resetEditor(); }} className="max-w-6xl">
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar noticia' : 'Nueva noticia'}</h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            <Input
              placeholder="Titulo de la noticia"
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            />

            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="border border-slate-200" onClick={() => wrapSelection('**')}>Negrilla</Button>
                <Button className="border border-slate-200" onClick={() => wrapSelection('*')}>Cursiva</Button>
                <Button className="border border-slate-200" onClick={() => insertAtCursor('\n\n## Subtitulo\n\n')}>Subtitulo</Button>
                <Button className="border border-slate-200" onClick={() => insertAtCursor('\n\n> Cita destacada\n\n')}>Cita</Button>
                <Button className="border border-slate-200" onClick={() => insertAtCursor('\n\n- Punto 1\n- Punto 2\n')}>Lista</Button>
                <Button className="border border-slate-200" onClick={() => insertAtCursor('\n\n---\n\n')}>Separador</Button>
              </div>
            </Card>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cuerpo de la noticia</label>
                <span className="text-xs text-slate-400">Soporta markdown y bloques de imagen insertados.</span>
              </div>
              <textarea
                ref={editorRef}
                className="min-h-[30rem] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono leading-7 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 scroll-modern"
                placeholder="Escribe la noticia con subtitulos, citas, listas y bloques de imagen..."
                value={form.content}
                onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-slate-900">Portada principal</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Se muestra al inicio del detalle de la noticia. Guarda la noticia y luego puedes cargar la portada.</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {form.coverPhotoUrl ? (
                  <img src={getFileUrl(form.coverPhotoUrl)} alt="Portada de noticia" className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center text-sm text-slate-400">Sin portada cargada</div>
                )}
              </div>
              <label className="mt-4 block cursor-pointer">
                <div className={`rounded-xl px-4 py-2 text-center text-sm font-medium ${uploadingCover ? 'bg-slate-100 text-slate-400' : 'bg-emerald-700 text-white'}`}>
                  {uploadingCover ? 'Subiendo portada...' : editingId ? 'Cargar portada' : 'Guarda primero para cargar portada'}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={!editingId || uploadingCover}
                  onChange={(e) => uploadCover(e.target.files?.[0])}
                />
              </label>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Bloque de imagen dentro del texto</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Como en una pagina editorial: puedes poner la imagen al inicio, en medio o al final del texto con caption, tamano y recorte.</p>
                </div>
                <Button className="border border-slate-200" onClick={() => setOpenWiki(true)}>Elegir imagen</Button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {imageDraft.src ? (
                  <img src={getFileUrl(imageDraft.src)} alt="Imagen seleccionada" className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-slate-400">Selecciona una imagen desde el gestor de medios para insertarla en el articulo.</div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <Input
                  placeholder="Texto alternativo"
                  value={imageDraft.alt}
                  onChange={(e) => setImageDraft((current) => ({ ...current, alt: e.target.value }))}
                />
                <Input
                  placeholder="Descripcion / caption"
                  value={imageDraft.caption}
                  onChange={(e) => setImageDraft((current) => ({ ...current, caption: e.target.value }))}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <Select value={imageDraft.size} onChange={(e) => setImageDraft((current) => ({ ...current, size: e.target.value as ImageDraft['size'] }))}>
                    <option value="small">Tamano pequeno</option>
                    <option value="medium">Tamano medio</option>
                    <option value="wide">Tamano ancho</option>
                    <option value="full">Tamano completo</option>
                  </Select>
                  <Select value={imageDraft.align} onChange={(e) => setImageDraft((current) => ({ ...current, align: e.target.value as ImageDraft['align'] }))}>
                    <option value="left">Ubicar a la izquierda</option>
                    <option value="center">Centrada</option>
                    <option value="right">Ubicar a la derecha</option>
                  </Select>
                  <Select value={imageDraft.fit} onChange={(e) => setImageDraft((current) => ({ ...current, fit: e.target.value as ImageDraft['fit'] }))}>
                    <option value="cover">Recortar para llenar</option>
                    <option value="contain">Ajustar sin recortar</option>
                  </Select>
                </div>

                <Button className="w-full bg-slate-900 text-white" onClick={insertImageBlock}>Insertar bloque de imagen</Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-slate-900">Guia rapida</h3>
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                <p><span className="font-semibold text-slate-700">Negrilla:</span> usa el boton o escribe <span className="font-mono">**texto**</span></p>
                <p><span className="font-semibold text-slate-700">Cursiva:</span> <span className="font-mono">*texto*</span></p>
                <p><span className="font-semibold text-slate-700">Subtitulo:</span> <span className="font-mono">## Subtitulo</span></p>
                <p><span className="font-semibold text-slate-700">Cita:</span> <span className="font-mono">&gt; Frase destacada</span></p>
                <p><span className="font-semibold text-slate-700">Imagen editorial:</span> usa el panel superior y ubicala en cualquier parte del texto.</p>
              </div>
            </Card>

            <div className="flex gap-2">
              <Select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}>
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicada</option>
              </Select>
              <Button className="flex-1 bg-emerald-700 text-white" onClick={save}>
                {editingId ? 'Actualizar noticia' : 'Guardar noticia'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={openWiki} onClose={() => setOpenWiki(false)} className="max-w-6xl p-0 overflow-hidden">
        <WikiMediaManager
          selectionMode
          onClose={() => setOpenWiki(false)}
          onSelect={(url) => {
            setImageDraft((current) => ({ ...current, src: url, alt: current.alt || form.title }));
            setOpenWiki(false);
          }}
        />
      </Modal>
    </div>
  );
}
