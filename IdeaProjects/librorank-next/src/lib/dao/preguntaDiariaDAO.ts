import { queryOne, execute } from '@/lib/db'

export async function obtenerRespuestaHoy(usuarioId: number): Promise<{ correcta: boolean } | null> {
  const hoy = new Date().toISOString().slice(0, 10)
  return queryOne<{ correcta: boolean }>(
    'SELECT correcta FROM pregunta_diaria_respuestas WHERE usuario_id = ? AND fecha = ?',
    [usuarioId, hoy]
  )
}

export async function registrarRespuesta(usuarioId: number, correcta: boolean): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10)
  await execute(
    'INSERT IGNORE INTO pregunta_diaria_respuestas (usuario_id, fecha, correcta) VALUES (?, ?, ?)',
    [usuarioId, hoy, correcta ? 1 : 0]
  )
  if (correcta) {
    await execute(
      'UPDATE usuarios SET tiradas_disponibles = tiradas_disponibles + 1 WHERE id = ?',
      [usuarioId]
    )
  }
}

export async function crearTablasSiNoExisten(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS pregunta_diaria_respuestas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      fecha DATE NOT NULL,
      correcta TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_usuario_fecha (usuario_id, fecha)
    )
  `, [])
}
