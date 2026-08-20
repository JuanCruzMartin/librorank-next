import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { crearTabla, obtenerLogsHoy, registrarSesion } from '@/lib/dao/registroLecturaDAO'
import { actualizarRacha } from '@/lib/dao/usuarioDAO'
import { otorgarPuntos } from '@/lib/dao/libroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTabla()
  const logs = await obtenerLogsHoy(user.id)
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { libroUsuarioId, paginas } = await req.json()
  if (!libroUsuarioId || !paginas || paginas < 1) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  await crearTabla()
  await registrarSesion(user.id, Number(libroUsuarioId), Number(paginas))

  // Actualizar racha (si ya fue actualizada hoy, devuelve el estado sin cambios)
  const rachaResult = await actualizarRacha(user.id)

  // Puntos base por sesión de lectura (10 pts siempre + 1 pt por cada 10 páginas)
  const ptsBase = 10 + Math.floor(Number(paginas) / 10)
  await otorgarPuntos(user.id, ptsBase, `Sesión de lectura: ${paginas} páginas`)

  return NextResponse.json({
    ok: true,
    ptsGanados: ptsBase + (rachaResult?.bonusPts ?? 0),
    racha: rachaResult?.nuevaRacha ?? 0,
    escudoGanado: rachaResult?.escudoGanado ?? false,
    milestoneAlcanzado: rachaResult?.milestoneAlcanzado ?? null,
  })
}
