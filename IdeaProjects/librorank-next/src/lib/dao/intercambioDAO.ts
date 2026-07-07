import { query, queryOne, execute, transaction } from '@/lib/db'

export interface Intercambio {
  id: number
  solicitante_id: number
  solicitante_nombre: string
  solicitante_avatar_url: string | null
  receptor_id: number | null
  receptor_nombre: string | null
  carta_ofrecida: string
  carta_pedida: string
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado'
  aceptado_por_id: number | null
  aceptado_por_nombre: string | null
  created_at: string
}

const BASE_SELECT = `
  SELECT
    i.id, i.solicitante_id, i.receptor_id, i.carta_ofrecida, i.carta_pedida,
    i.estado, i.aceptado_por_id, i.created_at,
    us.nombre AS solicitante_nombre, us.avatar_url AS solicitante_avatar_url,
    ur.nombre AS receptor_nombre,
    ua.nombre AS aceptado_por_nombre
  FROM intercambios i
  JOIN usuarios us ON us.id = i.solicitante_id
  LEFT JOIN usuarios ur ON ur.id = i.receptor_id
  LEFT JOIN usuarios ua ON ua.id = i.aceptado_por_id
`

// Marketplace: todas las ofertas abiertas (incluyendo las propias para que el usuario las vea)
export async function listarMercado(usuarioId: number): Promise<Intercambio[]> {
  return query<Intercambio>(
    `${BASE_SELECT}
     WHERE i.estado = 'pendiente' AND i.receptor_id IS NULL
     ORDER BY i.created_at DESC`,
    [usuarioId]
  )
}

// Mis ofertas activas (pendientes, creadas por mí)
export async function listarMisOfertas(usuarioId: number): Promise<Intercambio[]> {
  return query<Intercambio>(
    `${BASE_SELECT}
     WHERE i.solicitante_id = ? AND i.estado = 'pendiente'
     ORDER BY i.created_at DESC`,
    [usuarioId]
  )
}

// Ofertas directas recibidas (para mí, pendientes)
export async function listarOfertasRecibidas(usuarioId: number): Promise<Intercambio[]> {
  return query<Intercambio>(
    `${BASE_SELECT}
     WHERE i.receptor_id = ? AND i.estado = 'pendiente'
     ORDER BY i.created_at DESC`,
    [usuarioId]
  )
}

// Historial (aceptados/rechazados/cancelados que me involucran)
export async function listarHistorial(usuarioId: number): Promise<Intercambio[]> {
  return query<Intercambio>(
    `${BASE_SELECT}
     WHERE (i.solicitante_id = ? OR i.receptor_id = ? OR i.aceptado_por_id = ?)
       AND i.estado != 'pendiente'
     ORDER BY i.created_at DESC
     LIMIT 30`,
    [usuarioId, usuarioId, usuarioId]
  )
}

export async function obtenerPorId(id: number): Promise<Intercambio | null> {
  return queryOne<Intercambio>(`${BASE_SELECT} WHERE i.id = ?`, [id])
}

export async function crear(
  solicitanteId: number,
  cartaOfrecida: string,
  cartaPedida: string,
  receptorId: number | null
): Promise<number> {
  const res = await execute(
    'INSERT INTO intercambios (solicitante_id, carta_ofrecida, carta_pedida, receptor_id) VALUES (?, ?, ?, ?)',
    [solicitanteId, cartaOfrecida, cartaPedida, receptorId]
  )
  return res.insertId
}

export async function cancelar(id: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    "UPDATE intercambios SET estado = 'cancelado' WHERE id = ? AND solicitante_id = ? AND estado = 'pendiente'",
    [id, usuarioId]
  )
  return res.affectedRows > 0
}

export async function rechazar(id: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    "UPDATE intercambios SET estado = 'rechazado' WHERE id = ? AND receptor_id = ? AND estado = 'pendiente'",
    [id, usuarioId]
  )
  return res.affectedRows > 0
}

