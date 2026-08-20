import { query, queryOne, execute, transaction } from '@/lib/db'

export type EstadoDuelo = 'esperando' | 'en_curso' | 'terminado' | 'expirado'

export interface Duelo {
  id: number
  retador_id: number
  rival_id: number | null
  carta_retador: string
  carta_rival: string | null
  pregunta_idx: number | null
  estado: EstadoDuelo
  ganador_id: number | null
  respuesta_retador: number | null
  tiempo_retador: number | null
  respuesta_rival: number | null
  tiempo_rival: number | null
  created_at: string
  expires_at: string
  // joins
  retador_username: string
  retador_nombre: string
  retador_avatar: string | null
  rival_username: string | null
  rival_nombre: string | null
  rival_avatar: string | null
}

export async function crearTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS duelos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      retador_id INT NOT NULL,
      rival_id INT,
      carta_retador VARCHAR(100) NOT NULL,
      carta_rival VARCHAR(100),
      pregunta_idx INT,
      estado ENUM('esperando','en_curso','terminado','expirado') NOT NULL DEFAULT 'esperando',
      ganador_id INT,
      respuesta_retador TINYINT,
      tiempo_retador BIGINT,
      respuesta_rival TINYINT,
      tiempo_rival BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      KEY idx_estado (estado),
      KEY idx_retador (retador_id),
      KEY idx_rival (rival_id)
    )
  `, [])
}

export async function crearDesafio(retadorId: number, cartaId: string): Promise<number> {
  // Expira en 30 minutos si nadie se une
  const res = await execute(
    `INSERT INTO duelos (retador_id, carta_retador, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
    [retadorId, cartaId]
  )
  return res.insertId
}

export async function obtenerSala(): Promise<Duelo[]> {
  // Duelos esperando rival, no expirados
  return query<Duelo>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      NULL AS rival_username, NULL AS rival_nombre, NULL AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    WHERE d.estado = 'esperando' AND d.expires_at > NOW()
    ORDER BY d.created_at DESC
    LIMIT 20
  `, [])
}

export async function obtenerDueloActivo(usuarioId: number): Promise<Duelo | null> {
  return queryOne<Duelo>(`
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
}

export async function obtenerDueloPorId(id: number): Promise<Duelo | null> {
  return queryOne<Duelo>(`
    SELECT d.*,
      ur.username AS retador_username, ur.nombre AS retador_nombre, ur.avatar_url AS retador_avatar,
      uv.username AS rival_username, uv.nombre AS rival_nombre, uv.avatar_url AS rival_avatar
    FROM duelos d
    JOIN usuarios ur ON ur.id = d.retador_id
    LEFT JOIN usuarios uv ON uv.id = d.rival_id
    WHERE d.id = ?
  `, [id])
}

export async function unirseAlDuelo(dueloId: number, rivalId: number, cartaRival: string, preguntaIdx: number): Promise<boolean> {
  const res = await execute(
    `UPDATE duelos SET rival_id=?, carta_rival=?, pregunta_idx=?, estado='en_curso',
       expires_at=DATE_ADD(NOW(), INTERVAL 5 MINUTE)
     WHERE id=? AND estado='esperando' AND retador_id != ?`,
    [rivalId, cartaRival, preguntaIdx, dueloId, rivalId]
  )
  return res.affectedRows > 0
}

export async function responder(dueloId: number, usuarioId: number, respuesta: number): Promise<{ ok: boolean; dueloTerminado: boolean }> {
  const duelo = await obtenerDueloPorId(dueloId)
  if (!duelo || duelo.estado !== 'en_curso') return { ok: false, dueloTerminado: false }

  const ahora = Date.now()
  const esRetador = duelo.retador_id === usuarioId
  const esRival = duelo.rival_id === usuarioId

  if (!esRetador && !esRival) return { ok: false, dueloTerminado: false }
  if (esRetador && duelo.respuesta_retador !== null) return { ok: false, dueloTerminado: false }
  if (esRival && duelo.respuesta_rival !== null) return { ok: false, dueloTerminado: false }

  if (esRetador) {
    await execute('UPDATE duelos SET respuesta_retador=?, tiempo_retador=? WHERE id=?', [respuesta, ahora, dueloId])
  } else {
    await execute('UPDATE duelos SET respuesta_rival=?, tiempo_rival=? WHERE id=?', [respuesta, ahora, dueloId])
  }

  // Verificar si los dos respondieron
  const actualizado = await obtenerDueloPorId(dueloId)
  if (actualizado && actualizado.respuesta_retador !== null && actualizado.respuesta_rival !== null) {
    await resolverDuelo(dueloId, actualizado)
    return { ok: true, dueloTerminado: true }
  }

  return { ok: true, dueloTerminado: false }
}

async function resolverDuelo(dueloId: number, duelo: Duelo): Promise<void> {
  const { PREGUNTAS } = await import('@/lib/preguntas-literarias')
  const pregunta = PREGUNTAS[duelo.pregunta_idx!]
  const correcta = pregunta.respuesta

  const retadorOk = duelo.respuesta_retador === correcta
  const rivalOk = duelo.respuesta_rival === correcta

  let ganadorId: number | null = null
  let perdedorId: number | null = null
  let cartaGanada: string | null = null
  let cartaPerdida: string | null = null

  if (retadorOk && rivalOk) {
    // Los dos aciertan → gana el más rápido
    if ((duelo.tiempo_retador ?? Infinity) < (duelo.tiempo_rival ?? Infinity)) {
      ganadorId = duelo.retador_id
      perdedorId = duelo.rival_id!
      cartaGanada = duelo.carta_rival!
      cartaPerdida = duelo.carta_retador
    } else {
      ganadorId = duelo.rival_id!
      perdedorId = duelo.retador_id
      cartaGanada = duelo.carta_retador
      cartaPerdida = duelo.carta_rival!
    }
  } else if (retadorOk) {
    ganadorId = duelo.retador_id
    perdedorId = duelo.rival_id!
    cartaGanada = duelo.carta_rival!
    cartaPerdida = duelo.carta_retador
  } else if (rivalOk) {
    ganadorId = duelo.rival_id!
    perdedorId = duelo.retador_id
    cartaGanada = duelo.carta_retador
    cartaPerdida = duelo.carta_rival!
  }
  // Si los dos fallan: ganadorId = null, cartas vuelven

  await execute(
    `UPDATE duelos SET estado='terminado', ganador_id=? WHERE id=?`,
    [ganadorId, dueloId]
  )

  // Transferir carta: ganador se queda con la carta del perdedor
  if (ganadorId && perdedorId && cartaGanada && cartaPerdida) {
    await transaction(async conn => {
      // Sacar carta del perdedor
      await conn.execute(
        'DELETE FROM cartas_usuario WHERE usuario_id=? AND carta_id=?',
        [perdedorId, cartaGanada]
      )
      // Dar carta al ganador (INSERT IGNORE por si ya la tiene)
      await conn.execute(
        'INSERT IGNORE INTO cartas_usuario (usuario_id, carta_id) VALUES (?, ?)',
        [ganadorId, cartaGanada]
      )
    })
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
  return query<Duelo>(`
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
}

export async function expirarDuelos(): Promise<void> {
  await execute(
    `UPDATE duelos SET estado='expirado' WHERE estado IN ('esperando','en_curso') AND expires_at < NOW()`,
    []
  )
}
