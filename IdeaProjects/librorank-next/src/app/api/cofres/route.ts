import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as cofreDAO from '@/lib/dao/cofreDAO'
import { CARTAS, RAREZAS, type Rareza, type Carta } from '@/lib/cartas'
import { agregarCarta } from '@/lib/dao/cartaDAO'

function tirarCartaFiltrada(rarezasPermitidas: Rareza[]): Carta {
  const pool = CARTAS.filter(c => rarezasPermitidas.includes(c.rareza))
  const conPeso = pool.map(c => {
    const cant = pool.filter(x => x.rareza === c.rareza).length
    return { carta: c, peso: RAREZAS[c.rareza].peso / cant }
  })
  const total = conPeso.reduce((s, x) => s + x.peso, 0)
  let rand = Math.random() * total
  for (const { carta, peso } of conPeso) {
    rand -= peso
    if (rand <= 0) return carta
  }
  return pool[0]
}

const POOL: Record<cofreDAO.TipoCofre, Rareza[]> = {
  comun: ['comun', 'raro', 'epico', 'legendario', 'mitico'],
  raro:  ['raro', 'epico', 'legendario', 'mitico'],
  epico: ['epico', 'legendario', 'mitico'],
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await cofreDAO.crearTabla()
  const cofres = await cofreDAO.obtenerCofres(authUser.id)
  return NextResponse.json({ cofres })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { cofreId } = await req.json()
  if (!cofreId) return NextResponse.json({ error: 'Falta cofreId' }, { status: 400 })

  await cofreDAO.crearTabla()
  const cofres = await cofreDAO.obtenerCofres(authUser.id)
  const cofre = cofres.find(c => c.id === cofreId)
  if (!cofre) return NextResponse.json({ error: 'Cofre no encontrado' }, { status: 404 })

  const marcado = await cofreDAO.marcarAbierto(cofreId, authUser.id)
  if (!marcado) return NextResponse.json({ error: 'No se pudo abrir' }, { status: 400 })

  const carta = tirarCartaFiltrada(POOL[cofre.tipo])
  const esNueva = await agregarCarta(authUser.id, carta.id)

  return NextResponse.json({ carta, esNueva })
}
