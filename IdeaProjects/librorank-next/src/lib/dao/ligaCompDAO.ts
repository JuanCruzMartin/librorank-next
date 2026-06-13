import { query, queryOne, execute } from '@/lib/db'
import { LIGAS } from '@/lib/ligas'
import { crearNotificacion } from './notificacionDAO'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface UsuarioLigaComp {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  puntos: number
  libros_semana: number
  liga_key: string
}

// ── Helpers de semana ────────────────────────────────────────────────────────

function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getSemanaActual(): string {
  return getISOWeekKey(new Date())
}

// ── Auto-create tables ───────────────────────────────────────────────────────

async function ensureTables(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS liga_comp_usuarios (
      usuario_id INT PRIMARY KEY,
      liga_key   VARCHAR(20) NOT NULL DEFAULT 'bronce',
      updated_at DATETIME    NOT NULL DEFAULT NOW()
    )
  `, [])
  await execute(`
    CREATE TABLE IF NOT EXISTS liga_reset_log (
      semana       VARCHAR(20) PRIMARY KEY,
      fecha        DATETIME NOT NULL DEFAULT NOW(),
      ascendidos   INT NOT NULL DEFAULT 0,
      descendidos  INT NOT NULL DEFAULT 0
    )
  `, [])
}

// ── Obtener / inicializar liga del usuario ───────────────────────────────────

export async function getLigaCompUsuario(usuarioId: number): Promise<string> {
  await ensureTables()
  const row = await queryOne<{ liga_key: string }>(
    'SELECT liga_key FROM liga_comp_usuarios WHERE usuario_id = ?',
    [usuarioId]
  )
  if (!row) {
    await execute(
      'INSERT IGNORE INTO liga_comp_usuarios (usuario_id, liga_key) VALUES (?, ?)',
      [usuarioId, 'bronce']
    )
    return 'bronce'
  }
  return row.liga_key
}

// ── Ranking dentro de una liga competitiva esta semana ───────────────────────

export async function getRankingLigaComp(ligaKey: string): Promise<UsuarioLigaComp[]> {
  await ensureTables()
  return query<UsuarioLigaComp>(
    `SELECT u.id, u.nombre, u.username, u.avatar_url,
            COALESCE(u.monedas, 0) AS puntos,
            COALESCE(lc.liga_key, 'bronce') AS liga_key,
            COUNT(l.id) AS libros_semana
     FROM usuarios u
     JOIN liga_comp_usuarios lc ON u.id = lc.usuario_id
     LEFT JOIN libros_usuario l ON u.id = l.usuario_id
       AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
       AND l.fecha_leido >= DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY)
     WHERE lc.liga_key = ?
     GROUP BY u.id, u.nombre, u.username, u.avatar_url, u.monedas, lc.liga_key
     ORDER BY libros_semana DESC, u.id ASC
     LIMIT 100`,
    [ligaKey]
  )
}

// ── Reset semanal (lazy: se dispara en la primera visita del lunes) ──────────

export async function ensureResetSemanal(): Promise<void> {
  await ensureTables()
  const semana = getSemanaActual()
  const yaReset = await queryOne<{ semana: string }>(
    'SELECT semana FROM liga_reset_log WHERE semana = ?',
    [semana]
  )
  if (yaReset) return
  await ejecutarReset(semana)
}

async function ejecutarReset(semana: string): Promise<void> {
  // Snapshot: liga actual + libros leídos la semana ANTERIOR para cada usuario
  const snapshot = await query<{
    id: number; username: string; avatar_url: string | null
    liga_key: string; libros_semana: number
  }>(
    `SELECT u.id, u.username, u.avatar_url,
            COALESCE(lc.liga_key, 'bronce') AS liga_key,
            COUNT(l.id) AS libros_semana
     FROM usuarios u
     LEFT JOIN liga_comp_usuarios lc ON u.id = lc.usuario_id
     LEFT JOIN libros_usuario l ON u.id = l.usuario_id
       AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
       AND YEARWEEK(l.fecha_leido, 1) = YEARWEEK(DATE_SUB(NOW(), INTERVAL 7 DAY), 1)
     GROUP BY u.id, u.username, u.avatar_url, lc.liga_key`,
    []
  )

  const PROMO = 3  // top 3 suben / bottom 3 bajan
  const cambios = new Map<number, { nuevaLiga: string; accion: 'subio' | 'bajo' }>()

  for (let i = 0; i < LIGAS.length; i++) {
    const liga = LIGAS[i]
    const ligaArriba = LIGAS[i + 1]
    const ligaAbajo  = LIGAS[i - 1]

    const enEstaLiga = snapshot
      .filter(u => (u.liga_key ?? 'bronce') === liga.key)
      .sort((a, b) => b.libros_semana - a.libros_semana)

    // Top PROMO activos → subir (si existe liga superior)
    if (ligaArriba) {
      enEstaLiga
        .filter(u => u.libros_semana > 0)
        .slice(0, PROMO)
        .forEach(u => cambios.set(u.id, { nuevaLiga: ligaArriba.key, accion: 'subio' }))
    }

    // Bottom PROMO inactivos (0 libros) → bajar (si existe liga inferior)
    if (ligaAbajo) {
      enEstaLiga
        .filter(u => u.libros_semana === 0)
        .slice(-PROMO)
        .forEach(u => {
          if (!cambios.has(u.id))
            cambios.set(u.id, { nuevaLiga: ligaAbajo.key, accion: 'bajo' })
        })
    }
  }

  // Aplicar cambios + notificar
  let ascendidos = 0, descendidos = 0
  for (const [userId, cambio] of Array.from(cambios)) {
    await execute(
      `INSERT INTO liga_comp_usuarios (usuario_id, liga_key, updated_at) VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE liga_key = VALUES(liga_key), updated_at = NOW()`,
      [userId, cambio.nuevaLiga]
    )
    const ligaObj = LIGAS.find(l => l.key === cambio.nuevaLiga)!
    if (cambio.accion === 'subio') {
      ascendidos++
      await crearNotificacion(userId, 'LIGA_COMP',
        `¡Subiste a ${ligaObj.nombre} ${ligaObj.emoji}! Estuviste entre los mejores de la semana. ¡Seguí así!`)
    } else {
      descendidos++
      await crearNotificacion(userId, 'LIGA_COMP',
        `Bajaste a ${ligaObj.nombre} ${ligaObj.emoji} por inactividad. ¡Esta semana es tu oportunidad de remontar!`)
    }
  }

  await execute(
    'INSERT IGNORE INTO liga_reset_log (semana, ascendidos, descendidos) VALUES (?, ?, ?)',
    [semana, ascendidos, descendidos]
  )
}
