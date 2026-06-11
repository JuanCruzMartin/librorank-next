import { query, queryOne, execute } from '@/lib/db'

export interface Notificacion {
  id: number
  usuario_id: number
  tipo: string
  mensaje: string
  leido: boolean
  fecha_creacion: string
  actor_username: string | null
  actor_avatar_url: string | null
}

interface OpcionesNotif {
  actorUsername?: string
  actorAvatarUrl?: string | null
}

export async function crearNotificacion(
  usuarioId: number,
  tipo: string,
  mensaje: string,
  opts?: OpcionesNotif
): Promise<void> {
  await execute(
    `INSERT INTO notificaciones (usuario_id, tipo, mensaje, actor_username, actor_avatar_url)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, tipo, mensaje, opts?.actorUsername ?? null, opts?.actorAvatarUrl ?? null]
  )
}

export async function obtenerNoLeidas(usuarioId: number): Promise<Notificacion[]> {
  return query<Notificacion>(
    `SELECT id, usuario_id, tipo, mensaje, leido, fecha_creacion,
            actor_username, actor_avatar_url
     FROM notificaciones WHERE usuario_id=? AND leido=0
     ORDER BY fecha_creacion DESC LIMIT 30`,
    [usuarioId]
  )
}

export async function obtenerRecientes(usuarioId: number, limite = 20): Promise<Notificacion[]> {
  return query<Notificacion>(
    `SELECT id, usuario_id, tipo, mensaje, leido, fecha_creacion,
            actor_username, actor_avatar_url
     FROM notificaciones WHERE usuario_id=?
     ORDER BY fecha_creacion DESC LIMIT ?`,
    [usuarioId, limite]
  )
}

export async function marcarLeida(usuarioId: number, notifId: number): Promise<void> {
  await execute(
    'UPDATE notificaciones SET leido=1 WHERE id=? AND usuario_id=?',
    [notifId, usuarioId]
  )
}

export async function marcarTodasLeidas(usuarioId: number): Promise<void> {
  await execute(
    'UPDATE notificaciones SET leido=1 WHERE usuario_id=?',
    [usuarioId]
  )
}

export async function contarNoLeidas(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    'SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id=? AND leido=0',
    [usuarioId]
  )
  return row?.total ?? 0
}

// Notifica a usuarios superados en la liga semanal (fire & forget)
export async function notificarLigaSemanalSuperado(usuarioId: number): Promise<void> {
  // Contar libros leídos esta semana por el usuario que acaba de leer
  const miSemana = await queryOne<{ total: number; monedas: number; username: string }>(
    `SELECT COUNT(l.id) AS total, u.monedas, u.username
     FROM usuarios u
     LEFT JOIN libros_usuario l ON u.id = l.usuario_id
       AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
       AND l.fecha_leido >= DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY)
     WHERE u.id = ?
     GROUP BY u.id, u.monedas, u.username`,
    [usuarioId]
  )
  if (!miSemana || miSemana.total === 0) return

  const misLibrosSemana = Number(miSemana.total)
  const misMonedas = miSemana.monedas
  const miUsername = miSemana.username

  // Rango de la liga basado en puntos totales
  let ligaMin = 0, ligaMax = 299
  if (misMonedas >= 2000) { ligaMin = 2000; ligaMax = 9999999 }
  else if (misMonedas >= 800) { ligaMin = 800; ligaMax = 1999 }
  else if (misMonedas >= 300) { ligaMin = 300; ligaMax = 799 }

  // Buscar usuarios de la misma liga que tengan exactamente misLibrosSemana - 1 libros esta semana
  // → los que acabamos de superar
  const superados = await query<{ id: number; username: string; avatar_url: string | null }>(
    `SELECT u.id, u.username, u.avatar_url
     FROM usuarios u
     JOIN (
       SELECT usuario_id, COUNT(*) AS libros_semana
       FROM libros_usuario
       WHERE UPPER(estado) IN ('LEIDO','LEÍDO')
         AND fecha_leido >= DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY)
       GROUP BY usuario_id
     ) ls ON u.id = ls.usuario_id
     WHERE u.monedas >= ? AND u.monedas <= ?
       AND u.id != ?
       AND ls.libros_semana = ?`,
    [ligaMin, ligaMax, usuarioId, misLibrosSemana - 1]
  )

  for (const superado of superados) {
    // Evitar spam: no notificar si ya lo hicimos hoy
    const yaNotif = await queryOne<{ id: number }>(
      `SELECT id FROM notificaciones
       WHERE usuario_id=? AND tipo='LIGA_SEMANAL' AND actor_username=?
         AND fecha_creacion >= CURDATE()`,
      [superado.id, miUsername]
    )
    if (yaNotif) continue

    await crearNotificacion(
      superado.id,
      'LIGA_SEMANAL',
      `¡@${miUsername} te superó en la Liga Semanal ${ligaMin >= 2000 ? 'Diamante 💎' : ligaMin >= 800 ? 'Oro 🥇' : ligaMin >= 300 ? 'Plata 🥈' : 'Bronce 🥉'}! Ahora tiene ${misLibrosSemana} libro${misLibrosSemana !== 1 ? 's' : ''} esta semana.`,
      { actorUsername: miUsername, actorAvatarUrl: miSemana.username ? null : null }
    )
  }
}
