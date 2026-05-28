import { NextRequest, NextResponse } from 'next/server'
import { mapearGeneroGoogle } from '@/lib/generos'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json([])

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10${apiKey ? `&key=${apiKey}` : ''}`
    const res = await fetch(url)
    const data = await res.json()

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
      genero: item.volumeInfo.categories?.length ? mapearGeneroGoogle(item.volumeInfo.categories) : '',
    }))

    return NextResponse.json(items)
  } catch (err) {
    console.error('Error buscando libros:', err)
    return NextResponse.json([])
  }
}
