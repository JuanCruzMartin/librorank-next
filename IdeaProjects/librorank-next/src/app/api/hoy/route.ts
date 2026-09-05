import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { obtenerRespuestaHoy, crearTablasSiNoExisten } from '@/lib/dao/preguntaDiariaDAO'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await crearTablasSiNoExisten()

  const [row, respuesta, misiones] = await Promise.all([
    queryOne<{ ultima_tirada_gratis: Date | null }>(
      'SELECT ultima_tirada_gratis FROM usuarios WHERE id = ?',
      [user.id]
    ),
    obtenerRespuestaHoy(user.id),
    obtenerMisionesConProgreso(user.id),
  ])

  const ultima = row?.ultima_tirada_gratis ? new Date(row.ultima_tirada_gratis) : null
  const proxima = ultima ? new Date(ultima.getTime() + 24 * 60 * 60 * 1000) : new Date(0)
  const sobreDisponible = !ultima || new Date() >= proxima

  const preguntaRespondida = respuesta !== null
  const misionesReclamables = misiones.filter(m => m.completada && !m.reclamada).length

  const pendientes = (sobreDisponible ? 1 : 0) + (preguntaRespondida ? 0 : 1) + misionesReclamables

  return NextResponse.json({
    sobre_disponible: sobreDisponible,
    pregunta_respondida: preguntaRespondida,
    misiones_reclamables: misionesReclamables,
    pendientes,
  })
}
