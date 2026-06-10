import { query, queryOne, execute } from '@/lib/db'
import { registrar as registrarActividad } from './actividadDAO'

export interface ParticipanteReto {
  usuario_id: number
  username: string
  avatar_url: string | null
  progreso: number
}

export interface RetoAmigo {
  id: number
  creador_id: number
  creador_username: string
  nombre_reto: string
  libro_id: number | null
  titulo_libro: string | null
  fecha_fin: string | null
  participantes: ParticipanteReto[]
}

export async function crearReto(
  creadorId: number, nombre: string, libroId: number | null, fechaFin: string
): Promise<boolean> {
  const res = await execute(
    'INSERT INTO retos_amigos (creador_id, nombre_reto, libro_id, fecha_fin) VALUES (?, ?, ?, ?)',
    [creadorId, nombre, libroId ?? null, fechaFin || null]
  )
  if (res.affectedRows > 0) {
    await unirseAReto(res.insertId, creadorId)
    await registrarActividad(creadorId, 'NUEVO_RETO', libroId, `Ha lanzado un nuevo Reto: ${nombre}`)
    return true
  }
  return false
}

export async function obtenerCreadorReto(retoId: number): Promise<number | null> {
  const row = await queryOne<{ creador_id: number }>(
    'SELECT creador_id FROM retos_amigos WHERE id=?', [retoId]
  )
  return row?.creador_id ?? null
}

export async function unirseAReto(retoId: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    'INSERT IGNORE INTO participantes_reto (reto_id, usuario_id) VALUES (?, ?)',
    [retoId, usuarioId]
  )
  return res.affectedRows > 0
}

export async function actualizarProgreso(retoId: number, usuarioId: number, progreso: number): Promise<boolean> {
  const res = await execute(
    'UPDATE participantes_reto SET progreso=? WHERE reto_id=? AND usuario_id=?',
    [progreso, retoId, usuarioId]
  )
  return res.affectedRows > 0
}

export async function obtenerRetosActivos(usuarioId: number): Promise<RetoAmigo[]> {
  const retos = await query<Omit<RetoAmigo, 'participantes'>>(
    `SELECT r.*, u.username as creador_username, l.titulo as titulo_libro
     FROM retos_amigos r
     JOIN usuarios u ON r.creador_id=u.id
     LEFT JOIN libros_usuario l ON r.libro_id=l.id
     WHERE r.creador_id=?
        OR r.creador_id IN (SELECT amigo_id FROM amigos WHERE usuario_id=?)
        OR r.id IN (SELECT reto_id FROM participantes_reto WHERE usuario_id=?)
     ORDER BY r.id DESC`,
    [usuarioId, usuarioId, usuarioId]
  )

  return Promise.all(retos.map(async r => ({
    ...r,
    participantes: await obtenerParticipantes(r.id),
  })))
}

async function obtenerParticipantes(retoId: number): Promise<ParticipanteReto[]> {
  return query<ParticipanteReto>(
    `SELECT p.usuario_id, u.username, u.avatar_url, p.progreso
     FROM participantes_reto p JOIN usuarios u ON p.usuario_id=u.id
     WHERE p.reto_id=?`,
    [retoId]
  )
}
