import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as amigoDAO from '@/lib/dao/amigoDAO'
import { otorgarPuntos } from '@/lib/dao/libroDAO'
import { registrar as registrarActividad } from '@/lib/dao/actividadDAO'
import { crearNotificacion } from '@/lib/dao/notificacionDAO'
import { verificarLogros } from '@/lib/dao/logroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const buscar = req.nextUrl.searchParams.get('buscar')

  if (buscar) {
    const resultados = await amigoDAO.buscarUsuarios(buscar, user.id)
    return NextResponse.json(resultados)
  }

  const [amigos, sugerencias, todosLectores] = await Promise.all([
    amigoDAO.obtenerAmigos(user.id),
    amigoDAO.obtenerSugerencias(user.id),
    amigoDAO.obtenerTodosLectores(user.id),
  ])

  return NextResponse.json({ amigos, sugerencias, todosLectores })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, amigoId } = body

    if (!amigoId) return NextResponse.json({ error: 'amigoId requerido' }, { status: 400 })

    if (action === 'agregar') {
      const ok = await amigoDAO.agregarAmigo(user.id, Number(amigoId))
      if (ok) {
        await otorgarPuntos(user.id, 15, 'Nueva conexión de lectura')
        await registrarActividad(user.id, 'AMIGO', Number(amigoId), 'Se conectó con un nuevo lector')
        await verificarLogros(user.id)
        // Notificar al usuario seguido (fire-and-forget)
        crearNotificacion(
          Number(amigoId),
          'NUEVO_SEGUIDOR',
          `@${user.username} empezó a seguirte`,
          { actorUsername: user.username, actorAvatarUrl: user.avatarUrl }
        ).catch(() => {})
      }
      return NextResponse.json({ ok })
    }

    if (action === 'eliminar') {
      const ok = await amigoDAO.eliminarAmigo(user.id, Number(amigoId))
      return NextResponse.json({ ok })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    console.error('Error en /api/amigos:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
