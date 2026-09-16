import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { mapearGeneroGoogle } from '@/lib/generos'

interface LibroExterno {
  titulo: string
  autor: string
  anio: string
  paginas: string | number
  portada: string
  genero: string
  descripcion: string
}

interface ReviewDB {
  resena: string
  estrellas: number
  username: string
}

interface DistribucionDB {
  estrellas: number
  cantidad: number
}

async function buscarEnGooglePorIsbn(isbn: string): Promise<LibroExterno | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1${apiKey ? `&key=${apiKey}` : ''}`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null
    const v = item.volumeInfo
    return {
      titulo: v.title || '',
      autor: (v.authors || []).join(', '),
      anio: v.publishedDate?.split('-')[0] || '',
      paginas: v.pageCount || '',
      portada: (v.imageLinks?.thumbnail || '').replace('http://', 'https://').replace('zoom=1', 'zoom=3'),
      genero: v.categories?.length ? mapearGeneroGoogle(v.categories) : '',
      descripcion: v.description || '',
    }
  } catch {
    return null
  }
}

async function buscarEnOpenLibraryPorIsbn(isbn: string): Promise<LibroExterno | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null
    const coverId = book.cover?.large || book.cover?.medium || book.cover?.small || ''
    return {
      titulo: book.title || '',
      autor: (book.authors || []).map((a: { name: string }) => a.name).slice(0, 2).join(', '),
      anio: book.publish_date?.match(/\d{4}/)?.[0] || '',
      paginas: book.number_of_pages || '',
      portada: coverId,
      genero: '',
      descripcion: book.excerpts?.[0]?.text || '',
    }
  } catch {
    return null
  }
}

async function buscarComunidadPorTituloAutor(titulo: string, autor: string) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const tNorm = normalize(titulo).slice(0, 12)
  const aNorm = normalize(autor).slice(0, 10)

  // Buscar en libros_global por título aproximado
  const globalRow = await queryOne<{ id: number; nota_media: number; total_lectores: number }>(
    `SELECT lg.id,
            COALESCE(AVG(NULLIF(lu.estrellas, 0)), 0) AS nota_media,
            COUNT(lu.id) AS total_lectores
     FROM libros_global lg
     LEFT JOIN libros_usuario lu ON lu.libro_global_id = lg.id
     WHERE LOWER(REPLACE(REPLACE(lg.titulo, ' ', ''), '-', '')) LIKE ?
       AND LOWER(REPLACE(REPLACE(lg.autor, ' ', ''), '-', '')) LIKE ?
     GROUP BY lg.id
     LIMIT 1`,
    [`%${tNorm}%`, `%${aNorm}%`]
  )

  if (!globalRow) return { nota_media: 0, total_lectores: 0, reviews: [], distribucion: [] }

  const [reviews, distribucion] = await Promise.all([
    query<ReviewDB>(
      `SELECT lu.resena, lu.estrellas, u.username
       FROM libros_usuario lu JOIN usuarios u ON lu.usuario_id = u.id
       WHERE lu.libro_global_id = ? AND lu.resena IS NOT NULL AND lu.resena != ''
       ORDER BY lu.id DESC LIMIT 10`,
      [globalRow.id]
    ),
    query<DistribucionDB>(
      `SELECT estrellas, COUNT(*) AS cantidad
       FROM libros_usuario
       WHERE libro_global_id = ? AND estrellas > 0
       GROUP BY estrellas ORDER BY estrellas DESC`,
      [globalRow.id]
    ),
  ])

  return {
    nota_media: Math.round((globalRow.nota_media || 0) * 10) / 10,
    total_lectores: globalRow.total_lectores || 0,
    reviews,
    distribucion,
  }
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn')
  if (!isbn) return NextResponse.json({ error: 'isbn requerido' }, { status: 400 })

  const [google, ol] = await Promise.all([
    buscarEnGooglePorIsbn(isbn),
    buscarEnOpenLibraryPorIsbn(isbn),
  ])

  const libro = google || ol
  if (!libro) return NextResponse.json({ error: 'libro_no_encontrado' }, { status: 404 })

  // Preferir portada de Open Library si Google no tiene (suele ser mejor calidad)
  if (!libro.portada && ol?.portada) libro.portada = ol.portada
  if (!libro.descripcion && ol?.descripcion) libro.descripcion = ol.descripcion

  const comunidad = await buscarComunidadPorTituloAutor(libro.titulo, libro.autor)

  return NextResponse.json({ libro, comunidad })
}
