import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as intercambioDAO from '@/lib/dao/intercambioDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import { CARTAS } from '@/lib/cartas'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const tab = req.nextUrl.searchParams.get('tab') ?? 'mercado'

  if (tab === 'mercado') {
    const ofertas = await intercambioDAO.listarMercado(user.id)
    return NextResponse.json(ofertas)
  }
  if (tab === 'mis-ofertas') {
    const ofertas = await intercambioDAO.listarMisOfertas(user.id)
    return NextResponse.json(ofertas)
  }
  if (tab === 'recibidas') {
    const ofertas = await intercambioDAO.listarOfertasRecibidas(user.id)
    return NextResponse.json(ofertas)
  }
  if (tab === 'historial') {
    const ofertas = await intercambioDAO.listarHistorial(user.id)
    return NextResponse.json(ofertas)
  }

  return NextResponse.json({ error: 'Tab inválido' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { cartaOfrecida, cartaPedida, receptorId } = body

  if (!cartaOfrecida || !cartaPedida) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const cartaOf = CARTAS.find(c => c.id === cartaOfrecida)
  const cartaPed = CARTAS.find(c => c.id === cartaPedida)
  if (!cartaOf || !cartaPed) {
    return NextResponse.json({ error: 'Carta inválida' }, { status: 400 })
  }

  // Verificar mismo valor (rareza)
  if (cartaOf.rareza !== cartaPed.rareza) {
    return NextResponse.json({ error: 'Las cartas deben ser de la misma rareza' }, { status: 400 })
  }

  // No podés ofrecer y pedir la misma carta
  if (cartaOfrecida === cartaPedida) {
    return NextResponse.json({ error: 'No podés intercambiar una carta por sí misma' }, { status: 400 })
  }

  // Verificar que el usuario tiene la carta ofrecida
  const coleccion = await cartaDAO.obtenerColeccion(user.id)
  if (!coleccion.includes(cartaOfrecida)) {
    return NextResponse.json({ error: 'No tenés esa carta' }, { status: 400 })
  }

  // Verificar que no tiene ya una oferta pendiente con esa carta
  const yaOfrecida = await intercambioDAO.tieneOfertaConCarta(user.id, cartaOfrecida)
  if (yaOfrecida) {
    return NextResponse.json({ error: 'Ya tenés una oferta pendiente con esa carta' }, { status: 400 })
  }

  const id = await intercambioDAO.crear(user.id, cartaOfrecida, cartaPedida, receptorId ?? null)
  return NextResponse.json({ id }, { status: 201 })
}
