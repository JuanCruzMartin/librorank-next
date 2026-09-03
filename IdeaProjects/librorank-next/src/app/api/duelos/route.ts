import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { crearTabla, crearDesafio, obtenerSala, obtenerDueloActivo, cancelarDesafio, obtenerHistorial, expirarDuelos, obtenerStatsGlobales, obtenerStatsPorRival, type TipoDuelo } from '@/lib/dao/dueloDAO'
import { obtenerColeccion } from '@/lib/dao/cartaDAO'
import { CARTAS } from '@/lib/cartas'

async function init() { await crearTabla() }

// GET /api/duelos  → sala + duelo activo del usuario + historial
export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await init()
  await expirarDuelos()

  const [sala, activo, historial, coleccion, stats, statsPorRival] = await Promise.all([
    obtenerSala(),
    obtenerDueloActivo(user.id),
    obtenerHistorial(user.id, 5),
    obtenerColeccion(user.id),
    obtenerStatsGlobales(user.id),
    obtenerStatsPorRival(user.id),
  ])

  // Filtrar sala: no mostrar el propio desafío del usuario
  const salaFiltrada = sala.filter(d => d.retador_id !== user.id)

  // Enriquecer cartas con metadata
  const cartasMap = Object.fromEntries(CARTAS.map(c => [c.id, c]))

  return NextResponse.json({ sala: salaFiltrada, activo, historial, coleccion, cartasMap, stats, statsPorRival })
}

// POST /api/duelos  { accion: 'crear', cartaId } | { accion: 'cancelar', dueloId }
export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await init()
  const body = await req.json()

  if (body.accion === 'crear') {
    const { cartaId, tipo = 'estandar' } = body
    if (!cartaId) return NextResponse.json({ error: 'Falta carta' }, { status: 400 })

    // Verificar que el usuario tiene la carta
    const coleccion = await obtenerColeccion(user.id)
    if (!coleccion.includes(cartaId)) {
      return NextResponse.json({ error: 'No tenés esa carta' }, { status: 400 })
    }

    // Verificar que no tiene ya un duelo activo
    const activo = await obtenerDueloActivo(user.id)
    if (activo) return NextResponse.json({ error: 'Ya tenés un duelo activo' }, { status: 400 })

    const id = await crearDesafio(user.id, cartaId, tipo as TipoDuelo)
    return NextResponse.json({ ok: true, dueloId: id })
  }

  if (body.accion === 'cancelar') {
    const { dueloId } = body
    const ok = await cancelarDesafio(Number(dueloId), user.id)
    return NextResponse.json({ ok })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
