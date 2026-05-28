'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ActividadSocial } from '@/lib/dao/actividadDAO'

function formatFechaActividad(tipo: string, tituloLibro?: string | null, detalle?: string | null): string {
  // tituloLibro viene del JOIN con libros_usuario, si es null usamos detalle como fallback
  const titulo = tituloLibro || detalle || 'un libro'
  switch (tipo) {
    case 'NUEVO_LIBRO':       return `empezó a leer "${titulo}"`
    case 'LIBRO_LEIDO':       return `terminó de leer "${titulo}"`
    case 'RESENA':            return `escribió una reseña de "${titulo}"`
    case 'NUEVO_RETO':        return `lanzó un nuevo Reto: "${detalle}"`
    case 'CAMBIO_ESTADO':     return `actualizó "${titulo}" → ${detalle}`
    case 'NUEVA_CALIFICACION':return `puntuó "${titulo}" con ${detalle} ⭐`
    case 'DIARIO_LOG':        return `actualizó su progreso: ${detalle}`
    case 'BINGO':             return `completó una casilla del Bingo 🎲`
    default:                  return detalle || tipo
  }
}

interface Props {
  feedInicial: ActividadSocial[]
  usuarioId: number
}

export default function FeedClient({ feedInicial, usuarioId }: Props) {
  const [feed, setFeed] = useState(feedInicial)

  async function toggleLike(actividadId: number) {
    const res = await fetch('/api/actividad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actividadId }),
    })
    const data = await res.json()

    setFeed(prev => prev.map(a => {
      if (a.id !== actividadId) return a
      return {
        ...a,
        le_gusta_al_usuario: data.liked,
        total_likes: a.total_likes + (data.liked ? 1 : -1),
      }
    }))
  }

  if (feed.length === 0) {
    return (
      <div className="card p-5 text-center text-muted">
        <i className="bi bi-people display-4 mb-3"></i>
        <p>Aún no hay actividad. ¡Seguí a más personas para llenar tu muro!</p>
        <Link href="/amigos" className="btn btn-gold btn-sm mt-2">Buscar Amigos</Link>
      </div>
    )
  }

  return (
    <div className="feed-container">
      {feed.map(act => (
        <div key={act.id} className="feed-item card mb-3 p-3">
          <div className="d-flex gap-3">
            <div className="feed-user-img">
              <img
                src={act.avatar_url || '/img/personajes/personaje_2.png'}
                alt={act.username}
                className="rounded-circle"
                style={{ width: 45, height: 45, objectFit: 'cover' }}
                onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/img/personajes/personaje_1.png' }}
              />
            </div>
            <div className="flex-grow-1">
              <div className="feed-header d-flex justify-content-between">
                <Link href={`/perfil/${act.username}`} className="fw-bold text-white text-decoration-none">
                  @{act.username}
                </Link>
                <span className="text-muted small">
                  {new Date(act.fecha_creacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="feed-content my-2 text-white opacity-75">
                {formatFechaActividad(act.tipo_actividad, act.titulo, act.detalle)}
              </div>
              {act.portada_url && (
                <Image src={act.portada_url} alt={act.titulo || ''} width={40} height={60} style={{ borderRadius: 6 }} className="mb-2" />
              )}
              <div className="feed-actions mt-2 pt-2 border-top border-secondary d-flex gap-4" style={{ opacity: 0.7 }}>
                <button
                  onClick={() => toggleLike(act.id)}
                  className="btn btn-link text-decoration-none p-0 small"
                  style={{ color: act.le_gusta_al_usuario ? 'var(--primary)' : '#888' }}
                >
                  <i className={`bi bi-hand-thumbs-up${act.le_gusta_al_usuario ? '-fill' : ''}`}></i>{' '}
                  {act.total_likes} Me gusta
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
