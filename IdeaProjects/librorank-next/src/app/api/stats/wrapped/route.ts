import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const uid = user.id
  const anio = new Date().getFullYear()

  const [resumen, generos, autores, meses, mejorLibro, librosRecientes] = await Promise.all([
    // Totales del año
    queryOne<{ total: number; paginas: number; promedio: number }>(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(paginas), 0) AS paginas,
        COALESCE(ROUND(AVG(NULLIF(estrellas,0)),1), 0) AS promedio
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
    `, [uid, anio]),

    // Top géneros
    query<{ genero: string; total: number }>(`
      SELECT genero, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND genero IS NOT NULL AND genero != ''
        AND YEAR(fecha_registro) = ?
      GROUP BY genero ORDER BY total DESC LIMIT 5
    `, [uid, anio]),

    // Top autores
    query<{ autor: string; total: number }>(`
      SELECT autor, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      GROUP BY autor ORDER BY total DESC LIMIT 3
    `, [uid, anio]),

    // Lecturas por mes
    query<{ mes: number; total: number }>(`
      SELECT MONTH(fecha_registro) AS mes, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      GROUP BY mes ORDER BY mes
    `, [uid, anio]),

    // Mejor libro calificado
    queryOne<{ titulo: string; autor: string; estrellas: number; portada_url: string }>(`
      SELECT titulo, autor, estrellas, portada_url
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND estrellas = 5 AND YEAR(fecha_registro) = ?
      ORDER BY fecha_registro DESC LIMIT 1
    `, [uid, anio]),

    // Últimos 5 leídos del año
    query<{ titulo: string; portada_url: string; autor: string }>(`
      SELECT titulo, portada_url, autor
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      ORDER BY fecha_registro DESC LIMIT 6
    `, [uid, anio]),
  ])

  // Mes más activo
  const mesMasActivo = meses.length > 0
    ? meses.reduce((a, b) => a.total > b.total ? a : b)
    : null

  // Meses completos para el gráfico de barras (12 meses)
  const mesesCompletos = Array.from({ length: 12 }, (_, i) => ({
    mes: MESES[i],
    total: meses.find(m => m.mes === i + 1)?.total ?? 0,
  }))

  return NextResponse.json({
    anio,
    resumen: resumen ?? { total: 0, paginas: 0, promedio: 0 },
    generos,
    autores,
    meses: mesesCompletos,
    mesMasActivo: mesMasActivo ? { ...mesMasActivo, nombre: MESES[mesMasActivo.mes - 1] } : null,
    mejorLibro,
    librosRecientes,
  })
}
