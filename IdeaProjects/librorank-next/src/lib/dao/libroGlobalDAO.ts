import { query, queryOne, execute } from '@/lib/db'

export interface LibroGlobal {
  id: number
  titulo: string
  autor: string
  portada_url: string | null
  anio: number | null
  paginas: number | null
  nota_media: number
  total_lectores: number
}

export interface ReviewGlobal {
  resena: string
  estrellas: number
  username: string
}

export async function obtenerOCrear(libro: {
  titulo: string; autor: string; portada_url?: string | null; anio?: number | null; paginas?: number | null
}): Promise<number> {
  const existing = await queryOne<{ id: number }>(
    'SELECT id FROM libros_global WHERE LOWER(titulo)=LOWER(?) AND LOWER(autor)=LOWER(?)',
    [libro.titulo, libro.autor]
  )
  if (existing) return existing.id

  const res = await execute(
    'INSERT INTO libros_global (titulo, autor, portada_url, anio, paginas) VALUES (?, ?, ?, ?, ?)',
    [libro.titulo, libro.autor, libro.portada_url ?? null, libro.anio ?? null, libro.paginas ?? null]
  )
  return res.insertId
}

export async function buscarPorId(id: number): Promise<LibroGlobal | null> {
  return queryOne<LibroGlobal>(
    `SELECT lg.*,
            (SELECT AVG(estrellas) FROM libros_usuario WHERE libro_global_id=lg.id AND estrellas>0) as nota_media,
            (SELECT COUNT(*) FROM libros_usuario WHERE libro_global_id=lg.id) as total_lectores
     FROM libros_global lg WHERE lg.id=?`,
    [id]
  )
}

export async function obtenerReviews(libroGlobalId: number): Promise<ReviewGlobal[]> {
  return query<ReviewGlobal>(
    `SELECT lu.resena, lu.estrellas, u.username
     FROM libros_usuario lu JOIN usuarios u ON lu.usuario_id=u.id
     WHERE lu.libro_global_id=? AND lu.resena IS NOT NULL AND lu.resena!=''
     ORDER BY lu.id DESC`,
    [libroGlobalId]
  )
}
