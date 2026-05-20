import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { buscarPorId as buscarLibroGlobal, obtenerReviews } from '@/lib/dao/libroGlobalDAO'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const libroGlobal = await buscarLibroGlobal(Number(id))
  if (!libroGlobal) return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })

  const reviews = await obtenerReviews(Number(id))
  return NextResponse.json({ libroGlobal, reviews })
}
