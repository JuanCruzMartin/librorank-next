import { query, queryOne, execute, transaction } from '@/lib/db'
import { obtenerOCrear } from './libroGlobalDAO'

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

  const res = await execute(
    `INSERT INTO libros_usuario (usuario_id, libro_global_id, titulo, autor, anio, paginas, estado, portada_url, genero, mood)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [libro.usuario_id, globalId, libro.titulo, libro.autor, libro.anio ?? null,
     libro.paginas ?? null, libro.estado, libro.portada_url ?? null, libro.genero ?? null, libro.mood ?? null]
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
  const res = await execute(
    `UPDATE libros_usuario SET estado=?, estrellas=?, resena=?, genero=?, mood=? WHERE id=? AND usuario_id=?`,
    [libro.estado.toUpperCase(), libro.estrellas ?? 0, libro.resena ?? null, libro.genero ?? null, libro.mood ?? null, libro.id, libro.usuario_id]
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
  await transaction(async conn => {
    const [rows] = await conn.query('SELECT monedas FROM usuarios WHERE id=?', [usuarioId])
    const saldo = ((rows as { monedas: number }[])[0])?.monedas ?? 0
    const nuevo = saldo + monto
    await conn.execute('UPDATE usuarios SET monedas=? WHERE id=?', [nuevo, usuarioId])
    await conn.execute(
      `INSERT INTO movimientos_moneda (usuario_id, tipo, concepto, monto, saldo_resultante) VALUES (?, 'GANANCIA', ?, ?, ?)`,
      [usuarioId, concepto, monto, nuevo]
    )
  })
}
