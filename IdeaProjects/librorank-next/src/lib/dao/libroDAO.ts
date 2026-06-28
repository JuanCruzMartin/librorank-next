import { query, queryOne, execute, transaction } from '@/lib/db'
import { obtenerOCrear } from './libroGlobalDAO'
import { crearNotificacion } from './notificacionDAO'

export interface Libro {
  id: number
  usuario_id: number
  libro_global_id: number | null
  titulo: string
  autor: string
  anio: number | null
  paginas: number | null
  estado: string
  portada_url: string | null
  estrellas: number
  resena: string | null
  genero: string | null
  mood: string | null
  fecha_leido: string | null
}

export interface PerfilStats {
  total: number
  leidos: number
  leyendo: number
  pendientes: number
  pausa: number
}

export async function agregar(libro: Omit<Libro, 'id'>): Promise<number | false> {
  const globalId = await obtenerOCrear({
    titulo: libro.titulo, autor: libro.autor,
    portada_url: libro.portada_url, anio: libro.anio, paginas: libro.paginas,
  })

  const estadoUp = libro.estado.toUpperCase()
  const esLeido = estadoUp === 'LEIDO' || estadoUp === 'LEÍDO'
  const res = await execute(
    `INSERT INTO libros_usuario (usuario_id, libro_global_id, titulo, autor, anio, paginas, estado, portada_url, genero, mood, fecha_leido)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [libro.usuario_id, globalId, libro.titulo, libro.autor, libro.anio ?? null,
     libro.paginas ?? null, estadoUp, libro.portada_url ?? null, libro.genero ?? null, libro.mood ?? null,
     esLeido ? new Date() : null]
  )
  return res.affectedRows > 0 ? res.insertId : false
}

export async function buscarPorUsuario(usuarioId: number): Promise<Libro[]> {
  return query<Libro>(
    `SELECT * FROM libros_usuario WHERE usuario_id = ? AND estado != 'ARCHIVADO' ORDER BY id DESC`,
    [usuarioId]
  )
}

export async function buscarPorId(id: number, usuarioId: number): Promise<Libro | null> {
  return queryOne<Libro>('SELECT * FROM libros_usuario WHERE id=? AND usuario_id=?', [id, usuarioId])
}

export async function actualizar(libro: Pick<Libro, 'id' | 'usuario_id' | 'estado' | 'estrellas' | 'resena' | 'genero' | 'mood'>): Promise<boolean> {
  const estadoUp = libro.estado.toUpperCase()
  const esLeido = estadoUp === 'LEIDO' || estadoUp === 'LEÍDO'
  const res = await execute(
    `UPDATE libros_usuario
     SET estado=?, estrellas=?, resena=?, genero=?, mood=?,
         fecha_leido = CASE WHEN ? AND fecha_leido IS NULL THEN NOW() ELSE fecha_leido END
     WHERE id=? AND usuario_id=?`,
    [estadoUp, libro.estrellas ?? 0, libro.resena ?? null, libro.genero ?? null, libro.mood ?? null,
     esLeido, libro.id, libro.usuario_id]
  )
  return res.affectedRows > 0
}

export async function eliminar(idLibro: number, idUsuario: number): Promise<boolean> {
  return transaction(async conn => {
    await conn.execute('DELETE FROM diario_lectura WHERE libro_id=?', [idLibro])
    const [res] = await conn.execute('DELETE FROM libros_usuario WHERE id=? AND usuario_id=?', [idLibro, idUsuario])
    return (res as { affectedRows: number }).affectedRows > 0
  })
}

export async function existeRegistroPrevio(usuarioId: number, titulo: string, autor: string): Promise<boolean> {
  const rows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM libros_usuario WHERE usuario_id=? AND LOWER(titulo)=LOWER(?) AND LOWER(autor)=LOWER(?) AND estado != 'ARCHIVADO'`,
    [usuarioId, titulo.trim(), autor.trim()]
  )
  return (rows[0]?.total ?? 0) > 0
}

export async function obtenerLeyendoAhora(usuarioId: number): Promise<Libro[]> {
  return query<Libro>(
    `SELECT * FROM libros_usuario WHERE usuario_id=? AND UPPER(estado)='LEYENDO' ORDER BY id DESC LIMIT 3`,
    [usuarioId]
  )
}

export async function obtenerUltimasLecturas(usuarioId: number, limite = 5): Promise<Libro[]> {
  return query<Libro>(
    `SELECT * FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') ORDER BY id DESC LIMIT ?`,
    [usuarioId, limite]
  )
}

