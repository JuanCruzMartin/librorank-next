import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json([])

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10${apiKey ? `&key=${apiKey}` : ''}`
    const res = await fetch(url)
    const data = await res.json()

    const mapearGenero = (categories: string[]): string => {
      const texto = categories.join(' ').toLowerCase()
      if (texto.includes('fantas') || texto.includes('fantasy')) return 'Fantasía'
      if (texto.includes('science fiction') || texto.includes('ciencia ficcion') || texto.includes('sci-fi')) return 'Ciencia Ficción'
      if (texto.includes('romance') || texto.includes('love stories')) return 'Romance'
      if (texto.includes('terror') || texto.includes('horror') || texto.includes('thriller')) return 'Terror'
      if (texto.includes('mystery') || texto.includes('misterio') || texto.includes('detective') || texto.includes('crime')) return 'Misterio'
      if (texto.includes('histor') || texto.includes('history')) return 'Historia'
      if (texto.includes('biograph') || texto.includes('autobio') || texto.includes('memoir') || texto.includes('biografia')) return 'Biografía'
      if (texto.includes('self-help') || texto.includes('personal development') || texto.includes('autoayuda') || texto.includes('motivat')) return 'Autoayuda'
      if (texto.includes('poet') || texto.includes('poesia') || texto.includes('verse')) return 'Poesía'
      return 'Otro'
    }

    const items = (data.items || []).map((item: {
      id: string;
      volumeInfo: {
        title?: string;
        authors?: string[];
        publishedDate?: string;
        pageCount?: number;
        imageLinks?: { thumbnail?: string };
        categories?: string[];
      }
    }) => ({
      id: item.id,
      titulo: item.volumeInfo.title || '',
      autor: (item.volumeInfo.authors || []).join(', '),
      anio: item.volumeInfo.publishedDate?.split('-')[0] || '',
      paginas: item.volumeInfo.pageCount || '',
      portada: (item.volumeInfo.imageLinks?.thumbnail || '').replace('http://', 'https://'),
      genero: item.volumeInfo.categories?.length ? mapearGenero(item.volumeInfo.categories) : '',
    }))

    return NextResponse.json(items)
  } catch (err) {
    console.error('Error buscando libros:', err)
    return NextResponse.json([])
  }
}
