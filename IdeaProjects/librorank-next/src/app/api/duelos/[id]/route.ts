import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { crearTabla, obtenerDueloPorId, unirseAlDuelo, responder, expirarDuelos } from '@/lib/dao/dueloDAO'
import { obtenerColeccion } from '@/lib/dao/cartaDAO'
import { getPreguntaDelDia, PREGUNTAS } from '@/lib/preguntas-literarias'

// GET /api/duelos/[id]  → estado actualizado del duelo (polling)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTabla()
  await expirarDuelos()

  const { id } = await params
  const duelo = await obtenerDueloPorId(Number(id))
  if (!duelo) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 })

  // Solo los participantes pueden ver el duelo
  if (duelo.retador_id !== user.id && duelo.rival_id !== user.id) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  // Incluir pregunta solo si el duelo está en curso
  let pregunta = null
  if (duelo.estado === 'en_curso' && duelo.pregunta_idx !== null) {
    const p = PREGUNTAS[duelo.pregunta_idx]
    // Ocultar respuesta correcta si el usuario aún no respondió
    const esRetador = duelo.retador_id === user.id
    const yaRespondio = esRetador ? duelo.respuesta_retador !== null : duelo.respuesta_rival !== null
    pregunta = {
      texto: p.texto,
      opciones: p.opciones,
      respuesta: yaRespondio ? p.respuesta : undefined,
    }
  }

  return NextResponse.json({ duelo, pregunta })
}

// POST /api/duelos/[id]  { accion: 'unirse', cartaId } | { accion: 'responder', respuesta }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTabla()
  const { id } = await params
  const dueloId = Number(id)
  const body = await req.json()

  if (body.accion === 'unirse') {
    const { cartaId } = body
    if (!cartaId) return NextResponse.json({ error: 'Falta carta' }, { status: 400 })

    // Verificar que tiene la carta
    const coleccion = await obtenerColeccion(user.id)
    if (!coleccion.includes(cartaId)) {
      return NextResponse.json({ error: 'No tenés esa carta' }, { status: 400 })
    }

    // Verificar rareza igual a la carta del retador
    const { CARTAS, rarezaVisual } = await import('@/lib/cartas')
    const duelo = await obtenerDueloPorId(dueloId)
    if (!duelo) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 })
    const cartaRetador = CARTAS.find(c => c.id === duelo.carta_retador)
    const cartaRival = CARTAS.find(c => c.id === cartaId)
    if (cartaRetador && cartaRival && rarezaVisual(cartaRetador.rareza) !== rarezaVisual(cartaRival.rareza)) {
      return NextResponse.json({ error: `Solo podés apostar una carta ${rarezaVisual(cartaRetador.rareza)}` }, { status: 400 })
    }

    // Elegir pregunta aleatoria
    const preguntaIdx = Math.floor(Math.random() * PREGUNTAS.length)

    const ok = await unirseAlDuelo(dueloId, user.id, cartaId, preguntaIdx)
    if (!ok) return NextResponse.json({ error: 'No se pudo unir al duelo' }, { status: 400 })

    return NextResponse.json({ ok: true, preguntaIdx })
  }

  if (body.accion === 'responder') {
    const { respuesta } = body
    if (respuesta === undefined || respuesta === null) {
      return NextResponse.json({ error: 'Falta respuesta' }, { status: 400 })
    }

    const result = await responder(dueloId, user.id, Number(respuesta))
    if (!result.ok) return NextResponse.json({ error: 'No se pudo registrar respuesta' }, { status: 400 })

    // Si terminó, devolver el resultado completo
    if (result.dueloTerminado) {
      const duelo = await obtenerDueloPorId(dueloId)
      const pregunta = duelo?.pregunta_idx !== null ? PREGUNTAS[duelo!.pregunta_idx!] : null
      return NextResponse.json({ ok: true, dueloTerminado: true, duelo, respuestaCorrecta: pregunta?.respuesta })
    }

    return NextResponse.json({ ok: true, dueloTerminado: false })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
