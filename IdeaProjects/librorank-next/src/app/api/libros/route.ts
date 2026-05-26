import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as actividadDAO from '@/lib/dao/actividadDAO'
import * as logroDAO from '@/lib/dao/logroDAO'

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const libros = await libroDAO.buscarPorUsuario(user.id)
  return NextResponse.json(libros)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { accion } = body

    if (accion === 'nuevo') {
      const { titulo, autor, anio, paginas, estado, portada_url, genero, mood } = body

      if (!titulo || !autor) {
        return NextResponse.json({ error: 'Título y autor son obligatorios' }, { status: 400 })
      }

      const existe = await libroDAO.existeRegistroPrevio(user.id, titulo, autor)
      if (existe) {
        return NextResponse.json({ error: 'Ya tienes este libro registrado' }, { status: 409 })
      }

      const nuevoId = await libroDAO.agregar({
        usuario_id: user.id, libro_global_id: null,
        titulo, autor,
        anio: anio ? Number(anio) : null,
        paginas: paginas ? Number(paginas) : null,
        estado: estado || 'PENDIENTE',
        portada_url: portada_url || null,
        genero: genero || null,
        mood: mood || null,
        estrellas: 0, resena: null,
      })

      if (nuevoId) {
        try {
          await libroDAO.otorgarPuntos(user.id, 50, 'Libro agregado a la biblioteca')
          if (estado === 'LEIDO') {
            await libroDAO.otorgarPuntos(user.id, 30, 'Libro marcado como LEÍDO al agregar')
            await actividadDAO.registrar(user.id, 'LIBRO_LEIDO', nuevoId, titulo)
          } else {
            await actividadDAO.registrar(user.id, 'NUEVO_LIBRO', nuevoId, titulo)
          }
          await logroDAO.verificarLogros(user.id)
        } catch (e) {
          console.error('Error otorgando puntos/logros (no crítico):', e)
        }
      }

      return NextResponse.json({ ok: !!nuevoId })
    }

    if (accion === 'editar') {
      const { id, estado, estrellas, resena, genero, mood } = body
      const libroAnterior = await libroDAO.buscarPorId(Number(id), user.id)

      const ok = await libroDAO.actualizar({
        id: Number(id), usuario_id: user.id,
        estado: estado ?? 'PENDIENTE',
        estrellas: Number(estrellas) || 0,
        resena: resena || null,
        genero: genero || null,
        mood: mood || null,
      })

      if (ok) {
        // Puntos y logros son secundarios — no deben bloquear el guardado
        try {
          const estadoAnterior = libroAnterior?.estado?.toUpperCase()
          const estadoNuevo = (estado ?? '').toUpperCase()

          if (estadoNuevo === 'LEIDO' && estadoAnterior !== 'LEIDO') {
            await libroDAO.otorgarPuntos(user.id, 30, 'Libro marcado como LEÍDO')
            await actividadDAO.registrar(user.id, 'LIBRO_LEIDO', Number(id), `Ha terminado de leer "${libroAnterior?.titulo}"`)
          }
          if (resena && resena.trim().length > 0 && !libroAnterior?.resena) {
            await libroDAO.otorgarPuntos(user.id, 20, 'Reseña escrita')
            await actividadDAO.registrar(user.id, 'RESENA', Number(id), `Ha escrito una reseña de "${libroAnterior?.titulo}"`)
          }
          if (Number(estrellas) > 0 && (libroAnterior?.estrellas ?? 0) === 0) {
            await libroDAO.otorgarPuntos(user.id, 10, 'Calificación con estrellas')
          }
          await logroDAO.verificarLogros(user.id)
        } catch (e) {
          console.error('Error otorgando puntos/logros (no crítico):', e)
        }
      }

      return NextResponse.json({ ok })
    }

    if (accion === 'eliminar') {
      const { id } = body
      const ok = await libroDAO.eliminar(Number(id), user.id)
      return NextResponse.json({ ok })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err) {
    console.error('Error en /api/libros:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
