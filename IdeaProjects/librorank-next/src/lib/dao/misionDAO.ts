import { query, queryOne, execute } from '@/lib/db'
import { otorgarPuntos } from './libroDAO'

// ── Tipos ────────────────────────────────────────────────────────────────────

export type TipoMision = 'mensual' | 'semanal' | 'permanente'

export interface MisionDef {
  key: string
  nombre: string
  descripcion: string
  icono: string
  tipo: TipoMision
  meta: number
  puntos: number
  color: string
}

export interface MisionConProgreso extends MisionDef {
  progreso: number          // 0..meta
  completada: boolean       // progreso >= meta
  reclamada: boolean        // ya cobró los puntos
  periodo: string           // periodo actual para esta misión
}

// ── Definición de misiones ───────────────────────────────────────────────────

export const MISIONES: MisionDef[] = [
  // Mensuales
  { key: 'MES_LEER_1',       nombre: 'Primer libro del mes',    descripcion: 'Marcá 1 libro como leído este mes',        icono: '📖', tipo: 'mensual',    meta: 1,  puntos: 50,  color: '#4a9e7a' },
  { key: 'MES_LEER_3',       nombre: 'Lector del mes',          descripcion: 'Leé 3 libros este mes',                    icono: '📚', tipo: 'mensual',    meta: 3,  puntos: 100, color: '#27ae60' },
  { key: 'MES_CALIFICAR_3',  nombre: 'Crítico del mes',         descripcion: 'Calificá 3 libros con estrellas este mes', icono: '⭐', tipo: 'mensual',    meta: 3,  puntos: 40,  color: '#f39c12' },
  { key: 'MES_RESENA_1',     nombre: 'Reseñador',               descripcion: 'Escribí al menos 1 reseña este mes',       icono: '✍️', tipo: 'mensual',    meta: 1,  puntos: 60,  color: '#8e44ad' },
  // Semanales
  { key: 'SEM_LEER_1',       nombre: 'A leer esta semana',      descripcion: 'Leé 1 libro esta semana',                  icono: '🎯', tipo: 'semanal',    meta: 1,  puntos: 30,  color: '#2980b9' },
  { key: 'SEM_AGREGAR_2',    nombre: 'Ampliar biblioteca',      descripcion: 'Agregá 2 libros esta semana',              icono: '➕', tipo: 'semanal',    meta: 2,  puntos: 20,  color: '#16a085' },
  // Permanentes
  { key: 'PERM_GENEROS_3',   nombre: 'Explorador de géneros',   descripcion: 'Leé libros de 3 géneros distintos',        icono: '🌍', tipo: 'permanente', meta: 3,  puntos: 75,  color: '#e67e22' },
  { key: 'PERM_BIBLIOTECA_10',nombre:'Gran biblioteca',          descripcion: 'Tenés 10 libros en tu biblioteca',         icono: '🏛️', tipo: 'permanente', meta: 10, puntos: 50,  color: '#c0392b' },
  { key: 'PERM_LEIDOS_10',   nombre: 'Lector comprometido',     descripcion: 'Leé 10 libros en total',                   icono: '🏅', tipo: 'permanente', meta: 10, puntos: 100, color: '#d4af37' },
  { key: 'PERM_LEIDOS_25',   nombre: 'Devorador de historias',  descripcion: 'Leé 25 libros en total',                   icono: '🐉', tipo: 'permanente', meta: 25, puntos: 200, color: '#e74c3c' },
  { key: 'PERM_RACHA_7',     nombre: 'Racha de fuego',          descripcion: 'Alcanzá una racha de 7 días seguidos',     icono: '🔥', tipo: 'permanente', meta: 7,  puntos: 150, color: '#ff6b35' },
  { key: 'PERM_RESENAS_5',   nombre: 'Crítico literario',       descripcion: 'Escribí 5 reseñas en total',               icono: '📝', tipo: 'permanente', meta: 5,  puntos: 80,  color: '#9b59b6' },
]

// ── Helpers de periodo ───────────────────────────────────────────────────────

function getPeriodoActual(tipo: TipoMision): string {
  const hoy = new Date()
  if (tipo === 'mensual') {
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  }
  if (tipo === 'semanal') {
    // ISO week number
    const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
  }
  return 'permanente'
}

// ── Inicializar tabla ────────────────────────────────────────────────────────

