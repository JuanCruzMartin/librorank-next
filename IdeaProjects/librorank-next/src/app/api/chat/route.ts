import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import {
  crearTabla, enviarMensaje, obtenerMensajes,
  marcarLeidos, obtenerConversaciones, obtenerMensajesDesdeid, contarNoLeidos,
} from '@/lib/dao/mensajeDAO'
import { buscarPorId } from '@/lib/dao/usuarioDAO'

async function init() { await crearTabla() }

// GET /api/chat?tipo=conversaciones
// GET /api/chat?tipo=mensajes&con=userId&desdeId=N
export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await init()

  const tipo = req.nextUrl.searchParams.get('tipo')

  if (tipo === 'noLeidos') {
    const count = await contarNoLeidos(user.id)
    return NextResponse.json({ count })
  }

  if (tipo === 'conversaciones') {
    const convos = await obtenerConversaciones(user.id)
    return NextResponse.json({ conversaciones: convos })
  }

  if (tipo === 'mensajes') {
    const conId = Number(req.nextUrl.searchParams.get('con'))
    const desdeId = Number(req.nextUrl.searchParams.get('desdeId') || '0')
    if (!conId) return NextResponse.json({ error: 'Falta con' }, { status: 400 })

    if (desdeId > 0) {
      // Polling: solo mensajes nuevos
      const nuevos = await obtenerMensajesDesdeid(user.id, conId, desdeId)
      await marcarLeidos(conId, user.id)
      return NextResponse.json({ mensajes: nuevos.reverse() })
    }

    // Carga inicial
    const mensajes = await obtenerMensajes(user.id, conId)
    await marcarLeidos(conId, user.id)
    return NextResponse.json({ mensajes: mensajes.reverse() })
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}

// POST /api/chat  { paraId, texto }
export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { paraId, texto } = await req.json()
  if (!paraId || !texto?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verificar que el destinatario existe
  const destino = await buscarPorId(Number(paraId))
  if (!destino) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await init()
  await enviarMensaje(user.id, Number(paraId), texto)

  return NextResponse.json({ ok: true })
}
