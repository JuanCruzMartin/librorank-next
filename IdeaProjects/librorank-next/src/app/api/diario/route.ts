import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as diarioDAO from '@/lib/dao/diarioDAO'
import * as citaDAO from '@/lib/dao/citaDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import { verificarLogros } from '@/lib/dao/logroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const libroId = req.nextUrl.searchParams.get('libroId')
  if (!libroId) return NextResponse.json({ error: 'libroId requerido' }, { status: 400 })

  const [entradas, citas, libro] = await Promise.all([
    diarioDAO.obtenerPorLibro(Number(libroId), user.id),
    citaDAO.obtenerPorLibro(Number(libroId), user.id),
    libroDAO.buscarPorId(Number(libroId), user.id),
  ])

  return NextResponse.json({ entradas, citas, libro })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { accion, libroId, capitulo, comentario, texto, pagina } = body

    if (!libroId) return NextResponse.json({ error: 'libroId requerido' }, { status: 400 })

    if (accion === 'cita') {
      const insertId = await citaDAO.guardar({
        usuario_id: user.id, libro_id: Number(libroId), texto, pagina,
      })
      if (insertId !== false) {
        await libroDAO.otorgarPuntos(user.id, 10, 'Cita memorable guardada')
        await verificarLogros(user.id)
        return NextResponse.json({
          ok: true,
          cita: { id: insertId, usuario_id: user.id, libro_id: Number(libroId), texto, pagina: pagina || null },
        })
      }
      return NextResponse.json({ ok: false })
    }

    const insertId = await diarioDAO.guardar({
      libro_id: Number(libroId), usuario_id: user.id,
      capitulo: capitulo || '', comentario: comentario || '',
    })
    if (insertId !== false) {
      await libroDAO.otorgarPuntos(user.id, 10, 'Entrada en el diario de lectura')
      await verificarLogros(user.id)
      return NextResponse.json({
        ok: true,
        entrada: {
          id: insertId,
          libro_id: Number(libroId),
          usuario_id: user.id,
          capitulo: capitulo || '',
          comentario: comentario || '',
          fecha_creacion: new Date().toISOString(),
        },
      })
    }
    return NextResponse.json({ ok: false })
  } catch (err) {
    console.error('Error en /api/diario:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { id, tipo } = await req.json()
    if (!id || !tipo) return NextResponse.json({ error: 'id y tipo requeridos' }, { status: 400 })

    let ok = false
    if (tipo === 'cita') {
      ok = await citaDAO.eliminar(Number(id), user.id)
    } else {
      ok = await diarioDAO.eliminar(Number(id), user.id)
    }
    return NextResponse.json({ ok })
  } catch (err) {
    console.error('Error eliminando entrada:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
