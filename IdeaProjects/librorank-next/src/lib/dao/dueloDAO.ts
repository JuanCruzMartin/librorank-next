import { query, queryOne, execute, transaction } from '@/lib/db'

export type EstadoDuelo = 'esperando' | 'en_curso' | 'terminado' | 'expirado'
export type TipoDuelo = 'estandar' | 'apuesta'

export interface Duelo {
  id: number
  retador_id: number
  rival_id: number | null
  carta_retador: string
  carta_rival: string | null
  tipo: TipoDuelo
  preguntas: number[]
  ronda_actual: number
  respuestas_retador: (number | null)[]
  respuestas_rival: (number | null)[]
  tiempos_retador: (number | null)[]
  tiempos_rival: (number | null)[]
  puntos_retador: number
  puntos_rival: number
  estado: EstadoDuelo
  ganador_id: number | null
  created_at: string
  expires_at: string
  retador_username: string
  retador_nombre: string
  retador_avatar: string | null
  rival_username: string | null
  rival_nombre: string | null
  rival_avatar: string | null
}

export interface ResponderResult {
  ok: boolean
  dueloTerminado: boolean
  rondaTerminada?: boolean
  ganadorRonda?: 'retador' | 'rival' | 'empate'
  respuestaCorrecta?: number
  retadorAcerto?: boolean
  rivalAcerto?: boolean
  puntosRetador?: number
  puntosRival?: number
}

function parseJson<T>(v: unknown, def: T): T {
  if (v === null || v === undefined) return def
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return def } }
  return v as T
}

function parseDuelo(raw: Record<string, unknown>): Duelo {
  return {
    ...raw,
    tipo: (raw.tipo as TipoDuelo) ?? 'estandar',
    preguntas: parseJson<number[]>(raw.preguntas, []),
    ronda_actual: Number(raw.ronda_actual ?? 0),
    puntos_retador: Number(raw.puntos_retador ?? 0),
    puntos_rival: Number(raw.puntos_rival ?? 0),
    respuestas_retador: parseJson<(number | null)[]>(raw.respuestas_retador, [null, null, null]),
    respuestas_rival: parseJson<(number | null)[]>(raw.respuestas_rival, [null, null, null]),
    tiempos_retador: parseJson<(number | null)[]>(raw.tiempos_retador, [null, null, null]),
    tiempos_rival: parseJson<(number | null)[]>(raw.tiempos_rival, [null, null, null]),
  } as Duelo
}

export async function crearTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS duelos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      retador_id INT NOT NULL,
      rival_id INT,
      carta_retador VARCHAR(100) NOT NULL,
      carta_rival VARCHAR(100),
      tipo ENUM('estandar','apuesta') NOT NULL DEFAULT 'estandar',
      preguntas JSON,
      ronda_actual TINYINT DEFAULT 0,
      respuestas_retador JSON,
      respuestas_rival JSON,
      tiempos_retador JSON,
      tiempos_rival JSON,
      puntos_retador TINYINT DEFAULT 0,
      puntos_rival TINYINT DEFAULT 0,
      estado ENUM('esperando','en_curso','terminado','expirado') NOT NULL DEFAULT 'esperando',
      ganador_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      KEY idx_estado (estado),
      KEY idx_retador (retador_id),
      KEY idx_rival (rival_id)
    )
  `, [])

  const colsRes = await query<{ COLUMN_NAME: string }>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'duelos'`,
    []
  )
  const cols = new Set(colsRes.map(c => c.COLUMN_NAME))

  const adds: [string, string][] = [
    ['tipo', `ENUM('estandar','apuesta') NOT NULL DEFAULT 'estandar'`],
    ['preguntas', 'JSON'],
    ['ronda_actual', 'TINYINT DEFAULT 0'],
    ['respuestas_retador', 'JSON'],
    ['respuestas_rival', 'JSON'],
    ['tiempos_retador', 'JSON'],
    ['tiempos_rival', 'JSON'],
    ['puntos_retador', 'TINYINT DEFAULT 0'],
    ['puntos_rival', 'TINYINT DEFAULT 0'],
  ]
  for (const [col, type] of adds) {
    if (!cols.has(col)) await execute(`ALTER TABLE duelos ADD COLUMN ${col} ${type}`, [])
  }
}

