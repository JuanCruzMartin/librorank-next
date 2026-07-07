import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as cartaDAO from '@/lib/dao/cartaDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const usuarioId = Number(req.nextUrl.searchParams.get('usuarioId'))
  if (!usuarioId) return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 })

  const coleccion = await cartaDAO.obtenerColeccion(usuarioId)
  return NextResponse.json(coleccion)
}
