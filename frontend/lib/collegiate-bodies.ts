export const DEFAULT_FACULTIES = [
  'Facultad de Ciencias e Ingenieria',
  'Facultad de Ciencias de la Salud',
  'Facultad de Derecho y Ciencias Juridicas',
  'Facultad de Ciencias Contables, Economicas y Administrativas',
  'Facultad de Ciencias Sociales y Humanas',
  'N/A - Aplica a toda la universidad',
] as const;

export const DEFAULT_COLLEGIATE_BODIES = [
  'Consejo Superior',
  'Consejo Academico',
  'Consejo de Facultad',
  'Comite de Programa',
] as const;

export function mergeCatalog(defaultValues: readonly string[], dynamicValues: string[]) {
  return Array.from(new Set([...defaultValues, ...dynamicValues.filter(Boolean)])).sort((a, b) => a.localeCompare(b));
}

export function normalizeCollegiateBody(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function getCollegiateBodyTheme(collegiateBody: string) {
  const normalized = normalizeCollegiateBody(collegiateBody);

  if (normalized.includes('SUPERIOR')) {
    return {
      header: 'from-amber-200 via-yellow-100 to-orange-200',
      badge: 'border-amber-300 bg-white/85 text-amber-900',
      avatar: 'from-amber-100 to-yellow-200 text-amber-800',
      detail: 'border-amber-200/80 bg-amber-50 text-amber-900',
      link: 'text-amber-700 hover:text-amber-900',
      adminBadge: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  if (normalized.includes('ACADEMICO')) {
    return {
      header: 'from-sky-200 via-cyan-100 to-blue-200',
      badge: 'border-sky-300 bg-white/85 text-sky-900',
      avatar: 'from-sky-100 to-blue-200 text-sky-800',
      detail: 'border-sky-200/80 bg-sky-50 text-sky-900',
      link: 'text-sky-700 hover:text-sky-900',
      adminBadge: 'border-sky-200 bg-sky-50 text-sky-800',
    };
  }

  if (normalized.includes('FACULTAD')) {
    return {
      header: 'from-emerald-200 via-green-100 to-teal-200',
      badge: 'border-emerald-300 bg-white/85 text-emerald-900',
      avatar: 'from-emerald-100 to-teal-200 text-emerald-800',
      detail: 'border-emerald-200/80 bg-emerald-50 text-emerald-900',
      link: 'text-emerald-700 hover:text-emerald-900',
      adminBadge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }

  if (normalized.includes('PROGRAMA') || normalized.includes('COMITE')) {
    return {
      header: 'from-violet-200 via-fuchsia-100 to-purple-200',
      badge: 'border-violet-300 bg-white/85 text-violet-900',
      avatar: 'from-violet-100 to-fuchsia-200 text-violet-800',
      detail: 'border-violet-200/80 bg-violet-50 text-violet-900',
      link: 'text-violet-700 hover:text-violet-900',
      adminBadge: 'border-violet-200 bg-violet-50 text-violet-800',
    };
  }

  return {
    header: 'from-slate-100 via-zinc-50 to-stone-100',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    avatar: 'from-slate-50 to-slate-100 text-slate-700',
    detail: 'border-slate-100/80 bg-slate-50/80 text-slate-700',
    link: 'text-slate-700 hover:text-slate-900',
    adminBadge: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}
