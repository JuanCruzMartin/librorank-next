import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { buscarPorIsbn } from '@/lib/dao/libroGlobalDAO'

interface ReviewDB {
  resena: string
  estrellas: number
  username: string
}

interface DistribucionDB {
  estrellas: number
  cantidad: number
}

async function getComunidadPorGlobalId(globalId: number) {
  const [reviews, distribucion] = await Promise.all([
    query<ReviewDB>(
      `SELECT lu.resena, lu.estrellas, u.username
       FROM libros_usuario lu JOIN usuarios u ON lu.usuario_id = u.id
       WHERE lu.libro_global_id = ? AND lu.resena IS NOT NULL AND lu.resena != ''
       ORDER BY lu.id DESC LIMIT 10`,
      [globalId]
    ),
    query<DistribucionDB>(
      `SELECT estrellas, COUNT(*) AS cantidad
       FROM libros_usuario
       WHERE libro_global_id = ? AND estrellas > 0
       GROUP BY estrellas ORDER BY estrellas DESC`,
      [globalId]
    ),
  ])
  return { reviews, distribucion }
}

async function buscarComunidadPorTituloAutor(titulo: string, autor: string) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const tNorm = normalize(titulo).slice(0, 12)
  const aNorm = normalize(autor).slice(0, 10)

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

  const { reviews, distribucion } = await getComunidadPorGlobalId(globalRow.id)
  return {
    nota_media: Math.round((globalRow.nota_media || 0) * 10) / 10,
    total_lectores: globalRow.total_lectores || 0,
    reviews,
    distribucion,
  }
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn')
  const titulo = req.nextUrl.searchParams.get('titulo')
  const autor = req.nextUrl.searchParams.get('autor')

  // Búsqueda por ISBN en nuestra propia DB (catálogo construido por usuarios argentinos)
  if (isbn) {
    const dbRow = await buscarPorIsbn(isbn)
    if (!dbRow) return NextResponse.json({ error: 'not_in_db' }, { status: 404 })

    const { reviews, distribucion } = await getComunidadPorGlobalId(dbRow.id)
    return NextResponse.json({
      libro: {
        titulo: dbRow.titulo,
        autor: dbRow.autor,
        anio: dbRow.anio ? String(dbRow.anio) : '',
        paginas: dbRow.paginas || '',
        portada: dbRow.portada_url || '',
        genero: '',
        descripcion: '',
      },
      comunidad: {
        nota_media: Math.round((dbRow.nota_media || 0) * 10) / 10,
        total_lectores: dbRow.total_lectores || 0,
        reviews,
        distribucion,
      },
    })
  }

  // Búsqueda por título+autor (para stats de comunidad cuando el libro viene de APIs externas)
  if (!titulo || !autor) return NextResponse.json({ error: 'isbn, titulo o autor requeridos' }, { status: 400 })
  const comunidad = await buscarComunidadPorTituloAutor(titulo, autor)
  return NextResponse.json(comunidad)
}
