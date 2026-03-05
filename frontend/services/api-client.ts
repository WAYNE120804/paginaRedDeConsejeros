import { env } from '@/lib/env';

export class ApiClient {
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: { message: 'Error de red' } }));
      throw new Error(payload?.error?.message ?? 'Error de red');
    }

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
