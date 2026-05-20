'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UserCard {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  bio?: string | null
  generos_favoritos?: string | null
  total_leidos?: number
  libros_en_comun?: number
}

export default function AmigosPage() {
  const router = useRouter()
  const [amigos, setAmigos] = useState<UserCard[]>([])
  const [sugerencias, setSugerencias] = useState<UserCard[]>([])
  const [resultados, setResultados] = useState<UserCard[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/amigos').then(r => r.json()).then(data => {
      setAmigos(data.amigos || [])
      setSugerencias(data.sugerencias || [])
      setLoading(false)
    })
  }, [])

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResultados([]); return }
    const res = await fetch(`/api/amigos?buscar=${encodeURIComponent(q)}`)
    setResultados(await res.json())
  }, [])

  async function agregar(amigoId: number) {
    await fetch('/api/amigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'agregar', amigoId }),
    })
    router.refresh()
    window.location.reload()
  }

  async function eliminar(amigoId: number) {
    await fetch('/api/amigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', amigoId }),
    })
    setAmigos(prev => prev.filter(a => a.id !== amigoId))
  }

  const amigoIds = new Set(amigos.map(a => a.id))
  const mostrados = resultados.length > 0 ? resultados : []

  return (
    <div className="container py-5">
      {/* Header con buscador centrado */}
      <div className="text-center mb-5">
        <h1 className="font-title display-5 mb-2">👥 Comunidad</h1>
        <p className="text-muted mb-4">Encontrá lectores que comparten tus géneros favoritos.</p>
        <div className="mx-auto" style={{ maxWidth: 520 }}>
          <div className="input-group">
            <span className="input-group-text" style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              🔍
            </span>
            <input
              type="text"
              className="form-control"
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              placeholder="Buscar por usuario o nombre..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); buscar(e.target.value) }}
            />
          </div>
          {mostrados.length > 0 && (
            <div className="mt-3 row g-3 text-start">
              {mostrados.map(u => (
                <UserCardComp key={u.id} user={u} esAmigo={amigoIds.has(u.id)} onAgregar={agregar} onEliminar={eliminar} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="row g-4 align-items-start">

        {/* col-lg-8: Mis amigos */}
        <div className="col-lg-8">
          <h4 className="font-title mb-4">
            Mis Amigos
            <span className="ms-2 text-muted" style={{ fontSize: '1rem', fontFamily: 'inherit' }}>({amigos.length})</span>
          </h4>

          {loading ? (
            <div className="text-muted py-5 text-center">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Cargando...
            </div>
          ) : amigos.length === 0 ? (
            <div className="card p-5 text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <p className="text-muted mb-3">Aún no seguís a nadie.</p>
              <p className="text-muted small">Buscá lectores arriba para comenzar a seguirlos.</p>
            </div>
          ) : (
            <div className="row g-4">
              {amigos.map(a => (
                <UserCardComp key={a.id} user={a} esAmigo={true} onAgregar={agregar} onEliminar={eliminar} />
              ))}
            </div>
          )}
        </div>

        {/* col-lg-4: Sugerencias sticky */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '1.5rem' }}>
            {/* Lectores Afines */}
            {sugerencias.length > 0 && (
              <div className="card p-4 mb-3">
                <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>✨ Lectores Afines</h6>
                <p className="text-muted small mb-3">Comparten géneros con vos.</p>
                <div className="d-flex flex-column gap-3">
                  {sugerencias.slice(0, 5).map(s => (
                    <div key={s.id} className="d-flex align-items-center gap-2">
                      <img
                        src={s.avatar_url || '/img/personajes/personaje_1.png'}
                        alt={s.username}
                        className="rounded-circle flex-shrink-0"
                        style={{ width: 40, height: 40, objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
                      />
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.9rem' }}>@{s.username}</div>
                        {s.libros_en_comun !== undefined && s.libros_en_comun > 0 && (
                          <div className="small" style={{ color: 'var(--accent-gold)' }}>📚 {s.libros_en_comun} en común</div>
                        )}
                      </div>
                      <button
                        onClick={() => agregar(s.id)}
                        className="btn-gold btn-sm flex-shrink-0"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        + Seguir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tip dorado */}
            <div className="card p-4" style={{ borderLeft: '4px solid var(--accent-gold)', background: 'rgba(212,175,55,0.04)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💡</div>
              <p className="text-white small mb-0" style={{ fontStyle: 'italic' }}>
                Seguí lectores para ver su actividad en tu feed y comparar bibliotecas.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function UserCardComp({ user, esAmigo, onAgregar, onEliminar }: {
  user: UserCard
  esAmigo: boolean
  onAgregar: (id: number) => void
  onEliminar: (id: number) => void
}) {
  return (
    <div className="col-sm-6 col-md-4 col-lg-6">
      <div className="card p-3 h-100">
        <div className="d-flex align-items-center gap-3 mb-3">
          <img
            src={user.avatar_url || '/img/personajes/personaje_1.png'}
            alt={user.username}
            className="rounded-circle flex-shrink-0"
            style={{ width: 50, height: 50, objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
          />
          <div className="min-w-0">
            <div className="fw-bold text-white text-truncate">@{user.username}</div>
            <div className="text-muted small text-truncate">{user.nombre}</div>
          </div>
        </div>
        {user.bio && <p className="text-muted small mb-2 text-truncate">{user.bio}</p>}
        {user.libros_en_comun !== undefined && user.libros_en_comun > 0 && (
          <div className="small mb-2" style={{ color: 'var(--accent-gold)' }}>📚 {user.libros_en_comun} libros en común</div>
        )}
        {user.total_leidos !== undefined && (
          <div className="small text-muted mb-3">{user.total_leidos} libros leídos</div>
        )}
        <div className="mt-auto d-flex gap-2">
          {esAmigo ? (
            <button onClick={() => onEliminar(user.id)} className="btn btn-sm btn-outline-danger flex-fill">
              Dejar de seguir
            </button>
          ) : (
            <button onClick={() => onAgregar(user.id)} className="btn-gold btn-sm flex-fill">
              + Seguir
            </button>
          )}
          <a href={`/perfil?id=${user.id}`} className="btn btn-sm btn-outline-secondary">
            Ver perfil
          </a>
        </div>
      </div>
    </div>
  )
}
