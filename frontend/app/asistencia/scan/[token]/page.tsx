'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/ui/page-shell';
import { Card } from '@/components/ui/admin/card';
import { Input } from '@/components/ui/admin/input';
import { Button } from '@/components/ui/admin/button';
import { env } from '@/lib/env';

type ScanResult = {
  success: boolean;
  recordId: string;
  timestamp: string;
};

type ApiEnvelope<T> = {
  data: T;
  error: null | { message?: string };
};

type RegistrationForm = {
  studentCode: string;
  fullName: string;
  institutionalEmail: string;
  phone: string;
  position: string;
  organization: string;
};

const initialForm: RegistrationForm = {
  studentCode: '',
  fullName: '',
  institutionalEmail: '',
  phone: '',
  position: '',
  organization: '',
};

const mapScanErrorMessage = (message?: string) => {
  if (!message) return 'No fue posible registrar tu asistencia.';
  if (message === 'SESSION_OUT_OF_WINDOW') {
    return 'Esta sesion ya no esta activa. El tiempo permitido para registrar asistencia ya paso.';
  }
  if (message === 'NOT_REGISTERED') {
    return 'No encontramos tu registro. Completa los datos solicitados para continuar.';
  }
  return message;
};

export default function AttendanceScanPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const code = form.studentCode.trim();
    if (!code) {
      setError('Ingresa tu codigo o cedula.');
      return;
    }

    if (showRegistrationForm) {
      if (!form.fullName.trim()) {
        setError('Ingresa tu nombre completo.');
        return;
      }
      if (!form.institutionalEmail.trim()) {
        setError('Ingresa tu correo.');
        return;
      }
    }

    if (!token) {
      setError('Token de asistencia invalido.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/attendance/scan/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentCode: code,
          ...(showRegistrationForm
            ? {
                fullName: form.fullName.trim(),
                institutionalEmail: form.institutionalEmail.trim(),
                phone: form.phone.trim() || undefined,
                position: form.position.trim() || undefined,
                organization: form.organization.trim() || undefined,
              }
            : {}),
        }),
      });

      const payload = (await response.json()) as ApiEnvelope<ScanResult>;
      if (!response.ok || payload.error) {
        if (payload.error?.message === 'NOT_REGISTERED') {
          setShowRegistrationForm(true);
        }
        setError(mapScanErrorMessage(payload.error?.message));
        return;
      }

      setResult(payload.data);
      setShowRegistrationForm(false);
      setForm(initialForm);
    } catch {
      setError('No fue posible registrar tu asistencia. Intentalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <h1 className="text-2xl font-bold text-slate-900">Registro de asistencia</h1>
          <p className="mt-2 text-sm text-slate-600">
            Escaneaste el codigo QR de una sesion activa. Ingresa tu codigo o cedula para confirmar tu asistencia.
          </p>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <Input
              placeholder="Codigo o cedula *"
              value={form.studentCode}
              onChange={(e) => setForm((current) => ({ ...current, studentCode: e.target.value }))}
              disabled={loading}
            />

            {showRegistrationForm ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-sm text-amber-900">
                  Usuario no registrado. Completa el formulario para crear el registro y marcar la asistencia.
                </p>
                <Input
                  placeholder="Nombre completo *"
                  value={form.fullName}
                  onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                  disabled={loading}
                />
                <Input
                  type="email"
                  placeholder="Correo *"
                  value={form.institutionalEmail}
                  onChange={(e) => setForm((current) => ({ ...current, institutionalEmail: e.target.value }))}
                  disabled={loading}
                />
                <Input
                  placeholder="Telefono"
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  disabled={loading}
                />
                <Input
                  placeholder="Cargo"
                  value={form.position}
                  onChange={(e) => setForm((current) => ({ ...current, position: e.target.value }))}
                  disabled={loading}
                />
                <Input
                  placeholder="Entidad"
                  value={form.organization}
                  onChange={(e) => setForm((current) => ({ ...current, organization: e.target.value }))}
                  disabled={loading}
                />
                <p className="text-xs text-amber-800">Campos obligatorios: codigo o cedula, nombre completo y correo.</p>
              </div>
            ) : null}

            <Button type="submit" className="bg-emerald-700 text-white" disabled={loading}>
              {loading ? 'Registrando...' : showRegistrationForm ? 'Completar registro y asistencia' : 'Registrar asistencia'}
            </Button>
          </form>

          {result ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Asistencia registrada correctamente ({new Date(result.timestamp).toLocaleString('es-CO')}).
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
        </Card>
      </div>
    </PageShell>
  );
}
