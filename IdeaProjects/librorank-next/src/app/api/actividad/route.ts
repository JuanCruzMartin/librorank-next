import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { obtenerFeedAmigos, toggleLike, obtenerAutorActividad } from '@/lib/dao/actividadDAO'
import { crearNotificacion } from '@/lib/dao/notificacionDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const feed = await obtenerFeedAmigos(user.id)
  return NextResponse.json(feed)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { actividadId } = body
  if (!actividadId) return NextResponse.json({ error: 'actividadId requerido' }, { status: 400 })

  const liked = await toggleLike(Number(actividadId), user.id)

  // Notificar al dueño del post (fire-and-forget, no bloquea la respuesta)
  if (liked) {
    obtenerAutorActividad(Number(actividadId)).then(autor => {
      if (autor && autor.usuario_id !== user.id) {
        crearNotificacion(
          autor.usuario_id,
          'LIKE',
          `@${user.username} le dio me gusta a tu publicación`,
          { actorUsername: user.username, actorAvatarUrl: user.avatarUrl }
        ).catch(() => {})
      }
    }).catch(() => {})
  }

  return NextResponse.json({ liked })
}
