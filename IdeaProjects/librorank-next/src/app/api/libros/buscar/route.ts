import { NextRequest, NextResponse } from 'next/server'
import { mapearGeneroGoogle } from '@/lib/generos'

interface ResultadoBusqueda {
  id: string
  titulo: string
  autor: string
  anio: string
  paginas: string | number
  portada: string
  genero: string
  fuente?: 'google' | 'openlibrary'
}

async function buscarEnGoogle(q: string): Promise<ResultadoBusqueda[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&langRestrict=es${apiKey ? `&key=${apiKey}` : ''}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  const data = await res.json()

  return (data.items || []).map((item: {
    id: string
    volumeInfo: {
      title?: string
      authors?: string[]
      publishedDate?: string
      pageCount?: number
      imageLinks?: { thumbnail?: string }
      categories?: string[]
    }
  }) => ({
    id: `g_${item.id}`,
    titulo: item.volumeInfo.title || '',
    autor: (item.volumeInfo.authors || []).join(', '),
    anio: item.volumeInfo.publishedDate?.split('-')[0] || '',
    paginas: item.volumeInfo.pageCount || '',
    portada: (item.volumeInfo.imageLinks?.thumbnail || '').replace('http://', 'https://'),
    genero: item.volumeInfo.categories?.length ? mapearGeneroGoogle(item.volumeInfo.categories) : '',
    fuente: 'google' as const,
  }))
}

async function buscarEnOpenLibrary(q: string): Promise<ResultadoBusqueda[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&language=spa`
  const res = await fetch(url, { next: { revalidate: 300 } })
  const data = await res.json()

  return (data.docs || [])
    .filter((doc: { title?: string }) => doc.title)
    .map((doc: {
      key?: string
      title?: string
      author_name?: string[]
      first_publish_year?: number
      number_of_pages_median?: number
      cover_i?: number
      subject?: string[]
    }) => ({
      id: `ol_${(doc.key || '').replace('/works/', '')}`,
      titulo: doc.title || '',
      autor: (doc.author_name || []).slice(0, 2).join(', '),
      anio: doc.first_publish_year ? String(doc.first_publish_year) : '',
      paginas: doc.number_of_pages_median || '',
      portada: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
      genero: doc.subject?.length ? mapearGeneroGoogle(doc.subject.slice(0, 3)) : '',
      fuente: 'openlibrary' as const,
    }))
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json([])

  try {
    // Primero probamos Google Books
    const googleResults = await buscarEnGoogle(q)

    // Si Google devuelve resultados, los usamos
    if (googleResults.length > 0) {
      return NextResponse.json(googleResults)
    }

    // Fallback: Open Library (especialmente útil para libros en español)
    const olResults = await buscarEnOpenLibrary(q)
    return NextResponse.json(olResults)

  } catch (err) {
    console.error('Error buscando libros:', err)
    // Intentar Open Library si Google falla
    try {
      const olResults = await buscarEnOpenLibrary(q)
      return NextResponse.json(olResults)
    } catch {
      return NextResponse.json([])
    }
  }
}
