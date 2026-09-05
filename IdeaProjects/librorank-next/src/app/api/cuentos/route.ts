import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as dao from '@/lib/dao/cuentoPersonalDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const cuentos = await dao.obtenerMisCuentos(user.id)
  return NextResponse.json({ cuentos })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { titulo, contenido, publicado = true } = await req.json()

  if (!contenido || contenido.trim().length === 0)
    return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 })
  if (contenido.length > 20000)
    return NextResponse.json({ error: 'Máximo 20.000 caracteres' }, { status: 400 })

  const id = await dao.crearCuento(user.id, titulo?.trim() || 'Sin título', contenido.trim(), publicado)
  return NextResponse.json({ id })
}