// Aceptar: operación atómica — intercambia las cartas y marca como aceptado
export async function aceptar(id: number, aceptadorId: number): Promise<{ ok: boolean; error?: string }> {
  return transaction(async conn => {
    // Bloquear la fila del intercambio
    const [rows] = await conn.query(
      'SELECT * FROM intercambios WHERE id = ? AND estado = "pendiente" FOR UPDATE',
      [id]
    ) as [any[], any]
    const intercambio = rows[0]
    if (!intercambio) return { ok: false, error: 'El intercambio ya no está disponible' }

    const { solicitante_id, carta_ofrecida, carta_pedida, receptor_id } = intercambio

    // No podés aceptar tu propia oferta
    if (aceptadorId === solicitante_id) return { ok: false, error: 'No podés aceptar tu propia oferta' }

    // Si es oferta directa, verificar que el aceptador sea el receptor
    if (receptor_id !== null && receptor_id !== aceptadorId) {
      return { ok: false, error: 'Esta oferta es para otro usuario' }
    }

    // Verificar que el solicitante aún tiene carta_ofrecida
    const [tieneOfrecida] = await conn.query(
      'SELECT 1 FROM cartas_usuario WHERE usuario_id = ? AND carta_id = ?',
      [solicitante_id, carta_ofrecida]
    ) as [any[], any]
    if (!tieneOfrecida.length) return { ok: false, error: 'El solicitante ya no tiene la carta ofrecida' }

    // Verificar que el aceptador tiene carta_pedida
    const [tienePedida] = await conn.query(
      'SELECT 1 FROM cartas_usuario WHERE usuario_id = ? AND carta_id = ?',
      [aceptadorId, carta_pedida]
    ) as [any[], any]
    if (!tienePedida.length) return { ok: false, error: 'No tenés la carta pedida' }

    // Ejecutar el intercambio
    // Solicitante: pierde carta_ofrecida, gana carta_pedida
    await conn.execute('DELETE FROM cartas_usuario WHERE usuario_id = ? AND carta_id = ?', [solicitante_id, carta_ofrecida])
    await conn.execute('INSERT IGNORE INTO cartas_usuario (usuario_id, carta_id) VALUES (?, ?)', [solicitante_id, carta_pedida])

    // Aceptador: pierde carta_pedida, gana carta_ofrecida
    await conn.execute('DELETE FROM cartas_usuario WHERE usuario_id = ? AND carta_id = ?', [aceptadorId, carta_pedida])
    await conn.execute('INSERT IGNORE INTO cartas_usuario (usuario_id, carta_id) VALUES (?, ?)', [aceptadorId, carta_ofrecida])

    // Marcar intercambio como aceptado
    await conn.execute(
      "UPDATE intercambios SET estado = 'aceptado', aceptado_por_id = ? WHERE id = ?",
      [aceptadorId, id]
    )

    // Cancelar todas las ofertas pendientes que involucren alguna de las dos cartas intercambiadas
    await conn.execute(
      `UPDATE intercambios SET estado = 'cancelado'
       WHERE id != ? AND estado = 'pendiente'
       AND ((solicitante_id = ? AND carta_ofrecida = ?) OR (receptor_id = ? AND carta_pedida = ?))`,
      [id, solicitante_id, carta_ofrecida, aceptadorId, carta_pedida]
    )

    return { ok: true }
  })
}

// Verificar si un usuario ya tiene una oferta pendiente con esa carta
export async function tieneOfertaConCarta(usuarioId: number, cartaId: string): Promise<boolean> {
  const row = await queryOne<{ c: number }>(
    "SELECT COUNT(*) AS c FROM intercambios WHERE solicitante_id = ? AND carta_ofrecida = ? AND estado = 'pendiente'",
    [usuarioId, cartaId]
  )
  return (row?.c ?? 0) > 0
}
