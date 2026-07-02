import { query, queryOne, execute } from '@/lib/db'

export async function obtenerColeccion(usuarioId: number): Promise<string[]> {
  const rows = await query<{ carta_id: string }>(
    'SELECT carta_id FROM cartas_usuario WHERE usuario_id = ? ORDER BY obtenida_en DESC',
    [usuarioId]
  )
  return rows.map(r => r.carta_id)
}

export async function agregarCarta(usuarioId: number, cartaId: string): Promise<boolean> {
  const res = await execute(
    'INSERT IGNORE INTO cartas_usuario (usuario_id, carta_id) VALUES (?, ?)',
    [usuarioId, cartaId]
  )
  return res.affectedRows > 0
}

export async function obtenerTiradas(usuarioId: number): Promise<number> {
  const row = await queryOne<{ tiradas_disponibles: number }>(
    'SELECT tiradas_disponibles FROM usuarios WHERE id = ?',
    [usuarioId]
  )
  return row?.tiradas_disponibles ?? 0
}

export async function usarTirada(usuarioId: number): Promise<boolean> {
  const res = await execute(
    'UPDATE usuarios SET tiradas_disponibles = tiradas_disponibles - 1 WHERE id = ? AND tiradas_disponibles > 0',
    [usuarioId]
  )
  return res.affectedRows > 0
}

export async function verificarTiradaDiaria(usuarioId: number): Promise<{ otorgada: boolean; proxima: Date }> {
  const row = await queryOne<{ ultima_tirada_gratis: Date | null }>(
    'SELECT ultima_tirada_gratis FROM usuarios WHERE id = ?',
    [usuarioId]
  )
  const ultima = row?.ultima_tirada_gratis ? new Date(row.ultima_tirada_gratis) : null
  const ahora = new Date()
  const proxima = ultima ? new Date(ultima.getTime() + 24 * 60 * 60 * 1000) : ahora

  if (!ultima || ahora >= proxima) {
    await execute(
      'UPDATE usuarios SET tiradas_disponibles = tiradas_disponibles + 1, ultima_tirada_gratis = NOW() WHERE id = ?',
      [usuarioId]
    )
    return { otorgada: true, proxima: new Date(ahora.getTime() + 24 * 60 * 60 * 1000) }
  }

  return { otorgada: false, proxima }
}
