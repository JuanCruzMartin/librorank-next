import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { tirarCarta } from '@/lib/cartas'
import * as cartaDAO from '@/lib/dao/cartaDAO'

export async function POST() {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usada = await cartaDAO.usarTirada(authUser.id)
  if (!usada) return NextResponse.json({ error: 'Sin tiradas disponibles' }, { status: 400 })

  const carta = tirarCarta()
  const esNueva = await cartaDAO.agregarCarta(authUser.id, carta.id)

  return NextResponse.json({ carta, esNueva })
}
