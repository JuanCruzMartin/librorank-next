import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as bingoDAO from '@/lib/dao/bingoDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import { registrar as registrarActividad } from '@/lib/dao/actividadDAO'
import { verificarLogros } from '@/lib/dao/logroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [bingo, misLibros] = await Promise.all([
    bingoDAO.obtenerBingo(user.id),
    libroDAO.buscarPorUsuario(user.id),
  ])

  return NextResponse.json({ bingo, misLibros })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { retoId, libroId } = body

  if (!retoId || !libroId) return NextResponse.json({ error: 'retoId y libroId requeridos' }, { status: 400 })

  const ok = await bingoDAO.marcarCasilla(user.id, Number(retoId), Number(libroId))
  if (ok) {
    await libroDAO.otorgarPuntos(user.id, 25, 'Casilla del bingo completada')
    await registrarActividad(user.id, 'BINGO', Number(retoId), 'Ha completado una casilla del Bingo Lector')
    await verificarLogros(user.id)
  }
  return NextResponse.json({ ok })
}
