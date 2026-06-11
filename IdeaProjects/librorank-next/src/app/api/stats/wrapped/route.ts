import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS = ['','Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function generarFrase(total: number, paginas: number, autores: { autor: string }[]): string {
  if (total === 0) return '¡Este año todavía no empezaste! Hay tiempo. 📚'
  if (total === 1) return `Un libro es un comienzo. ¡El próximo año vas por más! 🌱`
  if (total >= 50) return `¡${total} libros! Sos una leyenda de la lectura. 🏆`
  if (total >= 30) return `${total} libros este año. Tenés una dedicación admirable. ⭐`
  if (total >= 20) return `${total} libros. La lectura es claramente tu superpoder. 🦸`
  if (total >= 10) return `${total} libros en un año. ¡Nada mal para un lector serio! 📖`
  if (paginas >= 3000) return `Pocos libros, pero ${paginas.toLocaleString()} páginas. Calidad sobre cantidad. 🎯`
  if (autores.length >= 3) return `${total} libros de ${autores.length} autores distintos. Te gusta explorar. 🗺️`
  return `${total} libros leídos. Cada página cuenta. 💪`
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const uid = user.id
  const anio = new Date().getFullYear()

  const [
    resumen, generos, autores, meses, mejorLibro, librosRecientes,
    libroMasLargo, primerLibro, rachaUsuario,
    diaFavoritoRow, anioAnteriorRow, logrosEsteAnio,
  ] = await Promise.all([
    queryOne<{ total: number; paginas: number; promedio: number }>(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(paginas), 0) AS paginas,
        COALESCE(ROUND(AVG(NULLIF(estrellas,0)),1), 0) AS promedio
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
    `, [uid, anio]),

    query<{ genero: string; total: number }>(`
      SELECT genero, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND genero IS NOT NULL AND genero != ''
        AND YEAR(fecha_registro) = ?
      GROUP BY genero ORDER BY total DESC LIMIT 5
    `, [uid, anio]),

    query<{ autor: string; total: number }>(`
      SELECT autor, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      GROUP BY autor ORDER BY total DESC LIMIT 3
    `, [uid, anio]),

    query<{ mes: number; total: number }>(`
      SELECT MONTH(fecha_registro) AS mes, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      GROUP BY mes ORDER BY mes
    `, [uid, anio]),

    queryOne<{ titulo: string; autor: string; estrellas: number; portada_url: string }>(`
      SELECT titulo, autor, estrellas, portada_url
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND estrellas = 5 AND YEAR(fecha_registro) = ?
      ORDER BY fecha_registro DESC LIMIT 1
    `, [uid, anio]),

    query<{ titulo: string; portada_url: string; autor: string }>(`
      SELECT titulo, portada_url, autor
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      ORDER BY fecha_registro DESC LIMIT 6
    `, [uid, anio]),

    queryOne<{ titulo: string; autor: string; paginas: number }>(`
      SELECT titulo, autor, paginas
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND paginas IS NOT NULL AND paginas > 0
        AND YEAR(fecha_registro) = ?
      ORDER BY paginas DESC LIMIT 1
    `, [uid, anio]),

    queryOne<{ titulo: string; autor: string; portada_url: string }>(`
      SELECT titulo, autor, portada_url
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      ORDER BY fecha_registro ASC LIMIT 1
    `, [uid, anio]),

    queryOne<{ racha_actual: number; objetivo_anual: number | null }>(`
      SELECT racha_actual, objetivo_anual FROM usuarios WHERE id = ?
    `, [uid]),

    // Día de la semana favorito (DAYOFWEEK: 1=Dom, 2=Lun, ..., 7=Sáb)
    queryOne<{ dia: number; total: number }>(`
      SELECT DAYOFWEEK(fecha_registro) AS dia, COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
      GROUP BY dia ORDER BY total DESC LIMIT 1
    `, [uid, anio]),

    // Libros leídos el año anterior
    queryOne<{ total: number }>(`
      SELECT COUNT(*) AS total
      FROM libros_usuario
      WHERE usuario_id = ? AND UPPER(estado) IN ('LEIDO','LEÍDO')
        AND YEAR(fecha_registro) = ?
    `, [uid, anio - 1]),

    // Logros desbloqueados este año
    queryOne<{ total: number }>(`
      SELECT COUNT(*) AS total
      FROM usuario_logros
      WHERE usuario_id = ? AND YEAR(fecha_desbloqueo) = ?
    `, [uid, anio]),
  ])

  const mesMasActivo = meses.length > 0
    ? meses.reduce((a, b) => a.total > b.total ? a : b)
    : null

  const mesesCompletos = Array.from({ length: 12 }, (_, i) => ({
    mes: MESES[i],
    total: meses.find(m => m.mes === i + 1)?.total ?? 0,
  }))

  const hoy = new Date()
  const inicioAnio = new Date(anio, 0, 1)
  const diasTranscurridos = Math.max(1, Math.floor((hoy.getTime() - inicioAnio.getTime()) / 86400000))
  const paginasPorDia = resumen && resumen.paginas > 0
    ? Math.round(resumen.paginas / diasTranscurridos)
    : 0

  const totalActual = resumen?.total ?? 0
  const totalAnterior = Number(anioAnteriorRow?.total ?? 0)
  const diferencia = totalActual - totalAnterior

  const objetivoAnual = rachaUsuario?.objetivo_anual ?? null
  const progresoObjetivo = objetivoAnual && objetivoAnual > 0
    ? Math.min(100, Math.round((totalActual / objetivoAnual) * 100))
    : null

  return NextResponse.json({
    anio,
    resumen: resumen ?? { total: 0, paginas: 0, promedio: 0 },
    generos,
    autores,
    meses: mesesCompletos,
    mesMasActivo: mesMasActivo ? { ...mesMasActivo, nombre: MESES[mesMasActivo.mes - 1] } : null,
    mejorLibro,
    librosRecientes,
    libroMasLargo: libroMasLargo ?? null,
    primerLibro: primerLibro ?? null,
    rachaActual: rachaUsuario?.racha_actual ?? 0,
    paginasPorDia,
    diaFavorito: diaFavoritoRow ? { dia: DIAS[diaFavoritoRow.dia] ?? '—', total: diaFavoritoRow.total } : null,
    anioAnterior: { total: totalAnterior, diferencia },
    objetivoAnual,
    progresoObjetivo,
    logrosEsteAnio: Number(logrosEsteAnio?.total ?? 0),
    frase: generarFrase(totalActual, resumen?.paginas ?? 0, autores),
  })
}
