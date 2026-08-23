import { query, execute } from '@/lib/db'

export type TipoCofre = 'comun' | 'raro' | 'epico'

export interface Cofre {
  id: number
  usuario_id: number
  tipo: TipoCofre
  abierto: boolean
  created_at: string
}

export async function crearTabla(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS cofres_usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo ENUM('comun','raro','epico') NOT NULL DEFAULT 'comun',
      abierto TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_usuario (usuario_id)
    )
  `, [])
}

export async function otorgarCofre(usuarioId: number, tipo: TipoCofre): Promise<void> {
  await execute(
    'INSERT INTO cofres_usuario (usuario_id, tipo) VALUES (?, ?)',
    [usuarioId, tipo]
  )
}

export async function obtenerCofres(usuarioId: number): Promise<Cofre[]> {
  return query<Cofre>(
    'SELECT * FROM cofres_usuario WHERE usuario_id = ? AND abierto = 0 ORDER BY tipo DESC, created_at ASC',
    [usuarioId]
  )
}

export async function marcarAbierto(cofreId: number, usuarioId: number): Promise<boolean> {
  const res = await execute(
    'UPDATE cofres_usuario SET abierto = 1 WHERE id = ? AND usuario_id = ? AND abierto = 0',
    [cofreId, usuarioId]
  )
  return res.affectedRows > 0
}