export async function crearDesafio(retadorId: number, cartaId: string, tipo: TipoDuelo = 'estandar'): Promise<number> {
  const res = await execute(
    `INSERT INTO duelos (retador_id, carta_retador, tipo, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
    [retadorId, cartaId, tipo]
  )
  return res.insertId
}

export async function obtenerSala(): Promise<Duelo[]> {
  const rows = await query<Record<string, unknown>>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      NULL AS rival_username, NULL AS rival_nombre, NULL AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    WHERE d.estado = 'esperando' AND d.expires_at > NOW()
    ORDER BY d.created_at DESC
    LIMIT 20
  `, [])
  return rows.map(parseDuelo)
}

export async function obtenerDueloActivo(usuarioId: number): Promise<Duelo | null> {
  const raw = await queryOne<Record<string, unknown>>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      uv.username AS rival_username, uv.nombre AS rival_nombre, uv.avatar_url AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    LEFT JOIN usuarios uv ON uv.id = d.rival_id
    WHERE (d.retador_id = ? OR d.rival_id = ?)
      AND d.estado IN ('esperando','en_curso')
      AND d.expires_at > NOW()
    ORDER BY d.created_at DESC
    LIMIT 1
  `, [usuarioId, usuarioId])
  return raw ? parseDuelo(raw) : null
}

export async function obtenerDueloPorId(id: number): Promise<Duelo | null> {
  const raw = await queryOne<Record<string, unknown>>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      uv.username AS rival_username, uv.nombre AS rival_nombre, uv.avatar_url AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    LEFT JOIN usuarios uv ON uv.id = d.rival_id
    WHERE d.id = ?
  `, [id])
  return raw ? parseDuelo(raw) : null
}

export async function unirseAlDuelo(dueloId: number, rivalId: number, cartaRival: string): Promise<boolean> {
  const { PREGUNTAS } = await import('@/lib/preguntas-literarias')
  const total = PREGUNTAS.length
  const indices: number[] = []
  while (indices.length < 3) {
    const r = Math.floor(Math.random() * total)
    if (!indices.includes(r)) indices.push(r)
  }
  const vacias = JSON.stringify([null, null, null])
  const res = await execute(
    `UPDATE duelos SET rival_id=?, carta_rival=?, preguntas=?, ronda_actual=1,
       respuestas_retador=?, respuestas_rival=?, tiempos_retador=?, tiempos_rival=?,
       estado='en_curso', expires_at=DATE_ADD(NOW(), INTERVAL 5 MINUTE)
     WHERE id=? AND estado='esperando' AND retador_id != ?`,
    [rivalId, cartaRival, JSON.stringify(indices), vacias, vacias, vacias, vacias, dueloId, rivalId]
  )
  return res.affectedRows > 0
}

export async function responder(dueloId: number, usuarioId: number, respuesta: number): Promise<ResponderResult> {
  const duelo = await obtenerDueloPorId(dueloId)
  if (!duelo || duelo.estado !== 'en_curso' || duelo.preguntas.length === 0) {
    return { ok: false, dueloTerminado: false }
  }

  const ahora = Date.now()
  const esRetador = duelo.retador_id === usuarioId
  const esRival = duelo.rival_id === usuarioId
  if (!esRetador && !esRival) return { ok: false, dueloTerminado: false }

  const idx = duelo.ronda_actual - 1
  if (idx < 0 || idx > 2) return { ok: false, dueloTerminado: false }
  if (esRetador && duelo.respuestas_retador[idx] !== null) return { ok: false, dueloTerminado: false }
  if (esRival && duelo.respuestas_rival[idx] !== null) return { ok: false, dueloTerminado: false }

  if (esRetador) {
    const r = [...duelo.respuestas_retador]; r[idx] = respuesta
    const t = [...duelo.tiempos_retador]; t[idx] = ahora
    await execute('UPDATE duelos SET respuestas_retador=?, tiempos_retador=? WHERE id=?', [JSON.stringify(r), JSON.stringify(t), dueloId])
  } else {
    const r = [...duelo.respuestas_rival]; r[idx] = respuesta
    const t = [...duelo.tiempos_rival]; t[idx] = ahora
    await execute('UPDATE duelos SET respuestas_rival=?, tiempos_rival=? WHERE id=?', [JSON.stringify(r), JSON.stringify(t), dueloId])
  }

  const actualizado = await obtenerDueloPorId(dueloId)
  if (!actualizado) return { ok: true, dueloTerminado: false }

  const retadorRespondio = actualizado.respuestas_retador[idx] !== null
  const rivalRespondio = actualizado.respuestas_rival[idx] !== null
  if (!retadorRespondio || !rivalRespondio) return { ok: true, dueloTerminado: false }

  return resolverRonda(dueloId, actualizado)
}

