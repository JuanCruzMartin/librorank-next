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

export async function obtenerBingo(usuarioId: number): Promise<BingoCasilla[]> {
  // Asegurar que la columna nota exista
  await execute(`ALTER TABLE usuario_bingo ADD COLUMN IF NOT EXISTS nota TEXT NULL DEFAULT NULL`, []).catch(() => {})

  return query<BingoCasilla>(
    `SELECT r.id, r.titulo AS titulo_reto, r.posicion,
            COALESCE(ub.completado, 0) AS completado,
            ub.libro_id, ub.nota,
            lu.titulo  AS libro_titulo,
            lu.autor   AS libro_autor,
            lu.estrellas AS libro_estrellas,
            lu.resena  AS libro_resena,
            lu.portada_url AS libro_portada
     FROM bingo_retos r
     LEFT JOIN usuario_bingo ub ON r.id = ub.reto_id AND ub.usuario_id = ?
     LEFT JOIN libros_usuario lu ON ub.libro_id = lu.id
     ORDER BY r.posicion ASC`,
    [usuarioId]
  )
}

export async function marcarCasilla(usuarioId: number, retoId: number, libroId: number, nota?: string): Promise<boolean> {
  await execute(`ALTER TABLE usuario_bingo ADD COLUMN IF NOT EXISTS nota TEXT NULL DEFAULT NULL`, []).catch(() => {})

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
    // desbloquear logro BINGO_MASTER
    await execute(
      'INSERT IGNORE INTO usuario_logros (usuario_id, logro_id) SELECT ?, id FROM logros WHERE nombre_key=?',
      [usuarioId, 'BINGO_MASTER']
    )
  } else if (lineas > 0) {
    await execute('UPDATE usuarios SET monedas=monedas+30 WHERE id=?', [usuarioId])
  }
}
