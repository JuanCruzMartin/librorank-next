import { query, execute, queryOne } from '@/lib/db'

export interface Mensaje {
  id: number
  de_usuario_id: number
  para_usuario_id: number
  texto: string
  leido: boolean
  created_at: string
  // joins
  de_username: string
  de_nombre: string
  de_avatar: string | null
}

export interface Conversacion {
  usuario_id: number
  username: string
  nombre: string
  avatar_url: string | null
  ultimo_mensaje: string
  ultimo_at: string
  no_leidos: number
}

export async function crearTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS mensajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      de_usuario_id INT NOT NULL,
      para_usuario_id INT NOT NULL,
      texto TEXT NOT NULL,
      leido TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_para (para_usuario_id, leido),
      KEY idx_conversacion (de_usuario_id, para_usuario_id),
      KEY idx_created (created_at)
    )
  `, [])
}

export async function enviarMensaje(deId: number, paraId: number, texto: string): Promise<void> {
  await execute(
    'INSERT INTO mensajes (de_usuario_id, para_usuario_id, texto) VALUES (?, ?, ?)',
    [deId, paraId, texto.trim()]
  )
}

export async function obtenerMensajes(usuarioAId: number, usuarioBId: number, limite = 50): Promise<Mensaje[]> {
  return query<Mensaje>(`
    SELECT m.*, u.username AS de_username, u.nombre AS de_nombre, u.avatar_url AS de_avatar
    FROM mensajes m
    JOIN usuarios u ON u.id = m.de_usuario_id
    WHERE (m.de_usuario_id = ? AND m.para_usuario_id = ?)
       OR (m.de_usuario_id = ? AND m.para_usuario_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ?
  `, [usuarioAId, usuarioBId, usuarioBId, usuarioAId, limite])
}

export async function marcarLeidos(deId: number, paraId: number): Promise<void> {
  await execute(
    'UPDATE mensajes SET leido=1 WHERE de_usuario_id=? AND para_usuario_id=? AND leido=0',
    [deId, paraId]
  )
}

export async function obtenerConversaciones(usuarioId: number): Promise<Conversacion[]> {
  // Obtiene la última interacción con cada contacto + no leídos
  return query<Conversacion>(`
    SELECT
      otro.id           AS usuario_id,
      otro.username,
      otro.nombre,
      otro.avatar_url,
      ult.texto         AS ultimo_mensaje,
      ult.created_at    AS ultimo_at,
      COALESCE(nr.cnt, 0) AS no_leidos
    FROM (
      SELECT DISTINCT
        IF(de_usuario_id = ?, para_usuario_id, de_usuario_id) AS otro_id
      FROM mensajes
      WHERE de_usuario_id = ? OR para_usuario_id = ?
    ) pares
    JOIN usuarios otro ON otro.id = pares.otro_id
    JOIN mensajes ult ON ult.id = (
      SELECT id FROM mensajes
      WHERE (de_usuario_id = ? AND para_usuario_id = otro.id)
         OR (de_usuario_id = otro.id AND para_usuario_id = ?)
      ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN (
      SELECT de_usuario_id, COUNT(*) AS cnt
      FROM mensajes
      WHERE para_usuario_id = ? AND leido = 0
      GROUP BY de_usuario_id
    ) nr ON nr.de_usuario_id = otro.id
    ORDER BY ult.created_at DESC
  `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId])
}

export async function contarNoLeidos(usuarioId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    'SELECT COUNT(*) AS total FROM mensajes WHERE para_usuario_id=? AND leido=0',
    [usuarioId]
  )
  return row?.total ?? 0
}

export async function obtenerMensajesDesdeid(usuarioAId: number, usuarioBId: number, desdeId: number): Promise<Mensaje[]> {
  return query<Mensaje>(`
    SELECT m.*, u.username AS de_username, u.nombre AS de_nombre, u.avatar_url AS de_avatar
    FROM mensajes m
    JOIN usuarios u ON u.id = m.de_usuario_id
    WHERE ((m.de_usuario_id = ? AND m.para_usuario_id = ?)
        OR (m.de_usuario_id = ? AND m.para_usuario_id = ?))
      AND m.id > ?
    ORDER BY m.created_at ASC
  `, [usuarioAId, usuarioBId, usuarioBId, usuarioAId, desdeId])
}
