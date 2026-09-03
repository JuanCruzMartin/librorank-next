import { query, queryOne, execute } from '@/lib/db'
import { getLigaArena, getLigaArenaSiguiente } from '@/lib/ligasArena'

export interface EstadoLigaArena {
  liga: string
  puntos_arena: number
  en_promocion: boolean
  duelos_promocion: number      // cuántos de los 3 se jugaron
  victorias_promocion: number
}

export interface UsuarioLigaArena {
  id: number
  nombre: string
  avatar_url: string | null
  puntos_arena: number
  liga_arena: string
}

const PUNTOS_FALLO_PROMOCION = 75
const PUNTOS_POR_VICTORIA = 10
const PUNTOS_POR_DERROTA = 10
const DUELOS_PROMOCION_TOTAL = 3
const VICTORIAS_PARA_ASCENDER = 2

export async function migrarLigasArena(): Promise<void> {
  const cols = await query<{ COLUMN_NAME: string }>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'`,
    []
  )
  const colSet = new Set(cols.map(c => c.COLUMN_NAME))

  const adds: [string, string][] = [
    ['puntos_arena',        'INT NOT NULL DEFAULT 0'],
    ['liga_arena',          "VARCHAR(20) NOT NULL DEFAULT 'bronce'"],
    ['en_promocion_arena',  'TINYINT(1) NOT NULL DEFAULT 0'],
    ['duelos_promocion',    'TINYINT NOT NULL DEFAULT 0'],
    ['victorias_promocion', 'TINYINT NOT NULL DEFAULT 0'],
  ]
  for (const [col, type] of adds) {
    if (!colSet.has(col)) {
      await execute(`ALTER TABLE usuarios ADD COLUMN ${col} ${type}`, [])
    }
  }
}

export async function obtenerEstadoLiga(usuarioId: number): Promise<EstadoLigaArena> {
  const row = await queryOne<{
    liga_arena: string
    puntos_arena: number
    en_promocion_arena: number
    duelos_promocion: number
    victorias_promocion: number
  }>(
    `SELECT liga_arena, puntos_arena, en_promocion_arena, duelos_promocion, victorias_promocion
     FROM usuarios WHERE id = ?`,
    [usuarioId]
  )
  return {
    liga:               row?.liga_arena         ?? 'bronce',
    puntos_arena:       row?.puntos_arena        ?? 0,
    en_promocion:       !!(row?.en_promocion_arena),
    duelos_promocion:   row?.duelos_promocion    ?? 0,
    victorias_promocion: row?.victorias_promocion ?? 0,
  }
}

export async function obtenerRankingLiga(ligaKey: string, limite = 20): Promise<UsuarioLigaArena[]> {
  return query<UsuarioLigaArena>(
    `SELECT id, nombre, avatar_url, puntos_arena, liga_arena
     FROM usuarios
     WHERE liga_arena = ?
     ORDER BY puntos_arena DESC
     LIMIT ?`,
    [ligaKey, limite]
  )
}

export async function obtenerRankingTodasLigas(limitePorLiga = 10): Promise<UsuarioLigaArena[]> {
  return query<UsuarioLigaArena>(
    `SELECT u.id, u.nombre, u.avatar_url, u.puntos_arena, u.liga_arena
     FROM usuarios u
     INNER JOIN (
       SELECT liga_arena, id,
              ROW_NUMBER() OVER (PARTITION BY liga_arena ORDER BY puntos_arena DESC) AS rn
       FROM usuarios
     ) ranked ON ranked.id = u.id AND ranked.rn <= ?
     ORDER BY u.liga_arena, u.puntos_arena DESC`,
    [limitePorLiga]
  )
}

export async function procesarResultadoDuelo(
  ganadorId: number | null,
  perdedorId: number | null,
): Promise<void> {
  if (ganadorId)  await actualizarPuntos(ganadorId,  true)
  if (perdedorId) await actualizarPuntos(perdedorId, false)
}

async function actualizarPuntos(usuarioId: number, gano: boolean): Promise<void> {
  const estado = await obtenerEstadoLiga(usuarioId)
  const liga = getLigaArena(estado.liga)
  const siguiente = getLigaArenaSiguiente(estado.liga)

  // ── En serie de promoción ──────────────────────────────────
  if (estado.en_promocion) {
    const jugados   = estado.duelos_promocion + 1
    const victorias = estado.victorias_promocion + (gano ? 1 : 0)
    const derrotas  = jugados - victorias

    const serieTerminada = jugados >= DUELOS_PROMOCION_TOTAL
      || victorias >= VICTORIAS_PARA_ASCENDER
      || derrotas > (DUELOS_PROMOCION_TOTAL - VICTORIAS_PARA_ASCENDER)

    if (serieTerminada) {
      const promovido = victorias >= VICTORIAS_PARA_ASCENDER && siguiente

      if (promovido) {
        await execute(
          `UPDATE usuarios SET liga_arena=?, puntos_arena=0,
           en_promocion_arena=0, duelos_promocion=0, victorias_promocion=0
           WHERE id=?`,
          [siguiente!.key, usuarioId]
        )
      } else {
        await execute(
          `UPDATE usuarios SET puntos_arena=?,
           en_promocion_arena=0, duelos_promocion=0, victorias_promocion=0
           WHERE id=?`,
          [PUNTOS_FALLO_PROMOCION, usuarioId]
        )
      }
    } else {
      await execute(
        `UPDATE usuarios SET duelos_promocion=?, victorias_promocion=? WHERE id=?`,
        [jugados, victorias, usuarioId]
      )
    }
    return
  }

  // ── Master: acumula sin tope ───────────────────────────────
  if (liga.key === 'master') {
    const nuevoPts = Math.max(0, estado.puntos_arena + (gano ? PUNTOS_POR_VICTORIA : -PUNTOS_POR_DERROTA))
    await execute(`UPDATE usuarios SET puntos_arena=? WHERE id=?`, [nuevoPts, usuarioId])
    return
  }

  // ── Liga normal ────────────────────────────────────────────
  const nuevoPts = Math.max(0, estado.puntos_arena + (gano ? PUNTOS_POR_VICTORIA : -PUNTOS_POR_DERROTA))

  if (nuevoPts >= (liga.puntosMeta ?? 100) && siguiente) {
    // Entrar en promoción
    await execute(
      `UPDATE usuarios SET puntos_arena=?, en_promocion_arena=1,
       duelos_promocion=0, victorias_promocion=0 WHERE id=?`,
      [nuevoPts, usuarioId]
    )
  } else {
    await execute(`UPDATE usuarios SET puntos_arena=? WHERE id=?`, [nuevoPts, usuarioId])
  }
}
