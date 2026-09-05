import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as dao from '@/lib/dao/cuentoPersonalDAO'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const { titulo, contenido, publicado } = await req.json()

  if (!contenido || contenido.trim().length === 0)
    return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 })

  const ok = await dao.actualizarCuento(Number(id), user.id, titulo?.trim() || 'Sin título', contenido.trim(), publicado ?? true)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const ok = await dao.eliminarCuento(Number(id), user.id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
