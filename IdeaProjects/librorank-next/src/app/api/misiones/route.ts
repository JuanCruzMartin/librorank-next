import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { obtenerMisionesConProgreso, reclamarMision } from '@/lib/dao/misionDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const misiones = await obtenerMisionesConProgreso(user.id)
  return NextResponse.json(misiones)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { misionKey } = await req.json()
    if (!misionKey) return NextResponse.json({ error: 'misionKey requerido' }, { status: 400 })

    const resultado = await reclamarMision(user.id, misionKey)
    return NextResponse.json(resultado)
  } catch (err) {
    console.error('Error en /api/misiones:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
