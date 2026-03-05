'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Button } from '@/components/ui/admin/button';
import { Input } from '@/components/ui/admin/input';
import { Select } from '@/components/ui/admin/select';
import { Modal } from '@/components/ui/admin/modal';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type Envelope<T> = { data: T; error: null | { message?: string } };

type Session = {
  id: string;
  type: 'ASSEMBLY' | 'BOARD' | 'EVENT';
  name: string;
  shortDescription?: string | null;
  activeFrom: string;
  activeUntil: string;
  allowManual: boolean;
  token: string;
  scanUrl?: string;
  qrDataUrl?: string;
};

type AttendanceRecord = {
  id: string;
  mode: 'QR' | 'MANUAL';
  timestamp: string;
  note?: string | null;
  person: { fullName: string; studentCode: string; institutionalEmail: string };
};

export default function AsistenciaAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openManual, setOpenManual] = useState(false);

  const [createForm, setCreateForm] = useState({
    type: 'ASSEMBLY',
    name: '',
    shortDescription: '',
    activeFrom: '',
    activeUntil: '',
    allowManual: true,
  });

  const [manualForm, setManualForm] = useState({
    studentCode: '',
    note: '',
    fullName: '',
    institutionalEmail: '',
  });

  const loadSession = async (sessionId: string) => {
    try {
      const detail = await apiClient.get<Envelope<Session>>(`/attendance/sessions/${sessionId}`);
      setSession(detail.data);

      const listed = await apiClient.get<Envelope<AttendanceRecord[]>>(`/attendance/sessions/${sessionId}/records`);
      setRecords(listed.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const createSession = async () => {
    try {
      const response = await apiClient.post<Envelope<Session>>('/attendance/sessions', {
        ...createForm,
        allowManual: createForm.allowManual,
      });
      toast.success('Sesión de asistencia creada');
      setOpenCreate(false);
      loadSession(response.data.id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitManual = async () => {
    if (!session) return;
    try {
      await apiClient.post(`/attendance/sessions/${session.id}/records/manual`, manualForm);
      toast.success('Asistencia manual registrada');
      setOpenManual(false);
      setManualForm({ studentCode: '', note: '', fullName: '', institutionalEmail: '' });
      loadSession(session.id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    // sin listado global en API, se usa flujo de crear sesión y luego gestionar sobre la sesión activa en pantalla
  }, [canManage]);

  if (!canManage) return <Card><p className="text-sm text-slate-500">No tienes permisos para gestionar asistencia.</p></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-emerald-700 text-white" onClick={() => setOpenCreate(true)}>Crear sesión</Button>
          {session ? (
            <>
              <Button className="border border-slate-200" onClick={() => setOpenManual(true)} disabled={!session.allowManual}>Registro manual</Button>
              <a
                href={`http://localhost:3001/api/attendance/sessions/${session.id}/export.xlsx`}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                target="_blank"
                rel="noreferrer"
              >
                Exportar Excel
              </a>
            </>
          ) : null}
        </div>
      </Card>

      {session ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Sesión activa en panel: {session.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{session.shortDescription || 'Sin descripción'}</p>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(session.activeFrom).toLocaleString('es-CO')} - {new Date(session.activeUntil).toLocaleString('es-CO')}
          </p>
          <p className="mt-2 text-sm text-slate-600">URL de escaneo: <span className="font-mono text-xs">{session.scanUrl ?? 'No disponible'}</span></p>
          {session.qrDataUrl ? <img src={session.qrDataUrl} alt="QR asistencia" className="mt-3 h-36 w-36 rounded-lg border border-slate-200" /> : null}
        </Card>
      ) : (
        <Card><p className="text-sm text-slate-500">Crea una sesión para habilitar QR, registro manual y exportación.</p></Card>
      )}

      <Table>
        <table className="min-w-full">
          <thead><tr><Th>Nombre</Th><Th>Código</Th><Th>Correo</Th><Th>Modo</Th><Th>Timestamp</Th></tr></thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-slate-100">
                <Td>{record.person.fullName}</Td>
                <Td>{record.person.studentCode}</Td>
                <Td>{record.person.institutionalEmail}</Td>
                <Td>{record.mode}</Td>
                <Td>{new Date(record.timestamp).toLocaleString('es-CO')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Crear sesión de asistencia</h2>
        <div className="mt-3 space-y-2">
          <Select value={createForm.type} onChange={(e) => setCreateForm((v) => ({ ...v, type: e.target.value }))}>
            <option value="ASSEMBLY">Asamblea</option>
            <option value="BOARD">Junta</option>
            <option value="EVENT">Evento</option>
          </Select>
          <Input placeholder="Nombre" value={createForm.name} onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))} />
          <Input placeholder="Descripción corta" value={createForm.shortDescription} onChange={(e) => setCreateForm((v) => ({ ...v, shortDescription: e.target.value }))} />
          <label className="text-xs text-slate-500">Activa desde</label>
          <Input type="datetime-local" value={createForm.activeFrom} onChange={(e) => setCreateForm((v) => ({ ...v, activeFrom: new Date(e.target.value).toISOString() }))} />
          <label className="text-xs text-slate-500">Activa hasta</label>
          <Input type="datetime-local" value={createForm.activeUntil} onChange={(e) => setCreateForm((v) => ({ ...v, activeUntil: new Date(e.target.value).toISOString() }))} />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={createForm.allowManual} onChange={(e) => setCreateForm((v) => ({ ...v, allowManual: e.target.checked }))} />Permitir registro manual</label>
          <Button className="bg-emerald-700 text-white" onClick={createSession}>Guardar sesión</Button>
        </div>
      </Modal>

      <Modal open={openManual} onClose={() => setOpenManual(false)}>
        <h2 className="text-lg font-semibold text-slate-900">Registro manual</h2>
        <div className="mt-3 space-y-2">
          <Input placeholder="Código estudiantil" value={manualForm.studentCode} onChange={(e) => setManualForm((v) => ({ ...v, studentCode: e.target.value }))} />
          <Input placeholder="Nombre completo (si no existe)" value={manualForm.fullName} onChange={(e) => setManualForm((v) => ({ ...v, fullName: e.target.value }))} />
          <Input placeholder="Correo institucional (si no existe)" value={manualForm.institutionalEmail} onChange={(e) => setManualForm((v) => ({ ...v, institutionalEmail: e.target.value }))} />
          <Input placeholder="Nota" value={manualForm.note} onChange={(e) => setManualForm((v) => ({ ...v, note: e.target.value }))} />
          <Button className="bg-emerald-700 text-white" onClick={submitManual}>Registrar asistencia</Button>
        </div>
      </Modal>
    </div>
  );
}
