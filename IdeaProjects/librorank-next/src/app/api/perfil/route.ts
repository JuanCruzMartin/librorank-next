import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest, setAuthCookie } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as logroDAO from '@/lib/dao/logroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const idParam = req.nextUrl.searchParams.get('id')
  const targetId = idParam ? Number(idParam) : user.id

  const [usuario, stats, ultimasLecturas, logros, leidosEsteAnio, totalLeidos] = await Promise.all([
    usuarioDAO.buscarPorId(targetId),
    libroDAO.obtenerStatsPorUsuario(targetId),
    libroDAO.obtenerUltimasLecturas(targetId, 5),
    logroDAO.obtenerLogrosUsuario(targetId),
    libroDAO.contarLeidosEsteAnio(targetId),
    libroDAO.contarLeidosTotal(targetId),
  ])

  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({
    usuario,
    stats,
    ultimasLecturas,
    logros,
    leidosEsteAnio,
    totalLeidos,
    nivelInfo: usuarioDAO.getNivelLector(usuario?.puntos ?? 0),
    esMiPerfil: targetId === user.id,
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { nombre, username, email, bio, objetivo_anual, generos_favoritos, avatar_url } = body

    if (avatar_url) {
      await usuarioDAO.actualizarAvatarUrl(user.id, avatar_url)
    }

    if (nombre || username || email) {
      await usuarioDAO.actualizarPerfilBasico({
        id: user.id,
        nombre: nombre || user.nombre,
        username: username || user.username,
        email: email || user.email,
        bio, objetivo_anual: objetivo_anual ? Number(objetivo_anual) : undefined,
        generos_favoritos,
      })
    }

    const actualizado = await usuarioDAO.buscarPorId(user.id)
    if (actualizado) {
      await setAuthCookie({
        id: actualizado.id,
        username: actualizado.username,
        nombre: actualizado.nombre,
        email: actualizado.email,
        avatarUrl: actualizado.avatar_url,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error actualizando perfil:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
