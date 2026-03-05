import { env } from '@/lib/env';

interface ApiEnvelope<T> {
  data: T;
  error: { message?: string } | null;
}

async function fetchPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export const publicApi = {
  homeEvents: () => fetchPublic('/events'),
  homeNews: () => fetchPublic('/news'),
  homeDocuments: () => fetchPublic('/documents'),
  representatives: () => fetchPublic('/representation/active'),
  leaders: () => fetchPublic('/leaders/active'),
  board: () => fetchPublic('/board/active'),
};
