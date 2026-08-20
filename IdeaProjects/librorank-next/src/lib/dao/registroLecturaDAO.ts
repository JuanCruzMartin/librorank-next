import { queryOne, execute, query } from '@/lib/db'

export async function crearTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS registro_lectura (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      libro_usuario_id INT NOT NULL,
      fecha DATE NOT NULL,
      paginas INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_usuario_fecha (usuario_id, fecha),
      KEY idx_libro (libro_usuario_id)
    )
  `, [])
}

export async function obtenerLogsHoy(usuarioId: number): Promise<{ libro_usuario_id: number; paginas: number }[]> {
  const hoy = new Date().toISOString().slice(0, 10)
  return query<{ libro_usuario_id: number; paginas: number }>(
    'SELECT libro_usuario_id, SUM(paginas) AS paginas FROM registro_lectura WHERE usuario_id=? AND fecha=? GROUP BY libro_usuario_id',
    [usuarioId, hoy]
  )
}

export async function obtenerTotalPaginasPorLibro(libroUsuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(paginas), 0) AS total FROM registro_lectura WHERE libro_usuario_id=?',
    [libroUsuarioId]
  )
  return row?.total ?? 0
}

export async function registrarSesion(usuarioId: number, libroUsuarioId: number, paginas: number): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10)
  await execute(
    'INSERT INTO registro_lectura (usuario_id, libro_usuario_id, fecha, paginas) VALUES (?, ?, ?, ?)',
    [usuarioId, libroUsuarioId, hoy, paginas]
  )
}
