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
  fuente?: 'google' | 'openlibrary' | 'mercadolibre'
}

// ── Mercado Libre token cache ──────────────────────────────────────────────
const g = global as unknown as { _mlToken?: string; _mlTokenExp?: number }

async function getMlToken(): Promise<string | null> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (g._mlToken && g._mlTokenExp && Date.now() < g._mlTokenExp) return g._mlToken

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  g._mlToken = data.access_token
  g._mlTokenExp = Date.now() + (data.expires_in - 60) * 1000
  return g._mlToken ?? null
}

async function buscarIsbnEnML(isbn: string): Promise<ResultadoBusqueda | null> {
  try {
    const token = await getMlToken()
    if (!token) return null

    const res = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?q=${isbn}&category=MLA1743&limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.results?.[0]
    if (!item) return null

    // Atributos estructurados del ítem (autor, editorial, etc.)
    const attrs: { id: string; value_name?: string }[] = item.attributes || []
    const attr = (id: string) => attrs.find(a => a.id === id)?.value_name || ''

    const autor = attr('AUTHOR') || attr('BRAND')
    const anio = attr('PUBLICATION_YEAR') || ''

    // El título en ML suele ser "Libro De Ejemplo - Autor - Editorial"
    // Extraemos solo la primera parte antes del primer " - "
    const tituloRaw: string = item.title || ''
    const partes = tituloRaw.split(/\s+-\s+/)
    const titulo = partes[0]?.trim() || tituloRaw

    // Portada: ML devuelve thumbnail de baja calidad; intentamos versión grande
    const thumb: string = item.thumbnail || ''
    const portada = thumb.replace('-I.jpg', '-O.jpg').replace('http://', 'https://')

    return {
      id: `ml_${item.id}`,
      titulo,
      autor,
      anio,
      paginas: '',
      portada,
      genero: '',
      fuente: 'mercadolibre' as const,
    }
  } catch {
    return null
  }
}

async function buscarEnGoogle(q: string, esBusquedaIsbn = false): Promise<ResultadoBusqueda[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  // No restringir por idioma cuando buscamos por ISBN: el ISBN es único y langRestrict filtra resultados válidos
  const langParam = esBusquedaIsbn ? '' : '&langRestrict=es'
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10${langParam}${apiKey ? `&key=${apiKey}` : ''}`
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

async function buscarIsbnEnOpenLibrary(isbn: string): Promise<ResultadoBusqueda | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null
    const coverId = book.cover?.medium || book.cover?.large || book.cover?.small || ''
    return {
      id: `ol_isbn_${isbn}`,
      titulo: book.title || '',
      autor: (book.authors || []).map((a: { name: string }) => a.name).slice(0, 2).join(', '),
      anio: book.publish_date ? book.publish_date.match(/\d{4}/)?.[0] || '' : '',
      paginas: book.number_of_pages || '',
      portada: coverId,
      genero: book.subjects?.length ? mapearGeneroGoogle(book.subjects.slice(0, 3).map((s: { name?: string } | string) => typeof s === 'string' ? s : s.name || '')) : '',
      fuente: 'openlibrary' as const,
    }
  } catch {
    return null
  }
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

  const isbnMatch = q.match(/(?:isbn[:\s]*)?(\d{10,13})/i)
  const esIsbn = isbnMatch != null

  try {
    if (esIsbn) {
      const isbn = isbnMatch![1]
      // 1º: Google Books + Open Library ISBN directo en paralelo
      const [googleResults, olDirect] = await Promise.all([
        buscarEnGoogle(`isbn:${isbn}`, true),
        buscarIsbnEnOpenLibrary(isbn),
      ])
      if (googleResults.length > 0) return NextResponse.json(googleResults)
      if (olDirect) return NextResponse.json([olDirect])

      // 2º: Mercado Libre Argentina (cubre ediciones locales con ISBN 950/987)
      const mlResult = await buscarIsbnEnML(isbn)
      if (mlResult) {
        // Con el título de ML, buscamos en Google/OL para enriquecer con portada y metadata
        if (mlResult.titulo) {
          const [gEnrich, olEnrich] = await Promise.all([
            buscarEnGoogle(mlResult.titulo, false),
            buscarEnOpenLibrary(mlResult.titulo),
          ])
          // Tomamos el primer resultado enriquecido cuyo título se parezca al de ML
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
          const tituloNorm = normalize(mlResult.titulo)
          const enriched = [...gEnrich, ...olEnrich].find(
            r => normalize(r.titulo).includes(tituloNorm.slice(0, 10)) || tituloNorm.includes(normalize(r.titulo).slice(0, 10))
          )
          if (enriched) return NextResponse.json([enriched])
        }
        // Si no hay resultado enriquecido, devolvemos el de ML tal cual
        return NextResponse.json([mlResult])
      }

      // 3º: búsqueda general con el ISBN como texto
      const olGeneral = await buscarEnOpenLibrary(isbn)
      return NextResponse.json(olGeneral)
    }

    // Búsqueda normal: Google y Open Library en paralelo, se mezclan los resultados
    const [googleResults, olResults] = await Promise.all([
      buscarEnGoogle(q),
      buscarEnOpenLibrary(q),
    ])
    // Preferimos resultados de Google, pero completamos con OL si Google devuelve pocos
    const vistos = new Set(googleResults.map(r => r.titulo.toLowerCase().trim()))
    const olNuevos = olResults.filter(r => !vistos.has(r.titulo.toLowerCase().trim()))
    return NextResponse.json([...googleResults, ...olNuevos].slice(0, 12))

  } catch (err) {
    console.error('Error buscando libros:', err)
    try {
      const olResults = await buscarEnOpenLibrary(q)
      return NextResponse.json(olResults)
    } catch {
      return NextResponse.json([])
    }
  }
}
