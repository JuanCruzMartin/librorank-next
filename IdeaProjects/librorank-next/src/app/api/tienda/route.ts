import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { ITEMS_TIENDA } from '@/lib/tienda'
import { tirarSobre } from '@/lib/cartas'
import type { TipoSobre } from '@/lib/tienda'
import { execute, queryOne } from '@/lib/db'
import { agregarCarta } from '@/lib/dao/cartaDAO'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { itemId } = await req.json()
  const item = ITEMS_TIENDA.find(i => i.id === itemId)
  if (!item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })

  // Verificar monedas suficientes
  const row = await queryOne<{ monedas: number }>(
    'SELECT monedas FROM usuarios WHERE id = ?',
    [user.id]
  )
  if (!row || row.monedas < item.precio) {
    return NextResponse.json({ error: 'Monedas insuficientes' }, { status: 400 })
  }

  // Descontar monedas
  await execute(
    'UPDATE usuarios SET monedas = monedas - ? WHERE id = ? AND monedas >= ?',
    [item.precio, user.id, item.precio]
  )

  // Tirar 5 cartas según el tipo de sobre
  const cartas = tirarSobre(item.tipo as TipoSobre, 5)

  // Guardar cartas nuevas en la colección
  const resultados = await Promise.all(
    cartas.map(async c => {
      const esNueva = await agregarCarta(user.id, c.id)
      return { carta: c, esNueva }
    })
  )

  return NextResponse.json({ ok: true, cartas: resultados, monedasRestantes: row.monedas - item.precio })
}
