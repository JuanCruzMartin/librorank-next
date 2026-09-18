import { query, queryOne, execute } from '@/lib/db'

export interface LibroGlobal {
  id: number
  titulo: string
  autor: string
  portada_url: string | null
  anio: number | null
  paginas: number | null
  isbn: string | null
  nota_media: number
  total_lectores: number
}

export interface ReviewGlobal {
  resena: string
  estrellas: number
  username: string
}

export async function obtenerOCrear(libro: {
  titulo: string; autor: string; portada_url?: string | null; anio?: number | null; paginas?: number | null; isbn?: string | null
}): Promise<number> {
  const existing = await queryOne<{ id: number; isbn: string | null }>(
    'SELECT id, isbn FROM libros_global WHERE LOWER(titulo)=LOWER(?) AND LOWER(autor)=LOWER(?)',
    [libro.titulo, libro.autor]
  )
  if (existing) {
    // Si ahora tenemos ISBN y antes no estaba guardado, lo actualizamos
    if (libro.isbn && !existing.isbn) {
      await execute('UPDATE libros_global SET isbn=? WHERE id=?', [libro.isbn, existing.id])
    }
    return existing.id
  }

  const res = await execute(
    'INSERT INTO libros_global (titulo, autor, portada_url, anio, paginas, isbn) VALUES (?, ?, ?, ?, ?, ?)',
    [libro.titulo, libro.autor, libro.portada_url ?? null, libro.anio ?? null, libro.paginas ?? null, libro.isbn ?? null]
  )
  return res.insertId
}

export async function buscarPorIsbn(isbn: string): Promise<(LibroGlobal & { nota_media: number; total_lectores: number }) | null> {
  return queryOne<LibroGlobal & { nota_media: number; total_lectores: number }>(
    `SELECT lg.*,
            COALESCE(AVG(NULLIF(lu.estrellas, 0)), 0) AS nota_media,
            COUNT(lu.id) AS total_lectores
     FROM libros_global lg
     LEFT JOIN libros_usuario lu ON lu.libro_global_id = lg.id
     WHERE lg.isbn = ?
     GROUP BY lg.id`,
    [isbn]
  )
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

export interface LectorGlobal {
  username: string
  avatar_url: string | null
  estado: string
  estrellas: number
}

export interface DistribucionEstrellas {
  estrellas: number
  cantidad: number
}

export async function obtenerLectores(libroGlobalId: number, limite = 20): Promise<LectorGlobal[]> {
  return query<LectorGlobal>(
    `SELECT u.username, u.avatar_url, lu.estado, lu.estrellas
     FROM libros_usuario lu JOIN usuarios u ON lu.usuario_id=u.id
     WHERE lu.libro_global_id=?
     ORDER BY lu.estrellas DESC, lu.id DESC
     LIMIT ?`,
    [libroGlobalId, limite]
  )
}

export async function obtenerTodosParaSitemap(): Promise<{ id: number; updated_at?: string }[]> {
  return query<{ id: number; updated_at?: string }>(
    `SELECT id FROM libros_global ORDER BY id DESC LIMIT 5000`
  )
}

export async function obtenerMasLeidos(limite = 12): Promise<LibroGlobal[]> {
  return query<LibroGlobal>(
    `SELECT lg.*,
            (SELECT AVG(estrellas) FROM libros_usuario WHERE libro_global_id=lg.id AND estrellas>0) as nota_media,
            (SELECT COUNT(*) FROM libros_usuario WHERE libro_global_id=lg.id) as total_lectores
     FROM libros_global lg
     WHERE lg.portada_url IS NOT NULL
     HAVING total_lectores > 0
     ORDER BY total_lectores DESC, nota_media DESC
     LIMIT ?`,
    [limite]
  )
}

export async function obtenerDistribucionEstrellas(libroGlobalId: number): Promise<DistribucionEstrellas[]> {
  return query<DistribucionEstrellas>(
    `SELECT estrellas, COUNT(*) AS cantidad
     FROM libros_usuario
     WHERE libro_global_id=? AND estrellas > 0
     GROUP BY estrellas
     ORDER BY estrellas DESC`,
    [libroGlobalId]
  )
}
