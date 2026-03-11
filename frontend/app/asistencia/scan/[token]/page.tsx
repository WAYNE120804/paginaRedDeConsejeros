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


const mapScanErrorMessage = (message?: string) => {
  if (!message) return 'No fue posible registrar tu asistencia.';
  if (message === 'SESSION_OUT_OF_WINDOW') {
    return 'Esta sesión ya no está activa. El tiempo permitido para registrar asistencia ya pasó.';
  }
  if (message === 'NOT_REGISTERED') {
    return 'Tu código estudiantil no existe en el sistema. Contacta al equipo administrativo para validarlo.';
  }
  return message;
};

export default function AttendanceScanPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const code = studentCode.trim();
    if (!code) {
      setError('Ingresa tu código estudiantil.');
      return;
    }

    if (!token) {
      setError('Token de asistencia inválido.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/attendance/scan/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentCode: code }),
      });

      const payload = (await response.json()) as ApiEnvelope<ScanResult>;
      if (!response.ok || payload.error) {
        const message = mapScanErrorMessage(payload.error?.message);
        setError(message);
        return;
      }

      setResult(payload.data);
      setStudentCode('');
    } catch {
      setError('No fue posible registrar tu asistencia. Inténtalo nuevamente.');
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
            Escaneaste el código QR de una sesión activa. Ingresa tu código estudiantil para confirmar tu asistencia.
          </p>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <Input
              placeholder="Código estudiantil"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="bg-emerald-700 text-white" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar asistencia'}
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
