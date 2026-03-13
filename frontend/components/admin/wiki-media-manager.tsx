'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/services/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/admin/button';
import { Input } from '@/components/ui/admin/input';
import { Modal } from '@/components/ui/admin/modal';
import { getFileUrl } from '@/lib/utils';

interface BrowseItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  logicalPath: string;
  size?: number;
  updatedAt?: string;
}

interface WikiMediaManagerProps {
  onSelect?: (url: string) => void;
  onClose: () => void;
  selectionMode?: boolean;
}

export function WikiMediaManager({ onSelect, onClose, selectionMode }: WikiMediaManagerProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingItem, setRenamingItem] = useState<BrowseItem | null>(null);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [movingItem, setMovingItem] = useState<BrowseItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BrowseItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async (path: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get<({ data: BrowseItem[] })>(`/storage/browse?path=${encodeURIComponent(path)}`);
      setItems(res.data);
      setCurrentPath(path);
    } catch {
      toast.error('Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/storage/upload?folder=${encodeURIComponent(currentPath)}`, formData);
      toast.success('Archivo subido');
      load(currentPath);
    } catch {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await apiClient.post('/storage/folder', { parent: currentPath, name: newFolderName });
      toast.success('Carpeta creada');
      setNewFolderName('');
      setShowNewFolder(false);
      load(currentPath);
    } catch {
      toast.error('Error al crear carpeta');
    }
  };

  const handleRename = async () => {
    if (!renamingItem || !newName.trim()) return;
    try {
      const oldPath = renamingItem.type === 'folder' ? renamingItem.logicalPath : renamingItem.logicalPath;
      await apiClient.patch('/storage/rename', { oldPath, newName });
      toast.success('Renombrado exitoso');
      setRenamingItem(null);
      setNewName('');
      load(currentPath);
    } catch {
      toast.error('Error al renombrar');
    }
  };

  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    load(parts.join('/'));
  };

  const handleMove = async (targetFolder: string) => {
    if (!movingItem) return;
    try {
      await apiClient.patch('/storage/move', { oldPath: movingItem.logicalPath, newFolder: targetFolder });
      toast.success('Mover exitoso');
      setMovingItem(null);
      load(currentPath);
    } catch {
      toast.error('Error al mover');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await apiClient.post('/storage/delete', { path: deletingItem.logicalPath });
      toast.success('Eliminado exitoso');
      setDeletingItem(null);
      load(currentPath);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada al portapapeles');
  };

  const folders = items.filter(item => item.type === 'folder');
  const files = items.filter(item => item.type === 'file');

  return (
    <div className="flex h-[min(700px,calc(100vh-4rem))] max-h-[calc(100vh-4rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b bg-slate-50 gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          {currentPath && (
            <Button onClick={handleBack} className="h-8 w-8 p-0 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
          )}
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
              Media Manager
            </h3>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[300px]">/ {currentPath || 'root'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowNewFolder(true)} 
            style={{ backgroundColor: '#047857', color: 'white' }}
            className="h-9 px-4 text-xs font-bold hover:opacity-90 transition flex items-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><line x1="12" x2="12" y1="10" y2="16"/><line x1="9" x2="15" y1="13" y2="13"/></svg>
            Nueva Carpeta
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            style={{ backgroundColor: '#047857', color: 'white' }}
            className="h-9 px-4 text-xs font-bold hover:opacity-90 transition flex items-center gap-2 shadow-md"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            )}
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*" />
          <Button onClick={onClose} className="h-9 w-9 p-0 bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar for Folders */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50 md:flex">
          <div className="p-3 border-b border-slate-100 bg-slate-50 items-center justify-between flex">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explorador</span>
          </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1 scroll-modern">
                 <button 
                   onClick={() => load('')}
                   className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentPath === '' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Raíz
                 </button>
                 {folders.map(folder => (
                   <button 
                     key={folder.id}
                     onClick={() => load(folder.logicalPath)}
                     className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentPath === folder.logicalPath ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={currentPath === folder.logicalPath ? 'text-emerald-500' : 'text-amber-400'}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                      <span className="truncate flex-1 text-left">{folder.name}</span>
                      {movingItem && movingItem.logicalPath !== folder.logicalPath && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMove(folder.logicalPath); }}
                          className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition"
                          title="Mover aquí"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                      )}
                   </button>
                 ))}
                 {movingItem && currentPath !== '' && (
                    <button 
                      onClick={() => handleMove('')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition mt-4"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                       MOVER A RAÍZ
                    </button>
                 )}
              </div>
        </aside>

        {/* Content Grid */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white p-6 scroll-modern">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-emerald-600"></div>
              <p className="text-xs text-slate-400 animate-pulse">Cargando archivos...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Folders Section (Only if not in root or redundant on mobile) */}
              {folders.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Carpetas</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {folders.map((item) => (
                      <div 
                        key={item.id} 
                        className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-amber-50/30 transition border border-transparent hover:border-amber-100 cursor-pointer"
                        onClick={() => load(item.logicalPath)}
                      >
                        <div className="relative group">
                          <svg className="w-16 h-16 text-amber-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                          <div className="absolute -top-1 -right-1 flex gap-1 items-center bg-white/80 rounded-lg p-0.5 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setRenamingItem(item); setNewName(item.name); }}
                                className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                                title="Renombrar"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setMovingItem(item); }}
                                className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                                title="Mover"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                                title="Eliminar"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                             </button>
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-bold text-slate-700 truncate w-full text-center px-1">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Documentos e Imágenes</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {files.map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                    >
                      <div className="relative w-full aspect-square h-[150px] sm:h-[180px] md:h-[150px] lg:h-[140px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                        <img src={getFileUrl(item.logicalPath)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity p-2 text-center">
                          {selectionMode ? (
                            <button 
                              onClick={() => { onSelect?.(item.logicalPath); onClose(); }} 
                              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition shadow-lg flex items-center gap-1.5"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                               SELECCIONAR
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 w-full px-2">
                              {onSelect && (
                                <button 
                                  onClick={() => onSelect(item.logicalPath)} 
                                  className="w-full py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-1.5"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  INSERTAR
                                </button>
                              )}
                              <button 
                                onClick={() => copyToClipboard(`![${item.name}](${item.logicalPath})`)} 
                                className="w-full py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition flex items-center justify-center gap-1.5 text-center"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                                 COPIAR MK
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Buttons on overlay */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRenamingItem(item); setNewName(item.name); }}
                            className="p-1.5 bg-white rounded-lg text-blue-600 shadow-md hover:bg-blue-50 transition border border-slate-200"
                            title="Renombrar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMovingItem(item); }}
                            className="p-1.5 bg-white rounded-lg text-amber-600 shadow-md hover:bg-amber-50 transition border border-slate-200"
                            title="Mover"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }}
                            className="p-1.5 bg-white rounded-lg text-red-600 shadow-md hover:bg-red-50 transition border border-slate-200"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <span className="mt-2 text-[10px] font-medium text-slate-500 truncate w-full text-center px-1">{item.name}</span>
                    </div>
                  ))}
                </div>
                {files.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                     <p className="text-[10px] text-slate-400 font-medium">No hay fotos en esta carpeta</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Area with Stats */}
      {!loading && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium shrink-0">
          <div className="flex gap-4">
             <span>{folders.length} carpetas</span>
             <span>{files.length} archivos</span>
          </div>
          <div className="text-slate-400 opacity-40">
             Sistema de Gestión de Medios
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} className="max-w-xs p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">Crear Carpeta</h4>
          </div>
          <Input 
            placeholder="Nombre de la nueva carpeta" 
            value={newFolderName} 
            onChange={(e) => setNewFolderName(e.target.value)}
            className="rounded-xl border-slate-200" 
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => setShowNewFolder(false)} style={{ backgroundColor: '#f1f5f9', color: '#334155' }} className="flex-1 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</Button>
            <Button onClick={handleCreateFolder} style={{ backgroundColor: '#047857', color: 'white' }} className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90">Crear Carpeta</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal open={!!renamingItem} onClose={() => setRenamingItem(null)} className="max-w-xs p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">Renombrar {renamingItem?.type === 'folder' ? 'Carpeta' : 'Archivo'}</h4>
          </div>
          <Input 
            placeholder="Nuevo nombre" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl border-slate-200"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => setRenamingItem(null)} style={{ backgroundColor: '#f1f5f9', color: '#334155' }} className="flex-1 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</Button>
            <Button onClick={handleRename} style={{ backgroundColor: '#047857', color: 'white' }} className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90">Guardar Cambios</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deletingItem} onClose={() => setDeletingItem(null)} className="max-w-xs p-6">
        <div className="space-y-4 text-center">
          <div className="inline-flex p-3 bg-red-50 rounded-full text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">¿Eliminar {deletingItem?.type === 'folder' ? 'esta carpeta' : 'este archivo'}?</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta acción no se puede deshacer. 
            {deletingItem?.type === 'folder' && ' Se eliminarán todos los archivos dentro.'}
          </p>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setDeletingItem(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold transition">Cancelar</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-600 text-white hover:bg-red-700 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-100 transition">Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Moving Overlay Indicator */}
      {movingItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 backdrop-blur-sm border border-slate-800">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Moviendo {movingItem.type === 'folder' ? 'Carpeta' : 'Archivo'}</span>
              <span className="text-sm font-bold truncate max-w-[200px]">{movingItem.name}</span>
           </div>
           <div className="h-4 w-px bg-slate-700" />
           <p className="text-[10px] font-medium text-emerald-400 animate-pulse">Selecciona carpeta de destino →</p>
           <button 
              onClick={() => setMovingItem(null)}
              className="ml-2 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
           >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
           </button>
        </div>
      )}
    </div>
  );
}
