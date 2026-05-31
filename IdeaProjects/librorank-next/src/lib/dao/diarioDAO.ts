import { query, execute } from '@/lib/db'

export interface DiarioLectura {
  id?: number
  libro_id: number
  usuario_id: number
  capitulo: string
  comentario: string
  fecha_creacion?: string
}

export async function guardar(d: DiarioLectura): Promise<number | false> {
  const res = await execute(
    'INSERT INTO diario_lectura (libro_id, usuario_id, capitulo, comentario) VALUES (?, ?, ?, ?)',
    [d.libro_id, d.usuario_id, d.capitulo, d.comentario]
  )
  return res.affectedRows > 0 ? res.insertId : false
}

export async function eliminar(id: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    'DELETE FROM diario_lectura WHERE id=? AND usuario_id=?',
    [id, usuarioId]
  )
  return res.affectedRows > 0
}

export async function obtenerPorLibro(libroId: number, usuarioId: number): Promise<DiarioLectura[]> {
  return query<DiarioLectura>(
    'SELECT * FROM diario_lectura WHERE libro_id=? AND usuario_id=? ORDER BY fecha_creacion DESC',
    [libroId, usuarioId]
  )
}
