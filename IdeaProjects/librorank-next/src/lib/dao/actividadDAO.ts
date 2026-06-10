import { query, queryOne, execute } from '@/lib/db'

export interface ActividadSocial {
  id: number
  usuario_id: number
  username: string
  avatar_url: string | null
  tipo_actividad: string
  libro_id: number | null
  titulo: string | null
  portada_url: string | null
  detalle: string | null
  fecha_creacion: string
  total_likes: number
  le_gusta_al_usuario: boolean
}

export async function registrar(
  usuarioId: number, tipo: string, libroId: number | null, detalle: string
): Promise<void> {
  await execute(
    'INSERT INTO actividad_social (usuario_id, tipo_actividad, libro_id, detalle) VALUES (?, ?, ?, ?)',
    [usuarioId, tipo, libroId ?? null, detalle]
  )
}

export async function obtenerFeedAmigos(usuarioId: number): Promise<ActividadSocial[]> {
  return query<ActividadSocial>(
    `SELECT a.*, u.username, u.avatar_url, l.titulo, l.portada_url,
            (SELECT COUNT(*) FROM actividad_likes WHERE actividad_id=a.id) as total_likes,
            (SELECT COUNT(*) FROM actividad_likes WHERE actividad_id=a.id AND usuario_id=?) as le_gusta_al_usuario
     FROM actividad_social a
     JOIN usuarios u ON a.usuario_id=u.id
     LEFT JOIN libros_usuario l ON a.libro_id=l.id
     WHERE a.usuario_id=? OR a.usuario_id IN (SELECT amigo_id FROM amigos WHERE usuario_id=?)
     ORDER BY a.fecha_creacion DESC LIMIT 50`,
    [usuarioId, usuarioId, usuarioId]
  )
}

export async function obtenerAutorActividad(actividadId: number): Promise<{ usuario_id: number } | null> {
  return queryOne<{ usuario_id: number }>(
    'SELECT usuario_id FROM actividad_social WHERE id=?',
    [actividadId]
  )
}

export async function toggleLike(actividadId: number, usuarioId: number): Promise<boolean> {
  const rows = await query(
    'SELECT 1 FROM actividad_likes WHERE actividad_id=? AND usuario_id=?',
    [actividadId, usuarioId]
  )
  if (rows.length > 0) {
    await execute('DELETE FROM actividad_likes WHERE actividad_id=? AND usuario_id=?', [actividadId, usuarioId])
    return false
  }
  await execute('INSERT INTO actividad_likes (actividad_id, usuario_id) VALUES (?, ?)', [actividadId, usuarioId])
  return true
}
