import { query, execute } from '@/lib/db'

export interface BingoCasilla {
  id: number
  usuario_id?: number
  titulo_reto: string
  posicion: number
  completado: boolean
  libro_id: number | null
}

export async function obtenerBingo(usuarioId: number): Promise<BingoCasilla[]> {
  return query<BingoCasilla>(
    `SELECT r.id, r.titulo as titulo_reto, r.posicion, ub.completado, ub.libro_id
     FROM bingo_retos r
     LEFT JOIN usuario_bingo ub ON r.id=ub.reto_id AND ub.usuario_id=?
     ORDER BY r.posicion ASC`,
    [usuarioId]
  )
}

export async function marcarCasilla(usuarioId: number, retoId: number, libroId: number): Promise<boolean> {
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