export async function inicializarTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS misiones_reclamadas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      mision_key VARCHAR(100) NOT NULL,
      periodo VARCHAR(20) NOT NULL,
      fecha_reclamo DATETIME DEFAULT NOW(),
      UNIQUE KEY uq_mision (usuario_id, mision_key, periodo)
    )
  `, [])
}

// ── Obtener misiones reclamadas del usuario en periodo actual ────────────────

async function getReclamadas(usuarioId: number): Promise<Set<string>> {
  const periodos = [...new Set(MISIONES.map(m => getPeriodoActual(m.tipo)))]
  const rows = await query<{ mision_key: string; periodo: string }>(
    `SELECT mision_key, periodo FROM misiones_reclamadas
     WHERE usuario_id = ? AND periodo IN (${periodos.map(() => '?').join(',')})`,
    [usuarioId, ...periodos]
  )
  // key único: mision_key + periodo
  return new Set(rows.map(r => `${r.mision_key}::${r.periodo}`))
}

// ── Calcular progreso dinámicamente ─────────────────────────────────────────

async function calcularProgreso(usuarioId: number): Promise<Map<string, number>> {
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  const [
    leidos_mes, calificados_mes, resenas_mes,
    leidos_semana, agregados_semana,
    generos_distintos, total_biblioteca,
    leidos_total, resenas_total, racha,
  ] = await Promise.all([
    // leídos este mes
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND MONTH(fecha_registro)=? AND YEAR(fecha_registro)=?`, [usuarioId, mes, anio]),
    // calificados este mes (estrellas > 0)
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND estrellas > 0 AND MONTH(fecha_registro)=? AND YEAR(fecha_registro)=?`, [usuarioId, mes, anio]),
    // reseñas este mes
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND resena IS NOT NULL AND resena != '' AND MONTH(fecha_registro)=? AND YEAR(fecha_registro)=?`, [usuarioId, mes, anio]),
    // leídos esta semana
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND YEARWEEK(fecha_registro, 1)=YEARWEEK(NOW(), 1)`, [usuarioId]),
    // agregados esta semana
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND YEARWEEK(fecha_registro, 1)=YEARWEEK(NOW(), 1)`, [usuarioId]),
    // géneros distintos (leídos total)
    queryOne<{ c: number }>(`SELECT COUNT(DISTINCT genero) AS c FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND genero IS NOT NULL AND genero != ''`, [usuarioId]),
    // total biblioteca
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=?`, [usuarioId]),
    // total leídos
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')`, [usuarioId]),
    // total reseñas
    queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM libros_usuario WHERE usuario_id=? AND resena IS NOT NULL AND resena != ''`, [usuarioId]),
    // racha actual
    queryOne<{ racha_actual: number }>(`SELECT racha_actual FROM usuarios WHERE id=?`, [usuarioId]),
  ])

  return new Map([
    ['MES_LEER_1',        leidos_mes?.c ?? 0],
    ['MES_LEER_3',        leidos_mes?.c ?? 0],
    ['MES_CALIFICAR_3',   calificados_mes?.c ?? 0],
    ['MES_RESENA_1',      resenas_mes?.c ?? 0],
    ['SEM_LEER_1',        leidos_semana?.c ?? 0],
    ['SEM_AGREGAR_2',     agregados_semana?.c ?? 0],
    ['PERM_GENEROS_3',    generos_distintos?.c ?? 0],
    ['PERM_BIBLIOTECA_10',total_biblioteca?.c ?? 0],
    ['PERM_LEIDOS_10',    leidos_total?.c ?? 0],
    ['PERM_LEIDOS_25',    leidos_total?.c ?? 0],
    ['PERM_RACHA_7',      racha?.racha_actual ?? 0],
    ['PERM_RESENAS_5',    resenas_total?.c ?? 0],
  ])
}

// ── Obtener misiones con progreso ────────────────────────────────────────────

export async function obtenerMisionesConProgreso(usuarioId: number): Promise<MisionConProgreso[]> {
  await inicializarTabla()
  const [progresoMap, reclamadas] = await Promise.all([
    calcularProgreso(usuarioId),
    getReclamadas(usuarioId),
  ])

  return MISIONES.map(m => {
    const periodo = getPeriodoActual(m.tipo)
    const progreso = Math.min(progresoMap.get(m.key) ?? 0, m.meta)
    const completada = progreso >= m.meta
    const reclamada = reclamadas.has(`${m.key}::${periodo}`)
    return { ...m, progreso, completada, reclamada, periodo }
  })
}

// ── Reclamar recompensa ──────────────────────────────────────────────────────

export async function reclamarMision(usuarioId: number, misionKey: string): Promise<{ ok: boolean; puntos?: number; error?: string }> {
  await inicializarTabla()

  const mision = MISIONES.find(m => m.key === misionKey)
  if (!mision) return { ok: false, error: 'Misión no encontrada' }

  const periodo = getPeriodoActual(mision.tipo)

  // Verificar que no esté ya reclamada
  const yaReclamada = await queryOne<{ id: number }>(
    'SELECT id FROM misiones_reclamadas WHERE usuario_id=? AND mision_key=? AND periodo=?',
    [usuarioId, misionKey, periodo]
  )
  if (yaReclamada) return { ok: false, error: 'Ya reclamada' }

  // Verificar que esté completada
  const progresoMap = await calcularProgreso(usuarioId)
  const progreso = progresoMap.get(misionKey) ?? 0
  if (progreso < mision.meta) return { ok: false, error: 'Misión no completada aún' }

  // Registrar reclamo + otorgar puntos
  await execute(
    'INSERT IGNORE INTO misiones_reclamadas (usuario_id, mision_key, periodo) VALUES (?, ?, ?)',
    [usuarioId, misionKey, periodo]
  )
  await otorgarPuntos(usuarioId, mision.puntos, `Misión completada: ${mision.nombre}`)

  return { ok: true, puntos: mision.puntos }
}
