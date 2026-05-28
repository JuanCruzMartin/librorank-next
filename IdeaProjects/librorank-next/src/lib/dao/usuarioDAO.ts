import { query, queryOne, execute } from '@/lib/db'

export interface Usuario {
  id: number
  nombre: string
  username: string
  email: string
  password_hash?: string
  bio: string | null
  avatar_url: string | null
  nivel_id: number | null
  objetivo_anual: number | null
  puntos: number
  generos_favoritos: string | null
  racha_actual: number
  ultima_fecha_lectura: string | null
  total_leidos?: number
}

export async function registrar(u: {
  nombre: string; username: string; email: string; password_hash: string
  bio?: string; avatar_url?: string; nivel_id?: number; objetivo_anual?: number
}): Promise<boolean> {
  const res = await execute(
    'INSERT INTO usuarios(nombre, username, email, password_hash, bio, avatar_url, nivel_id, objetivo_anual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [u.nombre, u.username, u.email, u.password_hash, u.bio ?? null, u.avatar_url ?? null, u.nivel_id ?? null, u.objetivo_anual ?? null]
  )
  return res.affectedRows > 0
}

export async function buscarPorEmailOUsername(identificador: string): Promise<Usuario | null> {
  return queryOne<Usuario>(
    `SELECT id, nombre, username, email, password_hash, bio, avatar_url,
            nivel_id, objetivo_anual, monedas AS puntos, generos_favoritos, racha_actual, ultima_fecha_lectura
     FROM usuarios WHERE email = ? OR username = ? LIMIT 1`,
    [identificador, identificador]
  )
}

export async function buscarPorUsername(username: string): Promise<Usuario | null> {
  return queryOne<Usuario>(
    `SELECT id, nombre, username, email, bio, avatar_url, monedas AS puntos,
            nivel_id, objetivo_anual, generos_favoritos, racha_actual
     FROM usuarios WHERE username = ? LIMIT 1`,
    [username]
  )
}

export async function buscarPorId(id: number): Promise<Usuario | null> {
  return queryOne<Usuario>(
    `SELECT id, nombre, username, email, bio, avatar_url, monedas AS puntos,
            nivel_id, objetivo_anual, generos_favoritos, racha_actual
     FROM usuarios WHERE id = ?`,
    [id]
  )
}

export async function obtenerRankingLectores(limite = 50): Promise<Usuario[]> {
  return query<Usuario>(
    `SELECT u.id, u.nombre, u.username, u.email, u.bio, u.avatar_url, u.objetivo_anual,
            u.monedas AS puntos, COUNT(l.id) AS total_leidos
     FROM usuarios u
     LEFT JOIN libros_usuario l ON u.id = l.usuario_id AND l.estado = 'LEIDO'
     GROUP BY u.id, u.nombre, u.username, u.email, u.bio, u.avatar_url, u.objetivo_anual, u.monedas
     ORDER BY puntos DESC, total_leidos DESC, u.nombre ASC
     LIMIT ?`,
    [limite]
  )
}

export async function actualizarPerfilBasico(u: {
  id: number; nombre: string; username: string; email: string
  bio?: string; objetivo_anual?: number; generos_favoritos?: string
}): Promise<boolean> {
  const res = await execute(
    `UPDATE usuarios SET nombre=?, username=?, email=?, bio=?, objetivo_anual=?, generos_favoritos=? WHERE id=?`,
    [u.nombre, u.username, u.email, u.bio ?? null, u.objetivo_anual ?? null, u.generos_favoritos ?? null, u.id]
  )
  return res.affectedRows > 0
}

export async function actualizarAvatarUrl(usuarioId: number, avatarUrl: string): Promise<boolean> {
  const res = await execute('UPDATE usuarios SET avatar_url=? WHERE id=?', [avatarUrl, usuarioId])
  return res.affectedRows > 0
}

export async function actualizarPasswordHash(id: number, hash: string): Promise<void> {
  await execute('UPDATE usuarios SET password_hash=? WHERE id=?', [hash, id])
}

export async function actualizarRacha(usuarioId: number): Promise<boolean> {
  const row = await queryOne<{ racha_actual: number; ultima_fecha_lectura: string | null }>(
    'SELECT racha_actual, ultima_fecha_lectura FROM usuarios WHERE id=?', [usuarioId]
  )
  if (!row) return false

  const hoy = new Date().toISOString().split('T')[0]
  const ultima = row.ultima_fecha_lectura?.split('T')[0] ?? null

  if (ultima === hoy) return true

  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const nuevaRacha = ultima === ayer ? row.racha_actual + 1 : 1

  const res = await execute(
    'UPDATE usuarios SET racha_actual=?, ultima_fecha_lectura=? WHERE id=?',
    [nuevaRacha, hoy, usuarioId]
  )
  return res.affectedRows > 0
}

export function getTituloLector(totalLeidos: number): string {
  // Mantenida por compatibilidad — usar getNivelLector(puntos) cuando se tenga el dato
  if (totalLeidos >= 100) return 'Guardián del Conocimiento'
  if (totalLeidos >= 50) return 'Maestro Lector'
  if (totalLeidos >= 20) return 'Explorador Literario'
  if (totalLeidos >= 5) return 'Aprendiz de las Letras'
  if (totalLeidos >= 1) return 'Nuevo Lector'
  return 'Sin título aún'
}

// Re-exportar desde nivelUtils para no romper imports existentes en server components
export type { NivelInfo } from '@/lib/nivelUtils'
export { getNivelLector } from '@/lib/nivelUtils'
