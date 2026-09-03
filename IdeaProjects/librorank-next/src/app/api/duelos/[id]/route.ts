import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { crearTabla, obtenerDueloPorId, unirseAlDuelo, responder, expirarDuelos } from '@/lib/dao/dueloDAO'
import { obtenerColeccion } from '@/lib/dao/cartaDAO'
import { PREGUNTAS } from '@/lib/preguntas-literarias'

// GET /api/duelos/[id]  → estado actualizado del duelo (polling)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTabla()
  await expirarDuelos()

  const { id } = await params
  const duelo = await obtenerDueloPorId(Number(id))
  if (!duelo) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 })

  if (duelo.retador_id !== user.id && duelo.rival_id !== user.id) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const esRetador = duelo.retador_id === user.id

  // Pregunta de la ronda actual
  let preguntaActual = null
  if (duelo.estado === 'en_curso' && duelo.ronda_actual > 0 && duelo.preguntas.length >= duelo.ronda_actual) {
    const idx = duelo.ronda_actual - 1
    const p = PREGUNTAS[duelo.preguntas[idx]]
    if (p) {
      const yaRespondio = esRetador
        ? duelo.respuestas_retador[idx] !== null
        : duelo.respuestas_rival[idx] !== null
      preguntaActual = {
        texto: p.texto,
        opciones: p.opciones,
        respuesta: yaRespondio ? p.respuesta : undefined,
      }
    }
  }

  // Resultado de la ronda anterior (para mostrar entre rondas)
  let resultadoRondaAnterior = null
  if (duelo.estado === 'en_curso' && duelo.ronda_actual > 1 && duelo.preguntas.length > 0) {
    const prevIdx = duelo.ronda_actual - 2
    const prevPreguntaIdx = duelo.preguntas[prevIdx]
    const p = PREGUNTAS[prevPreguntaIdx]
    if (p) {
      const correcta = p.respuesta
      const retadorOk = duelo.respuestas_retador[prevIdx] === correcta
      const rivalOk = duelo.respuestas_rival[prevIdx] === correcta
      let ganadorRonda: 'retador' | 'rival' | 'empate' = 'empate'
      if (retadorOk && rivalOk) {
        const tR = duelo.tiempos_retador[prevIdx] ?? Infinity
        const tV = duelo.tiempos_rival[prevIdx] ?? Infinity
        ganadorRonda = tR < tV ? 'retador' : 'rival'
      } else if (retadorOk) ganadorRonda = 'retador'
      else if (rivalOk) ganadorRonda = 'rival'
      resultadoRondaAnterior = {
        ronda: prevIdx + 1,
        ganadorRonda,
        respuestaCorrecta: correcta,
        puntosRetador: duelo.puntos_retador,
        puntosRival: duelo.puntos_rival,
      }
    }
  }

  return NextResponse.json({ duelo, preguntaActual, resultadoRondaAnterior })
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

    const coleccion = await obtenerColeccion(user.id)
    if (!coleccion.includes(cartaId)) {
      return NextResponse.json({ error: 'No tenés esa carta' }, { status: 400 })
    }

    const { CARTAS, rarezaVisual } = await import('@/lib/cartas')
    const duelo = await obtenerDueloPorId(dueloId)
    if (!duelo) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 })
    const cartaRetador = CARTAS.find(c => c.id === duelo.carta_retador)
    const cartaRival = CARTAS.find(c => c.id === cartaId)
    if (cartaRetador && cartaRival && rarezaVisual(cartaRetador.rareza) !== rarezaVisual(cartaRival.rareza)) {
      return NextResponse.json({ error: `Solo podés apostar una carta ${rarezaVisual(cartaRetador.rareza)}` }, { status: 400 })
    }

    const ok = await unirseAlDuelo(dueloId, user.id, cartaId)
    if (!ok) return NextResponse.json({ error: 'No se pudo unir al duelo' }, { status: 400 })

    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'responder') {
    const { respuesta } = body
    if (respuesta === undefined || respuesta === null) {
      return NextResponse.json({ error: 'Falta respuesta' }, { status: 400 })
    }

    const result = await responder(dueloId, user.id, Number(respuesta))
    if (!result.ok) return NextResponse.json({ error: 'No se pudo registrar respuesta' }, { status: 400 })

    if (result.dueloTerminado) {
      const duelo = await obtenerDueloPorId(dueloId)
      return NextResponse.json({
        ok: true,
        dueloTerminado: true,
        rondaTerminada: true,
        ganadorRonda: result.ganadorRonda,
        respuestaCorrecta: result.respuestaCorrecta,
        puntosRetador: result.puntosRetador,
        puntosRival: result.puntosRival,
        duelo,
      })
    }

    if (result.rondaTerminada) {
      return NextResponse.json({
        ok: true,
        dueloTerminado: false,
        rondaTerminada: true,
        ganadorRonda: result.ganadorRonda,
        respuestaCorrecta: result.respuestaCorrecta,
        puntosRetador: result.puntosRetador,
        puntosRival: result.puntosRival,
      })
    }

    return NextResponse.json({ ok: true, dueloTerminado: false })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
