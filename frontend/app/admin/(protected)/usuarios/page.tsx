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

type AdminUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

type Envelope<T> = { data: T; error: null | { message?: string } };

export default function UsuariosAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN'; // Only Superadmin should manage users

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openReset, setOpenReset] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    email: '',
    role: 'SECRETARIO',
    password: '',
  });
  
  const [resetForm, setResetForm] = useState({
    temporaryPassword: ''
  });

  const loadData = async () => {
    try {
      const response = await apiClient.get<Envelope<AdminUser[]>>('/admin-users');
      setUsers(response.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (canManage) loadData();
  }, [canManage]);

  const createUser = async () => {
    if (!form.email || !form.password) {
      return toast.error('Correo y contraseña son obligatorios');
    }
    try {
      await apiClient.post<Envelope<any>>('/admin-users', form);
      toast.success('Usuario administrador creado exitosamente');
      setOpenCreate(false);
      setForm({
        email: '',
        role: 'SECRETARIO',
        password: '',
      });
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const disableUser = async (id: string) => {
    if (!confirm('¿Seguro que deseas desactivar este usuario? No podrá iniciar sesión.')) return;
    try {
      await apiClient.patch<Envelope<any>>(`/admin-users/${id}/disable`, {});
      toast.success('Usuario desactivado');
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetPassword = async () => {
    if (!resetForm.temporaryPassword || !openReset) return;
    try {
      await apiClient.patch<Envelope<any>>(`/admin-users/${openReset}/reset-password`, resetForm);
      toast.success('Contraseña restablecida correctamente');
      setOpenReset(null);
      setResetForm({ temporaryPassword: '' });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar roles y administradores. Solo cuentas SUPERADMIN tienen acceso.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">Gestión de Accesos Administrativos</h1>
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>Nuevo Usuario</Button>
        </div>
      </Card>

      <Table>
        <table className="min-w-full">
          <thead>
            <tr>
              <Th>Correo</Th>
              <Th>Rol Asignado</Th>
              <Th>Estado</Th>
              <Th>Último Acceso</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-t border-slate-100 hover:bg-slate-50 transition ${!u.isActive ? 'opacity-60' : ''}`}>
                <Td className="font-medium text-slate-800">{u.email}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${
                    u.role === 'SUPERADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    u.role === 'SECRETARIO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {u.role}
                  </span>
                </Td>
                <Td>
                  {u.isActive ? (
                    <span className="text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">Activo</span>
                  ) : (
                    <span className="text-rose-700 font-medium text-xs bg-rose-50 px-2 py-1 rounded-full">Desactivado</span>
                  )}
                </Td>
                <Td className="text-xs text-slate-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Nunca'}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    {u.isActive && (
                      <>
                        <Button className="border border-slate-200 text-slate-700 hover:bg-slate-100 py-1" onClick={() => setOpenReset(u.id)}>
                          Reset clave
                        </Button>
                        <Button className="border border-red-200 text-red-700 hover:bg-red-50 py-1" onClick={() => disableUser(u.id)}>
                          Suspender
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center py-6 text-slate-500">No hay usuarios registrados</Td>
              </tr>
            )}
          </tbody>
        </table>
      </Table>

      {/* Modal Creación */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} className="max-w-md">
        <h2 className="text-lg font-semibold text-slate-900">Crear Usuario Administrador</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Correo Electrónico Autenticado</label>
            <Input type="email" placeholder="usuario@umanizales.edu.co" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Rol Privilegiado</label>
            <select 
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={form.role} 
              onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))}
            >
              <option value="SECRETARIO">Secretario - Control Académico/Doc</option>
              <option value="COMUNICACIONES">Comunicaciones - Blog/Noticias</option>
              <option value="SUPERADMIN">Superadmin - Acceso Total</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Contraseña Inicial</label>
            <Input type="password" placeholder="Min. 6 caracteres" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} />
          </div>

          <Button className="bg-emerald-700 text-white w-full mt-2" onClick={createUser}>Crear Usuario</Button>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal open={openReset !== null} onClose={() => setOpenReset(null)} className="max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900">Restablecer Contraseña</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Ingresa una nueva contraseña temporal para que el usuario pueda ingresar.</p>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Nueva Contraseña</label>
            <Input type="password" placeholder="Nueva clave..." value={resetForm.temporaryPassword} onChange={(e) => setResetForm((v) => ({ ...v, temporaryPassword: e.target.value }))} />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full" onClick={resetPassword}>Confirmar Cambio</Button>
        </div>
      </Modal>

    </div>
  );
}
