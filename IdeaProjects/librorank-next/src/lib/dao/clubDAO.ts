import { query, queryOne, execute } from '@/lib/db'

export interface Club {
  id: number
  nombre: string
  descripcion: string | null
  libro_titulo: string | null
  libro_autor: string | null
  libro_portada: string | null
  creador_id: number
  creador_nombre: string
  creador_username: string
  max_miembros: number
  privado: boolean
  activo: boolean
  fecha_creacion: string
  total_miembros: number
  soy_miembro: boolean
  soy_creador: boolean
}

export interface ClubMiembro {
  usuario_id: number
  username: string
  nombre: string
  avatar_url: string | null
  rol: 'creador' | 'miembro'
  fecha_union: string
}

export interface ClubPost {
  id: number
  club_id: number
  usuario_id: number
  username: string
  nombre: string
  avatar_url: string | null
  capitulo: string
  contenido: string
  fecha_creacion: string
}

export async function listarClubes(usuarioId: number): Promise<Club[]> {
  return query<Club>(`
    SELECT c.*,
           u.nombre AS creador_nombre, u.username AS creador_username,
           (SELECT COUNT(*) FROM club_miembros cm WHERE cm.club_id = c.id) AS total_miembros,
           (SELECT COUNT(*) FROM club_miembros cm WHERE cm.club_id = c.id AND cm.usuario_id = ?) AS soy_miembro,
           (c.creador_id = ?) AS soy_creador
    FROM clubes_lectura c
    JOIN usuarios u ON c.creador_id = u.id
    WHERE c.activo = 1
    ORDER BY c.fecha_creacion DESC
  `, [usuarioId, usuarioId])
}

export async function obtenerClub(clubId: number, usuarioId: number): Promise<Club | null> {
  return queryOne<Club>(`
    SELECT c.*,
           u.nombre AS creador_nombre, u.username AS creador_username,
           (SELECT COUNT(*) FROM club_miembros cm WHERE cm.club_id = c.id) AS total_miembros,
           (SELECT COUNT(*) FROM club_miembros cm WHERE cm.club_id = c.id AND cm.usuario_id = ?) AS soy_miembro,
           (c.creador_id = ?) AS soy_creador
    FROM clubes_lectura c
    JOIN usuarios u ON c.creador_id = u.id
    WHERE c.id = ? AND c.activo = 1
  `, [usuarioId, usuarioId, clubId])
}

export async function crearClub(data: {
  nombre: string
  descripcion: string
  libro_titulo: string
  libro_autor: string
  libro_portada: string
  creador_id: number
  max_miembros: number
  privado: boolean
}): Promise<number> {
  const res = await execute(`
    INSERT INTO clubes_lectura (nombre, descripcion, libro_titulo, libro_autor, libro_portada, creador_id, max_miembros, privado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [data.nombre, data.descripcion || null, data.libro_titulo || null,
      data.libro_autor || null, data.libro_portada || null,
      data.creador_id, data.max_miembros, data.privado ? 1 : 0])

  const clubId = res.insertId!
  // El creador se une automáticamente como 'creador'
  await execute(
    'INSERT INTO club_miembros (club_id, usuario_id, rol) VALUES (?, ?, ?)',
    [clubId, data.creador_id, 'creador']
  )
  return clubId
}

export async function unirseAlClub(clubId: number, usuarioId: number): Promise<{ ok: boolean; error?: string }> {
  const club = await queryOne<{ max_miembros: number; total: number }>(`
    SELECT c.max_miembros,
           (SELECT COUNT(*) FROM club_miembros WHERE club_id = c.id) AS total
    FROM clubes_lectura c WHERE c.id = ? AND c.activo = 1
  `, [clubId])

  if (!club) return { ok: false, error: 'Club no encontrado' }
  if (club.total >= club.max_miembros) return { ok: false, error: 'El club está completo' }

  const res = await execute(
    'INSERT IGNORE INTO club_miembros (club_id, usuario_id, rol) VALUES (?, ?, ?)',
    [clubId, usuarioId, 'miembro']
  )
  return { ok: res.affectedRows > 0 }
}

export async function salirDelClub(clubId: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    'DELETE FROM club_miembros WHERE club_id=? AND usuario_id=? AND rol=?',
    [clubId, usuarioId, 'miembro']
  )
  return res.affectedRows > 0
}

export async function obtenerMiembros(clubId: number): Promise<ClubMiembro[]> {
  return query<ClubMiembro>(`
    SELECT cm.usuario_id, cm.rol, cm.fecha_union,
           u.username, u.nombre, u.avatar_url
    FROM club_miembros cm
    JOIN usuarios u ON cm.usuario_id = u.id
    WHERE cm.club_id = ?
    ORDER BY cm.rol DESC, cm.fecha_union ASC
  `, [clubId])
}

export async function obtenerPosts(clubId: number): Promise<ClubPost[]> {
  return query<ClubPost>(`
    SELECT p.*, u.username, u.nombre, u.avatar_url
    FROM club_posts p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.club_id = ?
    ORDER BY p.capitulo ASC, p.fecha_creacion ASC
  `, [clubId])
}

export async function publicarPost(data: {
  club_id: number
  usuario_id: number
  capitulo: string
  contenido: string
}): Promise<boolean> {
  const res = await execute(
    'INSERT INTO club_posts (club_id, usuario_id, capitulo, contenido) VALUES (?, ?, ?, ?)',
    [data.club_id, data.usuario_id, data.capitulo || 'General', data.contenido]
  )
  return res.affectedRows > 0
}

export async function esMiembro(clubId: number, usuarioId: number): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    'SELECT COUNT(*) AS n FROM club_miembros WHERE club_id=? AND usuario_id=?',
    [clubId, usuarioId]
  )
  return (row?.n ?? 0) > 0
}
