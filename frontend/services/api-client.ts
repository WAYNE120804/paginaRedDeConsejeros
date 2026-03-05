import { env } from '@/lib/env';

export class ApiClient {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { method: 'GET', ...init });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      ...init,
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      ...init,
    });
  }
}

export const apiClient = new ApiClient();
