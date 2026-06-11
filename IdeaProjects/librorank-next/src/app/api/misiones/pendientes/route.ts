import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ pendientes: 0 })

  try {
    const misiones = await obtenerMisionesConProgreso(user.id)
    const pendientes = misiones.filter(m => m.completada && !m.reclamada).length
    return NextResponse.json({ pendientes })
  } catch {
    return NextResponse.json({ pendientes: 0 })
  }
}