async function resolverRonda(dueloId: number, duelo: Duelo): Promise<ResponderResult> {
  const { PREGUNTAS } = await import('@/lib/preguntas-literarias')
  const idx = duelo.ronda_actual - 1
  const correcta = PREGUNTAS[duelo.preguntas[idx]].respuesta

  const retadorOk = duelo.respuestas_retador[idx] === correcta
  const rivalOk = duelo.respuestas_rival[idx] === correcta
  let pts_ret = duelo.puntos_retador
  let pts_riv = duelo.puntos_rival
  let ganadorRonda: 'retador' | 'rival' | 'empate' = 'empate'

  if (retadorOk && rivalOk) {
    const tR = duelo.tiempos_retador[idx] ?? Infinity
    const tV = duelo.tiempos_rival[idx] ?? Infinity
    if (tR < tV) { pts_ret++; ganadorRonda = 'retador' }
    else { pts_riv++; ganadorRonda = 'rival' }
  } else if (retadorOk) { pts_ret++; ganadorRonda = 'retador' }
  else if (rivalOk) { pts_riv++; ganadorRonda = 'rival' }

  const matchOver = pts_ret >= 2 || pts_riv >= 2 || duelo.ronda_actual >= 3

  if (matchOver) {
    await execute('UPDATE duelos SET puntos_retador=?, puntos_rival=? WHERE id=?', [pts_ret, pts_riv, dueloId])
    await finalizarDuelo(dueloId, duelo, pts_ret, pts_riv)
    return { ok: true, dueloTerminado: true, rondaTerminada: true, ganadorRonda, respuestaCorrecta: correcta, retadorAcerto: retadorOk, rivalAcerto: rivalOk, puntosRetador: pts_ret, puntosRival: pts_riv }
  }

  await execute(
    `UPDATE duelos SET puntos_retador=?, puntos_rival=?, ronda_actual=?,
     expires_at=DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id=?`,
    [pts_ret, pts_riv, duelo.ronda_actual + 1, dueloId]
  )
  return { ok: true, dueloTerminado: false, rondaTerminada: true, ganadorRonda, respuestaCorrecta: correcta, retadorAcerto: retadorOk, rivalAcerto: rivalOk, puntosRetador: pts_ret, puntosRival: pts_riv }
}

async function finalizarDuelo(dueloId: number, duelo: Duelo, ptsRetador: number, ptsRival: number): Promise<void> {
  let ganadorId: number | null = null
  let perdedorId: number | null = null

  if (ptsRetador > ptsRival) { ganadorId = duelo.retador_id; perdedorId = duelo.rival_id! }
  else if (ptsRival > ptsRetador) { ganadorId = duelo.rival_id!; perdedorId = duelo.retador_id }

  await execute(`UPDATE duelos SET estado='terminado', ganador_id=? WHERE id=?`, [ganadorId, dueloId])

  if (duelo.tipo === 'apuesta' && ganadorId && perdedorId) {
    const cartaGanada = ganadorId === duelo.retador_id ? duelo.carta_rival! : duelo.carta_retador
    await transaction(async conn => {
      await conn.execute('DELETE FROM cartas_usuario WHERE usuario_id=? AND carta_id=?', [perdedorId, cartaGanada])
      await conn.execute('INSERT IGNORE INTO cartas_usuario (usuario_id, carta_id) VALUES (?, ?)', [ganadorId, cartaGanada])
    })
    const { otorgarCofre, crearTabla } = await import('@/lib/dao/cofreDAO')
    await crearTabla()
    await otorgarCofre(ganadorId, 'comun')
  } else if (duelo.tipo === 'estandar' && ganadorId) {
    await execute('UPDATE usuarios SET monedas = monedas + 40 WHERE id = ?', [ganadorId])
  }
}

