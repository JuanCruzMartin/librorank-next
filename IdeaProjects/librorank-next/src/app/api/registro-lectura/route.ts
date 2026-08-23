import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { crearTabla, obtenerLogsHoy, registrarSesion, obtenerTotalPaginasUsuario } from '@/lib/dao/registroLecturaDAO'
import { actualizarRacha } from '@/lib/dao/usuarioDAO'
import { otorgarPuntos } from '@/lib/dao/libroDAO'
import { otorgarCofre, crearTabla as crearTablaCofres } from '@/lib/dao/cofreDAO'

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
  await crearTablaCofres()

  // Total de páginas ANTES de registrar esta sesión
  const totalAntes = await obtenerTotalPaginasUsuario(user.id)

  await registrarSesion(user.id, Number(libroUsuarioId), Number(paginas))

  const totalDespues = totalAntes + Number(paginas)

  // Cofre por cada hito de 100 páginas que se cruce en esta sesión
  const hitosAntes = Math.floor(totalAntes / 100)
  const hitosDespues = Math.floor(totalDespues / 100)
  let cofresGanados = 0
  for (let i = hitosAntes; i < hitosDespues; i++) {
    await otorgarCofre(user.id, 'comun')
    cofresGanados++
  }

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
    cofresGanados,
  })
}
