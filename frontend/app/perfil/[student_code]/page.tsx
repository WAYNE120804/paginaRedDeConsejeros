import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { PageShell } from '@/components/ui/page-shell';
import { getFileUrl } from '@/lib/utils';
import type { BoardMandate, Leader, PersonSummary, RepresentativeMandate } from '@/lib/types/public';
import { publicApi } from '@/services/public-api';

type TimelineItem = {
  id: string;
  kind: 'representante' | 'lider' | 'junta';
  title: string;
  subtitle: string;
  detail?: string | null;
  startDate: string;
  endDate?: string | null;
  active: boolean;
};

type ProfileRole = {
  kind: 'representante' | 'lider' | 'junta';
  label: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate?: string | null;
  active: boolean;
};

const boardLabels: Record<string, string> = {
  PRESIDENTE: 'Presidente',
  VICEPRESIDENTE: 'Vicepresidente',
  FISCAL: 'Fiscal',
  SECRETARIA_GENERAL: 'Secretaría General',
  DIRECTOR_PLANEACION: 'Director de Planeación',
  JEFE_COMUNICACIONES: 'Jefe de Comunicaciones',
};

function formatDate(date: string | null | undefined) {
  if (!date) return 'Actualidad';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function getRepresentativeTitle(estateType: string) {
  return `Representante ante ${estateType}`;
}

function getCurrentOrLatest<T extends { startDate: string }>(
  items: T[],
  predicate: (item: T) => boolean,
) {
  return items.find(predicate) ?? items[0] ?? null;
}

function getProfileRoles(
  repHistory: RepresentativeMandate[],
  leaderHistory: Leader[],
  boardHistory: BoardMandate[],
) {
  const representative = getCurrentOrLatest(repHistory, (item) => item.status === 'ACTIVE');
  const leader = getCurrentOrLatest(leaderHistory, (item) => Boolean(item.isActive));
  const board = getCurrentOrLatest(boardHistory, (item) => Boolean(item.isActive));

  const roles: ProfileRole[] = [];

  if (representative) {
    roles.push({
      kind: 'representante',
      label: representative.status === 'ACTIVE' ? 'Representante actual' : 'Representante',
      title: getRepresentativeTitle(representative.estateType),
      subtitle: `${representative.faculty} · ${representative.program}`,
      startDate: representative.startDate,
      endDate: representative.endDate,
      active: representative.status === 'ACTIVE',
    });
  }

  if (leader) {
    roles.push({
      kind: 'lider',
      label: leader.isActive ? 'Líder actual' : 'Líder',
      title: leader.description || 'Líder institucional',
      subtitle: `${leader.faculty} · ${leader.program}`,
      startDate: leader.startDate,
      endDate: leader.endDate,
      active: Boolean(leader.isActive),
    });
  }

  if (board) {
    roles.push({
      kind: 'junta',
      label: board.isActive ? 'Miembro actual de junta' : 'Miembro de junta',
      title: boardLabels[board.position] ?? board.position,
      subtitle: 'Junta directiva de la Red de Consejeros',
      startDate: board.startDate,
      endDate: board.endDate,
      active: Boolean(board.isActive),
    });
  }

  return roles;
}

function buildTimeline(
  repHistory: RepresentativeMandate[],
  leaderHistory: Leader[],
  boardHistory: BoardMandate[],
): TimelineItem[] {
  const repItems = repHistory.map((item) => ({
    id: item.id,
    kind: 'representante' as const,
    title: getRepresentativeTitle(item.estateType),
    subtitle: `${item.faculty} · ${item.program}`,
    detail: item.description,
    startDate: item.startDate,
    endDate: item.endDate,
    active: item.status === 'ACTIVE',
  }));

  const leaderItems = leaderHistory.map((item) => ({
    id: item.id,
    kind: 'lider' as const,
    title: item.description || 'Líder institucional',
    subtitle: `${item.faculty} · ${item.program}`,
    detail: null,
    startDate: item.startDate,
    endDate: item.endDate,
    active: Boolean(item.isActive),
  }));

  const boardItems = boardHistory.map((item) => ({
    id: item.id,
    kind: 'junta' as const,
    title: boardLabels[item.position] ?? item.position,
    subtitle: 'Junta directiva de la Red de Consejeros',
    detail: null,
    startDate: item.startDate,
    endDate: item.endDate,
    active: Boolean(item.isActive),
  }));

  return [...boardItems, ...repItems, ...leaderItems].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;

    if (a.active && b.active) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }

    const aEnd = a.endDate ? new Date(a.endDate).getTime() : 0;
    const bEnd = b.endDate ? new Date(b.endDate).getTime() : 0;

    if (aEnd !== bEnd) return bEnd - aEnd;

    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
}