export async function cancelarDesafio(dueloId: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    `UPDATE duelos SET estado='expirado' WHERE id=? AND retador_id=? AND estado='esperando'`,
    [dueloId, usuarioId]
  )
  return res.affectedRows > 0
}

export async function obtenerHistorial(usuarioId: number, limite = 10): Promise<Duelo[]> {
  const rows = await query<Record<string, unknown>>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      uv.username AS rival_username, uv.nombre AS rival_nombre, uv.avatar_url AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    LEFT JOIN usuarios uv ON uv.id = d.rival_id
    WHERE (d.retador_id=? OR d.rival_id=?) AND d.estado='terminado'
    ORDER BY d.created_at DESC
    LIMIT ?
  `, [usuarioId, usuarioId, limite])
  return rows.map(parseDuelo)
}

export interface StatsGlobales {
  victorias: number
  derrotas: number
  empates: number
}

export interface StatsRival {
  rival_id: number
  rival_nombre: string
  rival_username: string
  victorias: number
  derrotas: number
  empates: number
}

export async function obtenerStatsGlobales(usuarioId: number): Promise<StatsGlobales> {
  const row = await queryOne<{ victorias: number; derrotas: number; empates: number }>(`
    SELECT
      SUM(ganador_id = ?) AS victorias,
      SUM(ganador_id IS NULL) AS empates,
      SUM(ganador_id IS NOT NULL AND ganador_id != ?) AS derrotas
    FROM duelos
    WHERE (retador_id = ? OR rival_id = ?) AND estado = 'terminado'
  `, [usuarioId, usuarioId, usuarioId, usuarioId])
  return { victorias: row?.victorias ?? 0, derrotas: row?.derrotas ?? 0, empates: row?.empates ?? 0 }
}

export async function obtenerStatsPorRival(usuarioId: number): Promise<StatsRival[]> {
  return query<StatsRival>(`
    SELECT
      oponente_id AS rival_id,
      oponente_nombre AS rival_nombre,
      oponente_username AS rival_username,
      SUM(es_victoria) AS victorias,
      SUM(es_empate) AS empates,
      SUM(es_derrota) AS derrotas
    FROM (
      SELECT
        IF(d.retador_id = ?, d.rival_id, d.retador_id) AS oponente_id,
        IF(d.retador_id = ?, uv.nombre, ur.nombre) AS oponente_nombre,
        IF(d.retador_id = ?, uv.username, ur.username) AS oponente_username,
        (d.ganador_id = ?) AS es_victoria,
        (d.ganador_id IS NULL) AS es_empate,
        (d.ganador_id IS NOT NULL AND d.ganador_id != ?) AS es_derrota
      FROM duelos d
      JOIN usuarios ur ON ur.id = d.retador_id
      LEFT JOIN usuarios uv ON uv.id = d.rival_id
      WHERE (d.retador_id = ? OR d.rival_id = ?) AND d.estado = 'terminado'
    ) t
    GROUP BY oponente_id, oponente_nombre, oponente_username
    ORDER BY COUNT(*) DESC
  `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId])
}

export async function expirarDuelos(): Promise<void> {
  await execute(
    `UPDATE duelos SET estado='expirado' WHERE estado IN ('esperando','en_curso') AND expires_at < NOW()`,
    []
  )
}
