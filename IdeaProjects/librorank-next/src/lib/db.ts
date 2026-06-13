import mysql from 'mysql2/promise'

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const
for (const v of requiredEnvVars) {
  if (!process.env[v]) throw new Error(`Variable de entorno faltante: ${v}. Configurala en Vercel o en .env.local.`)
}

// Pool singleton — se crea una vez por proceso y se reutiliza entre requests
// Evita abrir/cerrar una conexión nueva en cada query (costoso en Vercel/Railway)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  timezone: '+00:00',
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Mantenemos getConnection() para compatibilidad con transaction()
export async function getConnection() {
  return pool.getConnection()
}

function sanitizeParams(params?: unknown[]): unknown[] {
  if (!params) return []
  return params.map(p => (p === undefined ? null : p))
}

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await pool.query(sql, sanitizeParams(params))
  return rows as T[]
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId: number }> {
  const [result] = await pool.query(sql, sanitizeParams(params))
  return result as { affectedRows: number; insertId: number }
}

export async function transactionQuery(conn: mysql.PoolConnection, sql: string, params?: unknown[]) {
  const [result] = await conn.query(sql, sanitizeParams(params))
  return result
}

export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection()
  await conn.beginTransaction()
  try {
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release() // devuelve la conexión al pool, no la cierra
  }
}
