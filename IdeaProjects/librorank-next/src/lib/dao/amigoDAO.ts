import { query, queryOne, execute } from '@/lib/db'
import type { Usuario } from './usuarioDAO'

export async function agregarAmigo(usuarioId: number, amigoId: number): Promise<boolean> {
  if (usuarioId === amigoId) return false
  const res = await execute('INSERT IGNORE INTO amigos (usuario_id, amigo_id) VALUES (?, ?)', [usuarioId, amigoId])
  return res.affectedRows > 0
}

export async function eliminarAmigo(usuarioId: number, amigoId: number): Promise<boolean> {
  const res = await execute('DELETE FROM amigos WHERE usuario_id=? AND amigo_id=?', [usuarioId, amigoId])
  return res.affectedRows > 0
}

export async function obtenerIdsAmigos(usuarioId: number): Promise<number[]> {
  const rows = await query<{ amigo_id: number }>('SELECT amigo_id FROM amigos WHERE usuario_id=?', [usuarioId])
  return rows.map(r => r.amigo_id)
}

export async function obtenerAmigos(usuarioId: number): Promise<(Usuario & { libros_en_comun: number; titulos_en_comun: string })[]> {
  const amigos = await query<Usuario>(
    `SELECT u.id, u.nombre, u.username, u.avatar_url
     FROM usuarios u JOIN amigos a ON u.id=a.amigo_id WHERE a.usuario_id=?`,
    [usuarioId]
  )
  return Promise.all(amigos.map(async a => ({
    ...a,
    libros_en_comun: await contarLibrosEnComun(usuarioId, a.id),
    titulos_en_comun: await obtenerTitulosEnComun(usuarioId, a.id),
  })))
}

export async function buscarUsuarios(queryStr: string, usuarioActualId: number) {
  const like = `%${queryStr}%`
  return query(
    `SELECT u.id, u.nombre, u.username, u.avatar_url, u.bio,
            (SELECT COUNT(*) FROM libros_usuario lu WHERE lu.usuario_id=u.id AND UPPER(lu.estado) IN ('LEIDO','LEÍDO')) as total_leidos,
            (SELECT GROUP_CONCAT(g ORDER BY cnt DESC SEPARATOR ', ')
             FROM (SELECT genero AS g, COUNT(*) AS cnt FROM libros_usuario
                   WHERE usuario_id=u.id AND UPPER(estado) IN ('LEIDO','LEÍDO')
                     AND genero IS NOT NULL AND genero != ''
                   GROUP BY genero ORDER BY cnt DESC LIMIT 3) top) AS generos_favoritos
     FROM usuarios u WHERE (u.username LIKE ? OR u.email LIKE ?) AND u.id<>? LIMIT 10`,
    [like, like, usuarioActualId]
  )
}

export async function obtenerSugerencias(usuarioId: number) {
  const todos = await query(
    `SELECT DISTINCT u.id, u.nombre, u.username, u.avatar_url, u.bio,
            (SELECT COUNT(*) FROM libros_usuario lu WHERE lu.usuario_id=u.id AND UPPER(lu.estado) IN ('LEIDO','LEÍDO')) as total_leidos,
            (SELECT GROUP_CONCAT(g ORDER BY cnt DESC SEPARATOR ', ')
             FROM (SELECT genero AS g, COUNT(*) AS cnt FROM libros_usuario
                   WHERE usuario_id=u.id AND UPPER(estado) IN ('LEIDO','LEÍDO')
                     AND genero IS NOT NULL AND genero != ''
                   GROUP BY genero ORDER BY cnt DESC LIMIT 3) top) AS generos_favoritos
     FROM usuarios u
     WHERE u.id<>? AND u.id NOT IN (SELECT amigo_id FROM amigos WHERE usuario_id=?)
     LIMIT 20`,
    [usuarioId, usuarioId]
  ) as Array<Usuario & { total_leidos: number }>

  const conComun = await Promise.all(
    todos.map(async u => ({
      ...u,
      libros_en_comun: await contarLibrosEnComun(usuarioId, u.id),
      titulos_en_comun: await obtenerTitulosEnComun(usuarioId, u.id),
    }))
  )
  return conComun.filter(u => u.libros_en_comun > 0).slice(0, 5)
}

export async function obtenerTodosLectores(usuarioId: number) {
  return query<{
    id: number; nombre: string; username: string; avatar_url: string | null
    bio: string | null; generos_favoritos: string | null; total_leidos: number
    es_seguido: number
  }>(
    `SELECT u.id, u.nombre, u.username, u.avatar_url, u.bio,
            COUNT(l.id) AS total_leidos,
            EXISTS(SELECT 1 FROM amigos a WHERE a.usuario_id=? AND a.amigo_id=u.id) AS es_seguido,
            (SELECT GROUP_CONCAT(g ORDER BY cnt DESC SEPARATOR ', ')
             FROM (SELECT genero AS g, COUNT(*) AS cnt FROM libros_usuario
                   WHERE usuario_id=u.id AND UPPER(estado) IN ('LEIDO','LEÍDO')
                     AND genero IS NOT NULL AND genero != ''
                   GROUP BY genero ORDER BY cnt DESC LIMIT 3) top) AS generos_favoritos
     FROM usuarios u
     LEFT JOIN libros_usuario l ON l.usuario_id=u.id AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
     WHERE u.id <> ?
     GROUP BY u.id, u.nombre, u.username, u.avatar_url, u.bio
     ORDER BY total_leidos DESC, u.nombre ASC
     LIMIT 100`,
    [usuarioId, usuarioId]
  )
}

export async function esSonAmigos(id1: number, id2: number): Promise<boolean> {
  const row = await queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM amigos WHERE usuario_id=? AND amigo_id=?', [id1, id2]
  )
  return (row?.cnt ?? 0) > 0
}

async function contarLibrosEnComun(id1: number, id2: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM libros_usuario l1
     JOIN libros_usuario l2 ON TRIM(LOWER(l1.titulo))=TRIM(LOWER(l2.titulo)) AND TRIM(LOWER(l1.autor))=TRIM(LOWER(l2.autor))
     WHERE l1.usuario_id=? AND l2.usuario_id=?
       AND UPPER(l1.estado) IN ('LEIDO','LEÍDO') AND UPPER(l2.estado) IN ('LEIDO','LEÍDO')`,
    [id1, id2]
  )
  return row?.total ?? 0
}

async function obtenerTitulosEnComun(id1: number, id2: number): Promise<string> {
  const rows = await query<{ titulo: string }>(
    `SELECT l1.titulo
     FROM libros_usuario l1
     JOIN libros_usuario l2 ON TRIM(LOWER(l1.titulo))=TRIM(LOWER(l2.titulo)) AND TRIM(LOWER(l1.autor))=TRIM(LOWER(l2.autor))
     WHERE l1.usuario_id=? AND l2.usuario_id=?
       AND UPPER(l1.estado) IN ('LEIDO','LEÍDO') AND UPPER(l2.estado) IN ('LEIDO','LEÍDO')
     LIMIT 5`,
    [id1, id2]
  )
  return rows.map(r => r.titulo).join(', ')
}