function getPerson(
  repHistory: RepresentativeMandate[],
  leaderHistory: Leader[],
  boardHistory: BoardMandate[],
): PersonSummary | null {
  return repHistory[0]?.person ?? leaderHistory[0]?.person ?? boardHistory[0]?.person ?? null;
}

function normalizeInstagramUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export default async function PersonProfilePage({ params }: { params: Promise<{ student_code: string }> }) {
  const { student_code: personId } = await params;

  const [repHistory, leaderHistory, boardHistory]: [RepresentativeMandate[], Leader[], BoardMandate[]] =
    await Promise.all([
      publicApi.representativeHistory(personId).catch(() => [] as RepresentativeMandate[]),
      publicApi.leaderHistory(personId).catch(() => [] as Leader[]),
      publicApi.boardHistory(personId).catch(() => [] as BoardMandate[]),
    ]);

  const person = getPerson(repHistory, leaderHistory, boardHistory);
  if (!person) notFound();

  const profileRoles = getProfileRoles(repHistory, leaderHistory, boardHistory);
  const timeline = buildTimeline(repHistory, leaderHistory, boardHistory);
  const hasActiveBoardRole = boardHistory.some((item) => item.isActive);

  return (
    <PageShell>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#ecfdf5_100%)] px-6 py-10 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <div className="flex justify-center lg:justify-start">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-white text-center shadow-sm sm:h-44 sm:w-44">
                {person.photoUrl ? (
                  <img src={getFileUrl(person.photoUrl)} alt={person.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-6 text-5xl font-black uppercase text-slate-800">
                    {person.fullName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-950 sm:text-5xl">
                {person.fullName}
              </h1>

              {profileRoles.length > 0 ? (
                <div className="mt-4 space-y-5 text-slate-900">
                  {profileRoles.map((role) => (
                    <div key={`${role.kind}-${role.startDate}`} className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">{role.label}</p>
                      <p className="text-xl font-extrabold uppercase sm:text-2xl">{role.title}</p>
                      {role.subtitle ? (
                        <p className="text-lg font-bold uppercase text-slate-700">{role.subtitle}</p>
                      ) : null}
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Fecha de inicio: {formatDate(role.startDate)}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Fecha de finalización: {formatDate(role.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {hasActiveBoardRole ? (
                <div className="mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Miembro actual de la junta directiva
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-black uppercase text-slate-950">Descripción</h2>
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-base leading-8 text-slate-700 sm:text-lg">
                  {person.publicDescription?.trim() || 'Este perfil aún no tiene una descripción pública registrada.'}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase text-slate-950">Historial</h2>
              <div className="mt-6 space-y-4">
                {timeline.length > 0 ? (
                  timeline.map((item) => (
                    <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold uppercase text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{item.subtitle}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                            item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.active ? 'Actual' : 'Finalizado'}
                        </span>
                      </div>

                      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </p>

                      {item.detail ? (
                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    No hay historial público disponible para esta persona.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Correo institucional</p>
              <p className="mt-2 break-all text-lg font-semibold text-slate-800">{person.institutionalEmail}</p>
              {person.instagramUrl ? (
                <Link
                  href={normalizeInstagramUrl(person.instagramUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-700 transition hover:border-pink-300 hover:bg-pink-50"
                >
                  <Instagram size={16} />
                  {person.instagramLabel || person.instagramUrl}
                </Link>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Resumen público</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-bold text-slate-950">{repHistory.length}</span> registro(s) como representante
                </p>
                <p>
                  <span className="font-bold text-slate-950">{leaderHistory.length}</span> registro(s) como líder
                </p>
                <p>
                  <span className="font-bold text-slate-950">{boardHistory.length}</span> cargo(s) en junta
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
