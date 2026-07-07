import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as intercambioDAO from '@/lib/dao/intercambioDAO'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const ok = await intercambioDAO.cancelar(Number(params.id), user.id)
  if (!ok) return NextResponse.json({ error: 'No se pudo cancelar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
