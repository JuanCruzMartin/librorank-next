import { query, queryOne, execute } from '@/lib/db'

export interface Cuento {
  id: number
  usuario_id: number
  titulo: string
  contenido: string
  publicado: boolean
  created_at: string
  updated_at: string
  autor_nombre?: string
  autor_username?: string
}

export async function migrarTablaCuentos(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS cuentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo VARCHAR(200) NOT NULL DEFAULT 'Sin título',
      contenido LONGTEXT NOT NULL,
      publicado TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_usuario (usuario_id)
    )
  `)
}

export async function obtenerMisCuentos(usuarioId: number): Promise<Cuento[]> {
  return query<Cuento>(
    `SELECT * FROM cuentos WHERE usuario_id = ? ORDER BY updated_at DESC`,
    [usuarioId]
  )
}

export async function obtenerCuentosPublicos(usuarioId: number): Promise<Cuento[]> {
  return query<Cuento>(
    `SELECT c.*, u.nombre AS autor_nombre, u.username AS autor_username
     FROM cuentos c JOIN usuarios u ON c.usuario_id = u.id
     WHERE c.usuario_id = ? AND c.publicado = 1
     ORDER BY c.created_at DESC`,
    [usuarioId]
  )
}

export async function obtenerCuento(id: number, usuarioId: number): Promise<Cuento | null> {
  return queryOne<Cuento>(
    `SELECT * FROM cuentos WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId]
  )
}

export async function crearCuento(usuarioId: number, titulo: string, contenido: string, publicado: boolean): Promise<number> {
  const res = await execute(
    `INSERT INTO cuentos (usuario_id, titulo, contenido, publicado) VALUES (?, ?, ?, ?)`,
    [usuarioId, titulo, contenido, publicado ? 1 : 0]
  )
  return res.insertId
}

export async function actualizarCuento(id: number, usuarioId: number, titulo: string, contenido: string, publicado: boolean): Promise<boolean> {
  const res = await execute(
    `UPDATE cuentos SET titulo = ?, contenido = ?, publicado = ? WHERE id = ? AND usuario_id = ?`,
    [titulo, contenido, publicado ? 1 : 0, id, usuarioId]
  )
  return res.affectedRows > 0
}

export async function eliminarCuento(id: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    `DELETE FROM cuentos WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId]
  )
  return res.affectedRows > 0
}
