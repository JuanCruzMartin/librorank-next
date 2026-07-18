import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { getPreguntaDelDia } from '@/lib/preguntas-literarias'
import { obtenerRespuestaHoy, registrarRespuesta, crearTablasSiNoExisten } from '@/lib/dao/preguntaDiariaDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTablasSiNoExisten()

  const pregunta = getPreguntaDelDia()
  const respuestaHoy = await obtenerRespuestaHoy(user.id)

  return NextResponse.json({
    indice: pregunta.indice,
    texto: pregunta.texto,
    opciones: pregunta.opciones,
    respondida: respuestaHoy !== null,
    correcta: respuestaHoy?.correcta ?? null,
    respuestaCorrecta: respuestaHoy !== null ? pregunta.respuesta : null,
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const respuestaHoy = await obtenerRespuestaHoy(user.id)
  if (respuestaHoy !== null) {
    return NextResponse.json({ error: 'Ya respondiste hoy' }, { status: 409 })
  }

  const { opcionElegida } = await req.json()
  const pregunta = getPreguntaDelDia()
  const correcta = opcionElegida === pregunta.respuesta

  await registrarRespuesta(user.id, correcta)

  return NextResponse.json({
    correcta,
    respuestaCorrecta: pregunta.respuesta,
    tiradaGanada: correcta,
  })
}
