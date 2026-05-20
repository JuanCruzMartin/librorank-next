import { query, queryOne, execute } from '@/lib/db'

export interface Logro {
  id: number
  nombre_key: string
  nombre: string
  descripcion: string
  icono: string
  categoria: string | null
  desbloqueado: boolean
  fecha_desbloqueo: string | null
}

export async function obtenerLogrosUsuario(usuarioId: number): Promise<Logro[]> {
  return query<Logro>(
    `SELECT l.id, l.nombre_key, l.titulo AS nombre, l.descripcion, l.icono, l.categoria,
            (ul.usuario_id IS NOT NULL) AS desbloqueado,
            ul.fecha_desbloqueo
     FROM logros l
     LEFT JOIN usuario_logros ul ON l.id=ul.logro_id AND ul.usuario_id=?
     ORDER BY desbloqueado DESC, l.categoria ASC, l.id ASC`,
    [usuarioId]
  )
}

export async function obtenerLogrosKeys(usuarioId: number): Promise<Set<string>> {
  const rows = await query<{ nombre_key: string }>(
    `SELECT l.nombre_key FROM logros l
     JOIN usuario_logros ul ON l.id=ul.logro_id WHERE ul.usuario_id=?`,
    [usuarioId]
  )
  return new Set(rows.map(r => r.nombre_key))
}

export async function desbloquearLogro(usuarioId: number, logroKey: string): Promise<boolean> {
  const res = await execute(
    'INSERT IGNORE INTO usuario_logros (usuario_id, logro_id) SELECT ?, id FROM logros WHERE nombre_key=?',
    [usuarioId, logroKey]
  )
  return res.affectedRows > 0
}

/** Verifica y otorga todos los logros que el usuario merece según su estado actual */
export async function verificarLogros(usuarioId: number): Promise<void> {
  // Obtener stats del usuario en una sola consulta
  const stats = await queryOne<{
    puntos: number
    total_libros: number
    total_leidos: number
    total_resenas: number
    total_amigos: number
    total_diario: number
    total_citas: number
    total_cuento: number
    total_bingo: number
    total_retos: number
  }>(`
    SELECT
      u.monedas AS puntos,
      (SELECT COUNT(*) FROM libros_usuario WHERE usuario_id=u.id) AS total_libros,
      (SELECT COUNT(*) FROM libros_usuario WHERE usuario_id=u.id AND UPPER(estado) IN ('LEIDO','LEÍDO')) AS total_leidos,
      (SELECT COUNT(*) FROM libros_usuario WHERE usuario_id=u.id AND resena IS NOT NULL AND resena != '') AS total_resenas,
      (SELECT COUNT(*) FROM amigos WHERE usuario_id=u.id) AS total_amigos,
      (SELECT COUNT(*) FROM diario_lectura WHERE usuario_id=u.id) AS total_diario,
      (SELECT COUNT(*) FROM citas WHERE usuario_id=u.id) AS total_citas,
      (SELECT COUNT(*) FROM fragmentos_historia WHERE usuario_id=u.id) AS total_cuento,
      (SELECT COUNT(*) FROM usuario_bingo WHERE usuario_id=u.id AND completado=1) AS total_bingo,
      (SELECT COUNT(*) FROM retos_amigos WHERE creador_id=u.id) AS total_retos
    FROM usuarios u WHERE u.id=?
  `, [usuarioId])

  if (!stats) return

  const ya = await obtenerLogrosKeys(usuarioId)

  const candidatos: Array<[string, boolean]> = [
    ['PRIMER_LIBRO',   stats.total_libros >= 1],
    ['LECTOR_5',       stats.total_leidos >= 5],
    ['LECTOR_10',      stats.total_leidos >= 10],
    ['LECTOR_25',      stats.total_leidos >= 25],
    ['LECTOR_50',      stats.total_leidos >= 50],
    ['PRIMERA_RESENA', stats.total_resenas >= 1],
    ['PRIMER_DIARIO',  stats.total_diario >= 1],
    ['PRIMERA_CITA',   stats.total_citas >= 1],
    ['PRIMER_AMIGO',   stats.total_amigos >= 1],
    ['SOCIAL_5',       stats.total_amigos >= 5],
    ['NARRADOR',       stats.total_cuento >= 1],
    ['BINGO_CASILLA',  stats.total_bingo >= 1],
    ['RETO_CREADO',    stats.total_retos >= 1],
    ['PUNTOS_100',     stats.puntos >= 100],
    ['PUNTOS_500',     stats.puntos >= 500],
    ['PUNTOS_1000',    stats.puntos >= 1000],
  ]

  await Promise.all(
    candidatos
      .filter(([key, cumple]) => cumple && !ya.has(key))
      .map(([key]) => desbloquearLogro(usuarioId, key))
  )
}
