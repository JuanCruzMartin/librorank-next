import { query, queryOne, execute, getConnection } from '@/lib/db'

export interface FragmentoHistoria {
  id: number
  historia_id: number
  usuario_id: number
  username: string
  contenido: string
  numero_hoja: number
}

export async function obtenerHistoriaCompleta(historiaId: number): Promise<FragmentoHistoria[]> {
  return query<FragmentoHistoria>(
    `SELECT f.*, u.username FROM fragmentos_historia f
     JOIN usuarios u ON f.usuario_id=u.id
     WHERE f.historia_id=? ORDER BY f.numero_hoja ASC`,
    [historiaId]
  )
}

export async function haEscritoYa(historiaId: number, usuarioId: number): Promise<boolean> {
  const row = await queryOne(
    'SELECT 1 FROM fragmentos_historia WHERE historia_id=? AND usuario_id=?',
    [historiaId, usuarioId]
  )
  return row !== null
}

export async function guardarHoja(historiaId: number, usuarioId: number, contenido: string): Promise<boolean> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.query(
      'SELECT MAX(numero_hoja) as max_hoja FROM fragmentos_historia WHERE historia_id=?',
      [historiaId]
    )
    const siguiente = (((rows as { max_hoja: number }[])[0])?.max_hoja ?? 0) + 1

    const [res] = await conn.query(
      'INSERT INTO fragmentos_historia (historia_id, usuario_id, contenido, numero_hoja) VALUES (?, ?, ?, ?)',
      [historiaId, usuarioId, contenido, siguiente]
    )
    return (res as { affectedRows: number }).affectedRows > 0
  } finally {
    await conn.end()
  }
}

export async function obtenerOIdUnicaHistoria(): Promise<number> {
  const row = await queryOne<{ id: number }>('SELECT id FROM historias_comunitarias LIMIT 1')
  if (row) return row.id

  const res = await execute(
    "INSERT INTO historias_comunitarias (titulo) VALUES ('La Gran Crónica de LibroRank')"
  )
  return res.insertId || 1
}
