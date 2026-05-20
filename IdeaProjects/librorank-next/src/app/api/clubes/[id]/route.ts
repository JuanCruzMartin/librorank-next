import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as clubDAO from '@/lib/dao/clubDAO'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const clubId = Number(id)

  const [club, miembros, posts] = await Promise.all([
    clubDAO.obtenerClub(clubId, user.id),
    clubDAO.obtenerMiembros(clubId),
    clubDAO.obtenerPosts(clubId),
  ])

  if (!club) return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 })

  return NextResponse.json({ club, miembros, posts })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const clubId = Number(id)

  try {
    const body = await req.json()
    const { capitulo, contenido } = body

    if (!contenido?.trim()) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }
    if (contenido.trim().length > 1000) {
      return NextResponse.json({ error: 'Máximo 1000 caracteres' }, { status: 400 })
    }

    // Verificar que es miembro
    const miembro = await clubDAO.esMiembro(clubId, user.id)
    if (!miembro) return NextResponse.json({ error: 'No sos miembro de este club' }, { status: 403 })

    const ok = await clubDAO.publicarPost({
      club_id: clubId,
      usuario_id: user.id,
      capitulo: capitulo?.trim() || 'General',
      contenido: contenido.trim(),
    })

    return NextResponse.json({ ok })
  } catch (err) {
    console.error('Error en /api/clubes/[id]:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
