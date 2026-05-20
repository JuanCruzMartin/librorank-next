import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as libroDAO from '@/lib/dao/libroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [generos, moods, paginas, autorMasLeido, mejorCalificado, stats] = await Promise.all([
    libroDAO.obtenerConteoPorGenero(user.id),
    libroDAO.obtenerConteoPorMood(user.id),
    libroDAO.sumarPaginasLeidas(user.id),
    libroDAO.obtenerAutorMasLeido(user.id),
    libroDAO.obtenerMejorCalificado(user.id),
    libroDAO.obtenerStatsPorUsuario(user.id),
  ])

  return NextResponse.json({ generos, moods, paginas, autorMasLeido, mejorCalificado, stats })
}
