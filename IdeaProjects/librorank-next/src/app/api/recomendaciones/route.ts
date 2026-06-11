import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { obtenerConteoPorGenero, buscarPorUsuario, obtenerLibrosFavoritos, obtenerLibrosAmigos } from '@/lib/dao/libroDAO'

// Mapeo mood → queries para Google Books
const MOOD_QUERIES: Record<string, string[]> = {
  Relajado:    ['cozy slice of life', 'calming contemporary fiction', 'feel good novels'],
  Aventurero:  ['adventure epic fantasy', 'action thriller', 'exploration survival fiction'],
  Emotivo:     ['emotional literary fiction', 'heartwarming drama', 'moving coming of age'],
  Intelectual: ['philosophy essays', 'science nonfiction', 'historical intellectual fiction'],
  Nostálgico:  ['nostalgic classic literature', 'coming of age memory', 'historical fiction childhood'],
  Inspirador:  ['inspirational biography', 'motivational self help', 'overcoming adversity true story'],
  Oscuro:      ['dark psychological thriller', 'gothic horror mystery', 'noir crime fiction'],
  Divertido:   ['comedy humor fiction', 'witty satire novel', 'funny contemporary fiction'],
}

// Mapeo género de la biblioteca → subject para Google Books API
const GENERO_SUBJECT: Record<string, string> = {
  'Fantasía':       'fantasy',
  'Ciencia Ficción':'science fiction',
  'Romance':        'romance',
  'Terror':         'horror',
  'Misterio':       'mystery',
  'Historia':       'history',
  'Biografía':      'biography',
  'Autoayuda':      'self-help',
  'Poesía':         'poetry',
  'Otro':           'fiction',
}

interface GoogleBookItem {
  id: string
  volumeInfo: {
    title?: string
    authors?: string[]
    description?: string
    publishedDate?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    averageRating?: number
    ratingsCount?: number
    language?: string
  }
}

export interface LibroRecomendado {
  id: string
  titulo: string
  autor: string
  descripcion: string
  anio: string
  paginas: number
  portada: string
  categorias: string[]
  rating: number
  totalRatings: number
}

async function buscarEnGoogleBooks(query: string, apiKey: string): Promise<LibroRecomendado[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&orderBy=relevance&langRestrict=es&key=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()

  return (data.items || [])
    .filter((item: GoogleBookItem) => {
      const v = item.volumeInfo
      return v.title && v.authors?.length && v.imageLinks?.thumbnail
    })
    .map((item: GoogleBookItem) => ({
      id: item.id,
      titulo: item.volumeInfo.title || '',
      autor: (item.volumeInfo.authors || []).join(', '),
      descripcion: item.volumeInfo.description?.slice(0, 200) || '',
      anio: item.volumeInfo.publishedDate?.split('-')[0] || '',
      paginas: item.volumeInfo.pageCount || 0,
      portada: (item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || '').replace('http://', 'https://'),
      categorias: item.volumeInfo.categories || [],
      rating: item.volumeInfo.averageRating || 0,
      totalRatings: item.volumeInfo.ratingsCount || 0,
    }))
}

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const tipo = req.nextUrl.searchParams.get('tipo') || 'mood'
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || ''

  // Libros que el usuario ya tiene (para no recomendarlos)
  const misLibros = await buscarPorUsuario(user.id)
  const titulosYaTengo = new Set(misLibros.map(l => l.titulo.toLowerCase().trim()))

  // ── Sección: Lo que leen tus amigos ──────────────────────────────────────
  if (tipo === 'amigos') {
    const librosAmigos = await obtenerLibrosAmigos(user.id)
    return NextResponse.json({ libros: librosAmigos, tipo: 'amigos' })
  }

  // ── Sección: Basado en tus favoritos (autores de libros ≥4 estrellas) ───
  if (tipo === 'favoritos') {
    const favoritos = await obtenerLibrosFavoritos(user.id)
    if (favoritos.length === 0) {
      return NextResponse.json({ libros: [], tipo: 'favoritos', sinFavoritos: true })
    }

    // Por cada autor único, buscar otros libros suyos en Google Books
    const autoresUnicos = Array.from(new Set(favoritos.map(f => f.autor))).slice(0, 4)
    const queries = autoresUnicos.map(a => `inauthor:"${a}"`)

    // Complementar con géneros de los favoritos
    const generosUnicos = Array.from(new Set(favoritos.map(f => f.genero).filter(Boolean))) as string[]
    if (generosUnicos[0]) {
      const subject = GENERO_SUBJECT[generosUnicos[0]] || 'fiction'
      queries.push(`subject:${subject}`)
    }

    const resultados = await Promise.all(queries.map(q => buscarEnGoogleBooks(q, apiKey)))

    const vistos = new Set<string>()
    const libros: LibroRecomendado[] = []
    for (const lista of resultados) {
      for (const libro of lista) {
        if (vistos.has(libro.id)) continue
        if (titulosYaTengo.has(libro.titulo.toLowerCase().trim())) continue
        vistos.add(libro.id)
        libros.push(libro)
        if (libros.length >= 20) break
      }
      if (libros.length >= 20) break
    }

    return NextResponse.json({ libros, tipo: 'favoritos', autoresBase: autoresUnicos })
  }

  // ── Sección: Por mood (comportamiento original) ──────────────────────────
  const mood = req.nextUrl.searchParams.get('mood') || 'Relajado'

  const generoConteo = await obtenerConteoPorGenero(user.id)
  const topGeneros = Object.entries(generoConteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([g]) => GENERO_SUBJECT[g] || 'fiction')

  const moodQueries = MOOD_QUERIES[mood] || MOOD_QUERIES['Relajado']
  const queries = [moodQueries[0], moodQueries[1]]
  if (topGeneros[0]) queries.push(`subject:${topGeneros[0]} ${moodQueries[0]}`)
  if (topGeneros[1]) queries.push(`subject:${topGeneros[1]}`)

  const resultados = await Promise.all(queries.map(q => buscarEnGoogleBooks(q, apiKey)))

  const vistos = new Set<string>()
  const libros: LibroRecomendado[] = []
  for (const lista of resultados) {
    for (const libro of lista) {
      if (vistos.has(libro.id)) continue
      if (titulosYaTengo.has(libro.titulo.toLowerCase().trim())) continue
      vistos.add(libro.id)
      libros.push(libro)
      if (libros.length >= 20) break
    }
    if (libros.length >= 20) break
  }

  return NextResponse.json({ libros, mood, generosUsuario: topGeneros, tipo: 'mood' })
}
