import { query, queryOne, execute } from '@/lib/db'
import { crearNotificacion } from './notificacionDAO'

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
  escudos_racha: number
  total_leidos?: number
}

export interface RachaResult {
  nuevaRacha: number
  escudoUsado: boolean
  escudosRestantes: number
  escudoGanado: boolean
  milestoneAlcanzado: number | null   // 7, 30 o 100 días
  bonusPts: number
}

export interface UsuarioSemanal {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  puntos: number
  libros_semana: number
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
            nivel_id, objetivo_anual, monedas AS puntos, generos_favoritos,
            racha_actual, ultima_fecha_lectura, COALESCE(escudos_racha, 0) AS escudos_racha
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
            nivel_id, objetivo_anual, generos_favoritos, racha_actual,
            COALESCE(escudos_racha, 0) AS escudos_racha
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

export async function actualizarRacha(usuarioId: number): Promise<RachaResult | null> {
  const row = await queryOne<{ racha_actual: number; ultima_fecha_lectura: string | null; escudos_racha: number }>(
    'SELECT racha_actual, ultima_fecha_lectura, COALESCE(escudos_racha, 0) AS escudos_racha FROM usuarios WHERE id=?',
    [usuarioId]
  )
  if (!row) return null

  const hoy = new Date().toISOString().split('T')[0]
  const ultima = row.ultima_fecha_lectura?.split('T')[0] ?? null

  // Ya actualizamos hoy — devolver estado actual sin cambios
  if (ultima === hoy) return {
    nuevaRacha: row.racha_actual,
    escudoUsado: false,
    escudosRestantes: row.escudos_racha,
    escudoGanado: false,
    milestoneAlcanzado: null,
    bonusPts: 0,
  }

  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const esContinuacion = ultima === ayer

  let nuevaRacha: number
  let escudoUsado = false
  let escudosRestantes = row.escudos_racha

  if (esContinuacion) {
    // Día consecutivo — racha continúa
    nuevaRacha = row.racha_actual + 1
  } else if (row.escudos_racha > 0) {
    // Se rompería la racha, pero hay escudos — usamos uno y mantenemos la racha
    nuevaRacha = row.racha_actual + 1
    escudoUsado = true
    escudosRestantes = row.escudos_racha - 1
  } else {
    // Sin escudos — reset
    nuevaRacha = 1
  }

  // Ganar escudo cada 7 días (máximo 2 escudos)
  const escudoGanado = nuevaRacha % 7 === 0 && escudosRestantes < 2
  if (escudoGanado) {
    escudosRestantes = Math.min(2, escudosRestantes + 1)
  }

  // Bonus de puntos en milestones: 7, 30 y 100 días
  const MILESTONES: Record<number, number> = { 7: 50, 30: 150, 100: 500 }
  const milestoneAlcanzado = MILESTONES[nuevaRacha] !== undefined ? nuevaRacha : null
  const bonusPts = milestoneAlcanzado ? MILESTONES[milestoneAlcanzado] : 0

  // Una sola UPDATE que maneja todo
  await execute(
    `UPDATE usuarios
     SET racha_actual = ?,
         ultima_fecha_lectura = ?,
         escudos_racha = ?,
         monedas = monedas + ?
     WHERE id = ?`,
    [nuevaRacha, hoy, escudosRestantes, bonusPts, usuarioId]
  )

  // Notificación del sistema para milestones de racha
  if (milestoneAlcanzado) {
    const emoji = milestoneAlcanzado >= 100 ? '🔥🔥🔥' : milestoneAlcanzado >= 30 ? '🔥🔥' : '🔥'
    crearNotificacion(
      usuarioId,
      'MILESTONE_RACHA',
      `${emoji} ¡${milestoneAlcanzado} días seguidos leyendo! Ganaste +${bonusPts} puntos bonus`
    ).catch(() => {})
  }
  if (escudoGanado) {
    crearNotificacion(
      usuarioId,
      'ESCUDO_GANADO',
      `🛡️ ¡Ganaste un escudo de racha! Tenés ${escudosRestantes}/2 escudos`
    ).catch(() => {})
  }

  return { nuevaRacha, escudoUsado, escudosRestantes, escudoGanado, milestoneAlcanzado, bonusPts }
}

export async function obtenerRankingSemanal(limite = 50): Promise<UsuarioSemanal[]> {
  return query<UsuarioSemanal>(
    `SELECT u.id, u.nombre, u.username, u.avatar_url, u.monedas AS puntos,
            COUNT(l.id) AS libros_semana
     FROM usuarios u
     JOIN libros_usuario l ON u.id = l.usuario_id
       AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
       AND l.fecha_leido IS NOT NULL
       AND l.fecha_leido >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY u.id, u.nombre, u.username, u.avatar_url, u.monedas
     ORDER BY libros_semana DESC, puntos DESC
     LIMIT ?`,
    [limite]
  )
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
