import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import * as cartaDAO from '@/lib/dao/cartaDAO'

export async function POST() {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const resultado = await cartaDAO.verificarTiradaDiaria(authUser.id)
  return NextResponse.json(resultado)
}
