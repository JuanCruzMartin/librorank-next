import mysql from 'mysql2/promise'

export async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'libreria',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    timezone: '+00:00',
    connectTimeout: 10000,
  })
}

function sanitizeParams(params?: unknown[]): unknown[] {
  if (!params) return []
  return params.map(p => (p === undefined ? null : p))
}

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.query(sql, sanitizeParams(params))
    return rows as T[]
  } finally {
    await conn.end()
  }
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId: number }> {
  const conn = await getConnection()
  try {
    const [result] = await conn.query(sql, sanitizeParams(params))
    return result as { affectedRows: number; insertId: number }
  } finally {
    await conn.end()
  }
}

export async function transactionQuery(conn: mysql.Connection, sql: string, params?: unknown[]) {
  const [result] = await conn.query(sql, sanitizeParams(params))
  return result
}

export async function transaction<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T> {
  const conn = await getConnection()
  await conn.beginTransaction()
  try {
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    await conn.end()
  }
}
