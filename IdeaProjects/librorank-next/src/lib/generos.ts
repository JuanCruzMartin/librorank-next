// Lista canónica de géneros — usar en toda la app
// Cambiar aquí se refleja automáticamente en el formulario y en el mapeo de Google Books

export const GENEROS = [
  'Fantasía',
  'Ciencia Ficción',
  'Romance',
  'Terror',
  'Thriller / Suspenso',
  'Misterio / Policial',
  'Aventura',
  'Clásicos',
  'Contemporánea',
  'Juvenil',
  'Manga / Cómic',
  'Humor',
  'Historia',
  'Biografía',
  'Autoayuda',
  'Psicología',
  'Filosofía',
  'Ciencia',
  'Economía / Negocios',
  'Poesía',
  'Ensayo',
  'Otro',
] as const

export type Genero = (typeof GENEROS)[number]

/** Mapea las categorías que devuelve Google Books a un género canónico */
export function mapearGeneroGoogle(categories: string[]): string {
  const t = categories.join(' ').toLowerCase()

  if (t.includes('fantas') || t.includes('fantasy'))                                     return 'Fantasía'
  if (t.includes('science fiction') || t.includes('sci-fi') || t.includes('ciencia fic')) return 'Ciencia Ficción'
  if (t.includes('romance') || t.includes('love stor'))                                  return 'Romance'
  if (t.includes('horror') || t.includes('terror'))                                      return 'Terror'
  if (t.includes('thriller') || t.includes('suspense') || t.includes('suspens'))         return 'Thriller / Suspenso'
  if (t.includes('mystery') || t.includes('misterio') || t.includes('detective') || t.includes('crime') || t.includes('policial')) return 'Misterio / Policial'
  if (t.includes('adventure') || t.includes('aventura'))                                 return 'Aventura'
  if (t.includes('classic') || t.includes('clásic'))                                     return 'Clásicos'
  if (t.includes('literary') || t.includes('contempor') || t.includes('fiction'))        return 'Contemporánea'
  if (t.includes('young adult') || t.includes('juvenil') || t.includes('teen'))          return 'Juvenil'
  if (t.includes('manga') || t.includes('comic') || t.includes('cómic') || t.includes('graphic novel')) return 'Manga / Cómic'
  if (t.includes('humor') || t.includes('comedy') || t.includes('satir'))                return 'Humor'
  if (t.includes('histor') || t.includes('history'))                                     return 'Historia'
  if (t.includes('biograph') || t.includes('autobio') || t.includes('memoir') || t.includes('biografia')) return 'Biografía'
  if (t.includes('self-help') || t.includes('personal development') || t.includes('autoayuda') || t.includes('motivat') || t.includes('coaching')) return 'Autoayuda'
  if (t.includes('psycholog') || t.includes('psicolog'))                                 return 'Psicología'
  if (t.includes('philosoph') || t.includes('filosof'))                                  return 'Filosofía'
  if (t.includes('science') || t.includes('ciencia') || t.includes('biology') || t.includes('physics') || t.includes('math')) return 'Ciencia'
  if (t.includes('business') || t.includes('econom') || t.includes('finance') || t.includes('negocio') || t.includes('management')) return 'Economía / Negocios'
  if (t.includes('poet') || t.includes('poesia') || t.includes('verse'))                 return 'Poesía'
  if (t.includes('essay') || t.includes('ensayo') || t.includes('nonfiction') || t.includes('non-fiction')) return 'Ensayo'

  return 'Otro'
}
