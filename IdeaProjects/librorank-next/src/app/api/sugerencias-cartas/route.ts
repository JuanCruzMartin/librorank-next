import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { buscarPorEmailOUsername, buscarPorId } from '@/lib/dao/usuarioDAO'
import { crearTabla, enviarMensaje } from '@/lib/dao/mensajeDAO'

const OWNER_EMAIL = 'juancmartin96@gmail.com'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { sugerencia } = await req.json()
  if (!sugerencia?.trim()) return NextResponse.json({ error: 'Falta sugerencia' }, { status: 400 })

  const owner = await buscarPorEmailOUsername(OWNER_EMAIL)
  if (!owner) return NextResponse.json({ error: 'Owner no encontrado' }, { status: 500 })

  // No enviar si el owner se sugiere a sí mismo
  if (user.id === owner.id) return NextResponse.json({ ok: true })

  const remitente = await buscarPorId(user.id)
  const texto = `📚 Sugerencia de colección de cartas:\n"${sugerencia.trim()}"`

  await crearTabla()
  await enviarMensaje(user.id, owner.id, texto)

  return NextResponse.json({ ok: true })
}