export async function obtenerStatsPorUsuario(usuarioId: number): Promise<PerfilStats> {
  const row = await queryOne<PerfilStats>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN UPPER(estado) IN ('LEIDO','LEÍDO') THEN 1 ELSE 0 END) AS leidos,
            SUM(CASE WHEN UPPER(estado)='LEYENDO' THEN 1 ELSE 0 END) AS leyendo,
            SUM(CASE WHEN UPPER(estado)='PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN UPPER(estado)='PAUSA' THEN 1 ELSE 0 END) AS pausa
     FROM libros_usuario WHERE usuario_id=?`,
    [usuarioId]
  )
  return row ?? { total: 0, leidos: 0, leyendo: 0, pendientes: 0, pausa: 0 }
}

export async function contarLeidosEsteAnio(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND YEAR(fecha_creacion)=YEAR(CURDATE())`,
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function contarLeidosTotal(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')`,
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function sumarPaginasLeidas(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT SUM(paginas) AS total FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')`,
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function contarResenasTotal(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM libros_usuario WHERE usuario_id=? AND resena IS NOT NULL AND resena != ''`,
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function contarGenerosDistintos(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(DISTINCT LOWER(genero)) AS total FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND genero IS NOT NULL AND genero != ''`,
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function obtenerAutorMasLeido(usuarioId: number): Promise<string> {
  const row = await queryOne<{ autor: string }>(
    `SELECT autor FROM libros_usuario WHERE usuario_id=? AND autor!='' AND UPPER(estado) IN ('LEIDO','LEÍDO') GROUP BY autor ORDER BY COUNT(*) DESC LIMIT 1`,
    [usuarioId]
  )
  return row?.autor ?? 'N/A'
}

export async function obtenerMejorCalificado(usuarioId: number): Promise<string> {
  const row = await queryOne<{ titulo: string }>(
    `SELECT titulo FROM libros_usuario WHERE usuario_id=? AND estrellas>0 ORDER BY estrellas DESC, id DESC LIMIT 1`,
    [usuarioId]
  )
  return row?.titulo ?? 'N/A'
}

export async function obtenerPromedioEstrellas(usuarioId: number): Promise<number> {
  const row = await queryOne<{ promedio: number }>(
    `SELECT ROUND(AVG(NULLIF(estrellas,0)), 1) AS promedio FROM libros_usuario WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')`,
    [usuarioId]
  )
  return row?.promedio ?? 0
}

export async function obtenerResenasPublicas(usuarioId: number, limite = 10): Promise<Libro[]> {
  return query<Libro>(
    `SELECT * FROM libros_usuario
     WHERE usuario_id=? AND resena IS NOT NULL AND resena != ''
       AND UPPER(estado) IN ('LEIDO','LEÍDO')
     ORDER BY id DESC LIMIT ?`,
    [usuarioId, limite]
  )
}

export async function obtenerTopGeneros(usuarioId: number, limite = 3): Promise<string[]> {
  const rows = await query<{ genero: string }>(
    `SELECT genero FROM libros_usuario
     WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')
       AND genero IS NOT NULL AND genero != ''
     GROUP BY genero ORDER BY COUNT(*) DESC LIMIT ?`,
    [usuarioId, limite]
  )
  return rows.map(r => r.genero)
}

export async function obtenerConteoPorGenero(usuarioId: number): Promise<Record<string, number>> {
  const rows = await query<{ genero: string; total: number }>(
    `SELECT genero, COUNT(*) as total FROM libros_usuario WHERE usuario_id=? AND genero IS NOT NULL AND genero!='' GROUP BY genero`,
    [usuarioId]
  )
  return Object.fromEntries(rows.map(r => [r.genero, r.total]))
}

export async function obtenerConteoPorMood(usuarioId: number): Promise<Record<string, number>> {
  const rows = await query<{ mood: string; total: number }>(
    `SELECT mood, COUNT(*) as total FROM libros_usuario WHERE usuario_id=? AND mood IS NOT NULL AND mood!='' GROUP BY mood`,
    [usuarioId]
  )
  return Object.fromEntries(rows.map(r => [r.mood, r.total]))
}

export async function otorgarPuntos(usuarioId: number, monto: number, concepto: string): Promise<void> {
  let saldoAnterior = 0
  let saldoNuevo = 0

  await transaction(async conn => {
    const [rows] = await conn.query('SELECT monedas, puntos_hito_ultimo FROM usuarios WHERE id=?', [usuarioId])
    const row0 = (rows as { monedas: number; puntos_hito_ultimo: number }[])[0]
    saldoAnterior = row0?.monedas ?? 0
    saldoNuevo = saldoAnterior + monto
    await conn.execute('UPDATE usuarios SET monedas=? WHERE id=?', [saldoNuevo, usuarioId])
    await conn.execute(
      `INSERT INTO movimientos_moneda (usuario_id, tipo, concepto, monto, saldo_resultante) VALUES (?, 'GANANCIA', ?, ?, ?)`,
      [usuarioId, concepto, monto, saldoNuevo]
    )
    // Tiradas de cartas: cada 500 puntos acumulados = +3 tiradas
    const hitoActual = row0?.puntos_hito_ultimo ?? 0
    const nuevoHito = Math.floor(saldoNuevo / 500) * 500
    if (nuevoHito > hitoActual) {
      const hitosGanados = (nuevoHito - hitoActual) / 500
      await conn.execute(
        'UPDATE usuarios SET tiradas_disponibles = tiradas_disponibles + ?, puntos_hito_ultimo = ? WHERE id=?',
        [hitosGanados, nuevoHito, usuarioId]
      )
    }
  })

  // Detectar usuarios superados y notificarlos (fire & forget, no bloquea)
  if (monto > 0 && saldoNuevo > saldoAnterior) {
    notificarRankingSuperado(usuarioId, saldoAnterior, saldoNuevo).catch(e =>
      console.error('[notifRanking] Error notificando posición:', e)
    )
  }
}

export interface LibroFavorito {
  titulo: string
  autor: string
  estrellas: number
  genero: string | null
  portada_url: string | null
}

export interface LibroAmigo {
  titulo: string
  autor: string
  portada_url: string | null
  genero: string | null
  amigos_leyeron: number
  amigos_names: string
}

export async function obtenerLibrosFavoritos(usuarioId: number, limite = 5): Promise<LibroFavorito[]> {
  return query<LibroFavorito>(
    `SELECT titulo, autor, estrellas, genero, portada_url
     FROM libros_usuario
     WHERE usuario_id = ? AND estrellas >= 4
     ORDER BY estrellas DESC, id DESC
     LIMIT ?`,
    [usuarioId, limite]
  )
}

export async function obtenerLibrosAmigos(usuarioId: number, limite = 24): Promise<LibroAmigo[]> {
  return query<LibroAmigo>(
    `SELECT l.titulo, l.autor, l.portada_url, l.genero,
            COUNT(DISTINCT l.usuario_id) AS amigos_leyeron,
            GROUP_CONCAT(DISTINCT u.username ORDER BY u.username SEPARATOR ', ') AS amigos_names
     FROM libros_usuario l
     JOIN amigos a ON l.usuario_id = a.amigo_id
     JOIN usuarios u ON l.usuario_id = u.id
     WHERE a.usuario_id = ?
       AND UPPER(l.estado) IN ('LEIDO','LEÍDO')
       AND LOWER(l.titulo) NOT IN (
         SELECT LOWER(titulo) FROM libros_usuario WHERE usuario_id = ?
       )
     GROUP BY l.titulo, l.autor, l.portada_url, l.genero
     ORDER BY amigos_leyeron DESC, l.titulo
     LIMIT ?`,
    [usuarioId, usuarioId, limite]
  )
}

async function notificarRankingSuperado(
  usuarioId: number,
  saldoAnterior: number,
  saldoNuevo: number
): Promise<void> {
  // Buscar usuarios que estaban entre saldoAnterior y saldoNuevo (fueron superados)
  const pasados = await query<{ id: number; username: string; monedas: number }>(
    `SELECT id, username, monedas
     FROM usuarios
     WHERE monedas > ? AND monedas < ? AND id != ?`,
    [saldoAnterior, saldoNuevo, usuarioId]
  )
  if (pasados.length === 0) return

  const usuarioRow = await queryOne<{ username: string }>(
    'SELECT username FROM usuarios WHERE id=?',
    [usuarioId]
  )
  const nombrePasador = usuarioRow?.username ?? 'alguien'

  for (const pasado of pasados) {
    // Nueva posición del usuario superado (cuántos tienen más monedas que él ahora)
    const rankRow = await queryOne<{ pos: number }>(
      'SELECT COUNT(*) + 1 AS pos FROM usuarios WHERE monedas > ?',
      [pasado.monedas]
    )
    const posicion = rankRow?.pos ?? '?'

    await crearNotificacion(
      pasado.id,
      'RANKING',
      `¡@${nombrePasador} te superó en el ranking! Ahora estás en el puesto #${posicion} 🏆`
    )
  }
}
