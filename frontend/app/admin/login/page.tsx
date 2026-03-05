'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { env } from '@/lib/env';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      toast.success('Ingreso exitoso');
      router.push('/admin');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4">
      <Toaster richColors position="top-right" />
      <section className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <Image src="/assets/logo-red.svg" alt="Logo Red de Consejeros" width={72} height={72} className="rounded-xl" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Ingreso administrativo</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Red de Consejeros • Universidad de Manizales</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Correo institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-200 transition focus:ring"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-200 transition focus:ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
}
