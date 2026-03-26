import { env } from '@/lib/env';
import type { BoardMandate, Leader, RepresentativeMandate } from '@/lib/types/public';

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
  eventBySlug: (slug: string) => fetchPublic(`/events/${slug}`),
  homeNews: () => fetchPublic('/news'),
  newsBySlug: (slug: string) => fetchPublic(`/news/${slug}`),
  homeDocuments: () => fetchPublic('/documents'),
  representatives: () => fetchPublic<RepresentativeMandate[]>('/representation/active'),
  representativeHistory: (personId: string) => fetchPublic<RepresentativeMandate[]>(`/representation/history/${personId}`),
  leaders: () => fetchPublic<Leader[]>('/leaders/active'),
  leaderHistory: (personId: string) => fetchPublic<Leader[]>(`/leaders/history/${personId}`),
  board: () => fetchPublic<BoardMandate[]>('/board/active'),
  boardHistory: (personId: string) => fetchPublic<BoardMandate[]>(`/board/history/${personId}`),
};
