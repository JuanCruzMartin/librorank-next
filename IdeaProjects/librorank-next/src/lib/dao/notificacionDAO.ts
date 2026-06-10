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
