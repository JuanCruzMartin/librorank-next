import { query, queryOne, execute } from '@/lib/db'

export interface Cita {
  id?: number
  usuario_id: number
  libro_id: number
  texto: string
  pagina?: string
  titulo_libro?: string
}

export async function guardar(c: Cita): Promise<boolean> {
  const res = await execute(
    'INSERT INTO citas (usuario_id, libro_id, texto, pagina) VALUES (?, ?, ?, ?)',
    [c.usuario_id, c.libro_id, c.texto, c.pagina ?? null]
  )
  return res.affectedRows > 0
}

export async function obtenerPorLibro(libroId: number, usuarioId: number): Promise<Cita[]> {
  return query<Cita>(
    'SELECT * FROM citas WHERE libro_id=? AND usuario_id=? ORDER BY id DESC',
    [libroId, usuarioId]
  )
}

export async function obtenerCitaAleatoria(usuarioId: number): Promise<Cita | null> {
  return queryOne<Cita>(
    `SELECT c.*, l.titulo AS titulo_libro
     FROM citas c JOIN libros_usuario l ON c.libro_id=l.id
     WHERE c.usuario_id=? ORDER BY RAND() LIMIT 1`,
    [usuarioId]
  )
}
