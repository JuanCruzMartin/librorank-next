import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as clubDAO from '@/lib/dao/clubDAO'
import { otorgarPuntos } from '@/lib/dao/libroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const clubes = await clubDAO.listarClubes(user.id)
  return NextResponse.json(clubes)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { accion } = body

    if (accion === 'crear') {
      const { nombre, descripcion, libro_titulo, libro_autor, libro_portada, max_miembros, privado } = body
      if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

      const clubId = await clubDAO.crearClub({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || '',
        libro_titulo: libro_titulo?.trim() || '',
        libro_autor: libro_autor?.trim() || '',
        libro_portada: libro_portada?.trim() || '',
        creador_id: user.id,
        max_miembros: Number(max_miembros) || 20,
        privado: !!privado,
      })

      try { await otorgarPuntos(user.id, 25, 'Club de lectura creado') } catch {}
      return NextResponse.json({ ok: true, clubId })
    }

    if (accion === 'unirse') {
      const { clubId } = body
      const result = await clubDAO.unirseAlClub(Number(clubId), user.id)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
      try { await otorgarPuntos(user.id, 10, 'Unido a un club de lectura') } catch {}
      return NextResponse.json({ ok: true })
    }

    if (accion === 'salir') {
      const { clubId } = body
      const ok = await clubDAO.salirDelClub(Number(clubId), user.id)
      return NextResponse.json({ ok })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    console.error('Error en /api/clubes:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
