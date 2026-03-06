'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Card } from '@/components/ui/admin/card';
import { Button } from '@/components/ui/admin/button';
import { Input } from '@/components/ui/admin/input';
import { Select } from '@/components/ui/admin/select';
import { Modal } from '@/components/ui/admin/modal';
import { Table, Td, Th } from '@/components/ui/admin/table';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { env } from '@/lib/env';

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
  eventId?: string | null;
  event?: { id: string; title: string } | null;
  scanUrl?: string;
  qrDataUrl?: string;
  _count?: { records: number };
};

type AttendanceRecord = {
  id: string;
  mode: 'QR' | 'MANUAL';
  timestamp: string;
  note?: string | null;
  person: { fullName: string; studentCode: string; institutionalEmail: string };
};

type EventOption = { id: string; title: string };

const toIsoFromDatetimeLocal = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

export default function AsistenciaAdminPage() {
  const { role } = useAdminAuth();
  const canManage = role === 'SUPERADMIN' || role === 'SECRETARIO';

  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openManual, setOpenManual] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    eventId: '',
    from: '',
    to: '',
    type: '',
  });

  const [createForm, setCreateForm] = useState({
    type: 'ASSEMBLY',
    eventId: '',
    name: '',
    shortDescription: '',
    activeFromLocal: '',
    activeUntilLocal: '',
    allowManual: true,
  });

  const [manualForm, setManualForm] = useState({
    studentCode: '',
    note: '',
    fullName: '',
    institutionalEmail: '',
  });

  const filtersQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.eventId) params.set('eventId', filters.eventId);
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59`).toISOString());
    return params.toString();
  }, [filters]);

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

  const loadSessions = async (keepSelected = true) => {
    try {
      const response = await apiClient.get<Envelope<Session[]>>(`/attendance/sessions${filtersQuery ? `?${filtersQuery}` : ''}`);
      setSessions(response.data);

      if (response.data.length === 0) {
        setSession(null);
        setRecords([]);
        return;
      }

      if (keepSelected && session) {
        const selectedExists = response.data.some((item) => item.id === session.id);
        if (selectedExists) return;
      }

      await loadSession(response.data[0].id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await apiClient.get<Envelope<EventOption[]>>('/events');
      setEvents(response.data);
    } catch {
      setEvents([]);
    }
  };

  const createSession = async () => {
    const activeFrom = toIsoFromDatetimeLocal(createForm.activeFromLocal);
    const activeUntil = toIsoFromDatetimeLocal(createForm.activeUntilLocal);

    if (!activeFrom || !activeUntil) {
      toast.error('Debes seleccionar fecha y hora válidas para la sesión.');
      return;
    }

    if (!createForm.name.trim()) {
      toast.error('Debes ingresar un nombre para la sesión.');
      return;
    }

    try {
      const response = await apiClient.post<Envelope<Session>>('/attendance/sessions', {
        type: createForm.type,
        eventId: createForm.eventId || undefined,
        name: createForm.name.trim(),
        shortDescription: createForm.shortDescription.trim(),
        activeFrom,
        activeUntil,
        allowManual: createForm.allowManual,
      });
      toast.success('Sesión de asistencia creada');
      setOpenCreate(false);
      await loadSessions(false);
      await loadSession(response.data.id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitManual = async () => {
    if (!session) return;
    const studentCode = manualForm.studentCode.trim();

    if (!studentCode) {
      toast.error('Debes ingresar el código estudiantil.');
      return;
    }

    try {
      await apiClient.post(`/attendance/sessions/${session.id}/records/manual`, {
        ...manualForm,
        studentCode,
        fullName: manualForm.fullName.trim(),
        institutionalEmail: manualForm.institutionalEmail.trim(),
        note: manualForm.note.trim(),
      });
      toast.success('Asistencia manual registrada');
      setOpenManual(false);
      setManualForm({ studentCode: '', note: '', fullName: '', institutionalEmail: '' });
      await loadSession(session.id);
      await loadSessions();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    loadSessions();
    loadEvents();
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    loadSessions(false);
  }, [filtersQuery]);

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
                href={`${env.apiBaseUrl}/attendance/sessions/${session.id}/export.xlsx`}
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

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Buscar sesiones</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <Input placeholder="Buscar por nombre o descripción" value={filters.q} onChange={(e) => setFilters((v) => ({ ...v, q: e.target.value }))} />
          <Select value={filters.type} onChange={(e) => setFilters((v) => ({ ...v, type: e.target.value }))}>
            <option value="">Todos los tipos</option>
            <option value="ASSEMBLY">Asamblea</option>
            <option value="BOARD">Junta</option>
            <option value="EVENT">Evento</option>
          </Select>
          <Select value={filters.eventId} onChange={(e) => setFilters((v) => ({ ...v, eventId: e.target.value }))}>
            <option value="">Todos los eventos</option>
            {events.map((event) => (<option key={event.id} value={event.id}>{event.title}</option>))}
          </Select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters((v) => ({ ...v, from: e.target.value }))} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters((v) => ({ ...v, to: e.target.value }))} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Histórico de sesiones</h2>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 ? <p className="text-sm text-slate-500">No hay sesiones con los filtros actuales.</p> : null}
          {sessions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => loadSession(item.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                session?.id === item.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="font-medium text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.activeFrom).toLocaleString('es-CO')} • Registros: {item._count?.records ?? 0}
                {item.event?.title ? ` • Evento: ${item.event.title}` : ''}
              </p>
            </button>
          ))}
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
          <thead><tr><Th>Nombre</Th><Th>Código</Th><Th>Correo</Th><Th>Modo</Th><Th>Fecha y hora</Th></tr></thead>
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
          <Select value={createForm.eventId} onChange={(e) => setCreateForm((v) => ({ ...v, eventId: e.target.value }))}>
            <option value="">Sin evento asociado</option>
            {events.map((event) => (<option key={event.id} value={event.id}>{event.title}</option>))}
          </Select>
          <Input placeholder="Nombre" value={createForm.name} onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))} />
          <Input placeholder="Descripción corta" value={createForm.shortDescription} onChange={(e) => setCreateForm((v) => ({ ...v, shortDescription: e.target.value }))} />
          <label className="text-xs text-slate-500">Activa desde</label>
          <Input
            type="datetime-local"
            value={createForm.activeFromLocal}
            onChange={(e) => setCreateForm((v) => ({ ...v, activeFromLocal: e.target.value }))}
          />
          <label className="text-xs text-slate-500">Activa hasta</label>
          <Input
            type="datetime-local"
            value={createForm.activeUntilLocal}
            onChange={(e) => setCreateForm((v) => ({ ...v, activeUntilLocal: e.target.value }))}
          />
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
