import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as intercambioDAO from '@/lib/dao/intercambioDAO'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const result = await intercambioDAO.aceptar(Number(params.id), user.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
