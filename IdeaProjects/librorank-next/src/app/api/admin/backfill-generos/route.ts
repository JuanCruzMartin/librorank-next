import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { mapearGeneroGoogle } from '@/lib/generos'

const GOOGLE_API = 'https://www.googleapis.com/books/v1/volumes'
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY

async function buscarGeneroEnGoogle(titulo: string, autor: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`intitle:${titulo} inauthor:${autor}`)
    const url = `${GOOGLE_API}?q=${q}&maxResults=1&fields=items/volumeInfo/categories&key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()
    const categories: string[] = data?.items?.[0]?.volumeInfo?.categories ?? []
    if (categories.length === 0) return null
    const genero = mapearGeneroGoogle(categories)
    return genero === 'Otro' ? null : genero
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { secret } = await req.json()

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener libros sin género (únicos por título+autor)
  const libros = await query<{ titulo: string; autor: string; ids: string }>(
    `SELECT titulo, autor, GROUP_CONCAT(id) as ids
     FROM libros_usuario
     WHERE (genero IS NULL OR genero = '')
     GROUP BY titulo, autor
     ORDER BY COUNT(*) DESC
     LIMIT 200`
  )

  if (libros.length === 0) {
    return NextResponse.json({ ok: true, actualizados: 0, mensaje: 'Todos los libros ya tienen género' })
  }

  let actualizados = 0
  let sinDatos = 0
  const resultados: { titulo: string; genero: string | null }[] = []

  for (const libro of libros) {
    const genero = await buscarGeneroEnGoogle(libro.titulo, libro.autor)
    if (genero) {
      const ids = libro.ids.split(',').map(Number)
      await execute(
        `UPDATE libros_usuario SET genero = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
        [genero, ...ids]
      )
      actualizados += ids.length
      resultados.push({ titulo: libro.titulo, genero })
    } else {
      sinDatos++
    }
    // Pequeña pausa para no saturar la API de Google
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({
    ok: true,
    actualizados,
    sinDatos,
    mensaje: `${actualizados} libros actualizados, ${sinDatos} sin datos en Google Books`,
    detalle: resultados,
  })
}
