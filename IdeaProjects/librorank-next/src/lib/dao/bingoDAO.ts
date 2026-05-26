import { query, execute } from '@/lib/db'

export interface BingoCasilla {
  id: number
  usuario_id?: number
  titulo_reto: string
  posicion: number
  completado: boolean
  libro_id: number | null
  nota: string | null
  // datos del libro asociado
  libro_titulo: string | null
  libro_autor: string | null
  libro_estrellas: number | null
  libro_resena: string | null
  libro_portada: string | null
}

// Agrega la columna nota si no existe (sin IF NOT EXISTS para mayor compatibilidad)
async function asegurarColumnaNota(): Promise<void> {
  try {
    await execute(`ALTER TABLE usuario_bingo ADD COLUMN nota TEXT NULL DEFAULT NULL`, [])
  } catch {
    // Si falla es porque la columna ya existe — ignorar
  }
}

const QUERY_BINGO_CON_NOTA = `
  SELECT r.id, r.titulo AS titulo_reto, r.posicion,
         COALESCE(ub.completado, 0) AS completado,
         ub.libro_id, ub.nota,
         lu.titulo      AS libro_titulo,
         lu.autor       AS libro_autor,
         lu.estrellas   AS libro_estrellas,
         lu.resena      AS libro_resena,
         lu.portada_url AS libro_portada
  FROM bingo_retos r
  LEFT JOIN usuario_bingo ub ON r.id = ub.reto_id AND ub.usuario_id = ?
  LEFT JOIN libros_usuario lu ON ub.libro_id = lu.id
  ORDER BY r.posicion ASC`

const QUERY_BINGO_SIN_NOTA = `
  SELECT r.id, r.titulo AS titulo_reto, r.posicion,
         COALESCE(ub.completado, 0) AS completado,
         ub.libro_id,
         lu.titulo      AS libro_titulo,
         lu.autor       AS libro_autor,
         lu.estrellas   AS libro_estrellas,
         lu.resena      AS libro_resena,
         lu.portada_url AS libro_portada
  FROM bingo_retos r
  LEFT JOIN usuario_bingo ub ON r.id = ub.reto_id AND ub.usuario_id = ?
  LEFT JOIN libros_usuario lu ON ub.libro_id = lu.id
  ORDER BY r.posicion ASC`

export async function obtenerBingo(usuarioId: number): Promise<BingoCasilla[]> {
  await asegurarColumnaNota()

  try {
    return await query<BingoCasilla>(QUERY_BINGO_CON_NOTA, [usuarioId])
  } catch {
    // Fallback: si por alguna razón la columna sigue sin existir, consultar sin ella
    const rows = await query<Omit<BingoCasilla, 'nota'>>(QUERY_BINGO_SIN_NOTA, [usuarioId])
    return rows.map(r => ({ ...r, nota: null }))
  }
}

export async function marcarCasilla(usuarioId: number, retoId: number, libroId: number, nota?: string): Promise<boolean> {
  await asegurarColumnaNota()

  try {
    const res = await execute(
      `INSERT INTO usuario_bingo (usuario_id, reto_id, libro_id, completado, nota) VALUES (?, ?, ?, true, ?)
       ON DUPLICATE KEY UPDATE libro_id=?, completado=true, nota=?`,
      [usuarioId, retoId, libroId, nota ?? null, libroId, nota ?? null]
    )
    if (res.affectedRows > 0) {
      await execute('UPDATE usuarios SET monedas=monedas+10 WHERE id=?', [usuarioId])
      await verificarLineas(usuarioId)
    }
    return res.affectedRows > 0
  } catch {
    // Si falla el insert con nota, intentar sin nota
    const res = await execute(
      `INSERT INTO usuario_bingo (usuario_id, reto_id, libro_id, completado) VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE libro_id=?, completado=true`,
      [usuarioId, retoId, libroId, libroId]
    )
    if (res.affectedRows > 0) {
      await execute('UPDATE usuarios SET monedas=monedas+10 WHERE id=?', [usuarioId])
      await verificarLineas(usuarioId)
    }
    return res.affectedRows > 0
  }
}

async function verificarLineas(usuarioId: number): Promise<void> {
  const bingo = await obtenerBingo(usuarioId)
  const c: boolean[] = Array(25).fill(false)
  let completadas = 0

  for (const casilla of bingo) {
    if (casilla.completado) {
      c[casilla.posicion] = true
      completadas++
    }
  }

  let lineas = 0
  for (let i = 0; i < 5; i++) {
    if (c[i*5] && c[i*5+1] && c[i*5+2] && c[i*5+3] && c[i*5+4]) lineas++
    if (c[i] && c[i+5] && c[i+10] && c[i+15] && c[i+20]) lineas++
  }
  if (c[0] && c[6] && c[12] && c[18] && c[24]) lineas++
  if (c[4] && c[8] && c[12] && c[16] && c[20]) lineas++

  if (completadas === 25) {
    await execute('UPDATE usuarios SET monedas=monedas+100 WHERE id=?', [usuarioId])
    await execute(
      'INSERT IGNORE INTO usuario_logros (usuario_id, logro_id) SELECT ?, id FROM logros WHERE nombre_key=?',
      [usuarioId, 'BINGO_MASTER']
    )
  } else if (lineas > 0) {
    await execute('UPDATE usuarios SET monedas=monedas+30 WHERE id=?', [usuarioId])
  }
}
