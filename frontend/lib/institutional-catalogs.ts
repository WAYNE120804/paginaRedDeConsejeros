export const DEFAULT_FACULTIES = [
  'Facultad de Ciencias Contables, Económicas y Administrativas',
  'Facultad de Ciencias de la Salud',
  'Facultad de Ciencias e Ingeniería',
  'Facultad de Ciencias Jurídicas',
  'Facultad de Ciencias Sociales y Humanas',
] as const;

export const DEFAULT_ESTATE_TYPES = [
  'Comité de Programa',
  'Consejo de Facultad',
  'Consejo Académico',
  'Consejo Superior',
] as const;

export const DEFAULT_BOARD_POSITIONS = [
  'Presidente',
  'Vicepresidente',
  'Secretario/a General',
  'Fiscal',
  'Jefe/a de Planeación',
  'Jefe/a de Comunicaciones',
] as const;

export function mergeDefaultWithDynamic(defaultValues: readonly string[], dynamicValues: string[]) {
  return Array.from(new Set([...defaultValues, ...dynamicValues.filter(Boolean)]));
}


export const DEFAULT_DOCUMENT_CATEGORIES = [
  "ESTATUTOS",
  "REGLAMENTOS",
  "LINEAMIENTOS",
  "COMUNICADOS",
  "ACTAS",
] as const;
