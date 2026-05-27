import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as notifDAO from '@/lib/dao/notificacionDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const notificaciones = await notifDAO.obtenerRecientes(user.id, 20)
  const total_no_leidas = notificaciones.filter(n => !n.leido).length

  return NextResponse.json({ notificaciones, total_no_leidas })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { accion, id } = await req.json()

  if (accion === 'leerTodas') {
    await notifDAO.marcarTodasLeidas(user.id)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'leer' && id) {
    await notifDAO.marcarLeida(user.id, Number(id))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
