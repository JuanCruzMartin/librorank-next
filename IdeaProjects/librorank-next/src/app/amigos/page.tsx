'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface UserCard {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  bio?: string | null
  generos_favoritos?: string | null
  total_leidos?: number
  libros_en_comun?: number
  es_seguido?: number | boolean
}

const GENEROS_COLORES: Record<string, string> = {
  'Ficción': '#6c8ebf', 'Terror': '#9b59b6', 'Romance': '#e91e7a',
  'Fantasía': '#27ae60', 'Ciencia Ficción': '#2980b9', 'Thriller': '#e67e22',
  'Historia': '#795548', 'Autoayuda': '#f39c12', 'Poesía': '#e91e8c',
  'Misterio': '#8e44ad', 'Drama': '#c0392b', 'Aventura': '#16a085',
}

function GenerosPills({ generos }: { generos: string | null | undefined }) {
  if (!generos) return null
  const lista = generos.split(',').map(g => g.trim()).filter(Boolean).slice(0, 3)
  return (
    <div className="d-flex flex-wrap gap-1 mb-2">
      {lista.map(g => (
        <span key={g} style={{
          background: (GENEROS_COLORES[g] ?? '#4a4a6a') + '33',
          color: GENEROS_COLORES[g] ?? '#aaa',
          border: `1px solid ${(GENEROS_COLORES[g] ?? '#4a4a6a')}55`,
          borderRadius: 20,
          fontSize: '0.65rem',
          fontWeight: 600,
          padding: '2px 8px',
        }}>
          {g}
        </span>
      ))}
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
    <div className="col-sm-6 col-md-4 col-lg-4">
      <div className="card p-3 h-100 d-flex flex-column">
        <div className="d-flex align-items-center gap-3 mb-2">
          <img
            src={user.avatar_url || '/img/personajes/personaje_1.png'}
            alt={user.username}
            className="rounded-circle flex-shrink-0"
            style={{ width: 50, height: 50, objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
            onError={e => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/img/personajes/personaje_1.png' }}
          />
          <div className="min-w-0">
            <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.92rem' }}>@{user.username}</div>
            <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{user.nombre}</div>
          </div>
        </div>

        <GenerosPills generos={user.generos_favoritos} />

        {user.bio && (
          <p className="text-muted mb-2" style={{ fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {user.bio}
          </p>
        )}

        <div className="d-flex gap-3 mb-3 mt-auto" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
          {user.total_leidos !== undefined && (
            <span>📚 {user.total_leidos} leídos</span>
          )}
          {user.libros_en_comun !== undefined && user.libros_en_comun > 0 && (
            <span style={{ color: 'var(--accent-gold)' }}>✨ {user.libros_en_comun} en común</span>
          )}
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={() => esAmigo ? onEliminar(user.id) : onAgregar(user.id)}
            className={esAmigo ? 'btn btn-sm btn-outline-danger flex-fill' : 'btn-gold btn-sm flex-fill'}
            style={{ fontSize: '0.78rem' }}
          >
            {esAmigo ? 'Dejar de seguir' : '+ Seguir'}
          </button>
          <Link href={`/perfil?id=${user.id}`} className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.78rem' }}>
            Ver
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AmigosPage() {
  const [tab, setTab] = useState<'amigos' | 'descubrir'>('amigos')
  const [amigos, setAmigos] = useState<UserCard[]>([])
  const [sugerencias, setSugerencias] = useState<UserCard[]>([])
  const [todos, setTodos] = useState<UserCard[]>([])
  const [resultados, setResultados] = useState<UserCard[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroBusq, setFiltroBusq] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/amigos').then(r => r.json()).then(data => {
      setAmigos(data.amigos || [])
      setSugerencias(data.sugerencias || [])
      setTodos(data.todosLectores || [])
      setLoading(false)
    })
  }, [])

  const buscarGlobal = useCallback(async (q: string) => {
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
    setAmigos(prev => {
      const nuevo = todos.find(u => u.id === amigoId) || sugerencias.find(u => u.id === amigoId) || resultados.find(u => u.id === amigoId)
      return nuevo ? [...prev, nuevo] : prev
    })
    setTodos(prev => prev.map(u => u.id === amigoId ? { ...u, es_seguido: 1 } : u))
    setSugerencias(prev => prev.filter(u => u.id !== amigoId))
    setResultados(prev => prev.map(u => u.id === amigoId ? { ...u, es_seguido: 1 } : u))
  }

  async function eliminar(amigoId: number) {
    await fetch('/api/amigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', amigoId }),
    })
    setAmigos(prev => prev.filter(a => a.id !== amigoId))
    setTodos(prev => prev.map(u => u.id === amigoId ? { ...u, es_seguido: 0 } : u))
    setResultados(prev => prev.map(u => u.id === amigoId ? { ...u, es_seguido: 0 } : u))
  }

  const amigoIds = new Set(amigos.map(a => a.id))

  // Filtro local dentro de la tab "Descubrí"
  const todosFiltered = filtroBusq.length >= 2
    ? todos.filter(u =>
        u.username.toLowerCase().includes(filtroBusq.toLowerCase()) ||
        u.nombre.toLowerCase().includes(filtroBusq.toLowerCase())
      )
    : todos

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.4rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.88rem',
    background: active ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
    color: active ? '#111' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s',
  } as React.CSSProperties)

  return (
    <div className="container py-5">

      {/* Título + buscador rápido global */}
      <div className="text-center mb-4">
        <h1 className="font-title display-5 mb-2">👥 Comunidad</h1>
        <p className="text-muted mb-4">Encontrá lectores, seguí a tus favoritos y comparás bibliotecas.</p>
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
              onChange={e => { setBusqueda(e.target.value); buscarGlobal(e.target.value) }}
            />
          </div>

          {resultados.length > 0 && (
            <div className="mt-3 row g-3 text-start">
              {resultados.map(u => (
                <UserCardComp
                  key={u.id}
                  user={u}
                  esAmigo={amigoIds.has(u.id) || !!u.es_seguido}
                  onAgregar={agregar}
                  onEliminar={eliminar}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 justify-content-center">
        <button style={tabStyle(tab === 'amigos')} onClick={() => setTab('amigos')}>
          🤝 Mis amigos ({amigos.length})
        </button>
        <button style={tabStyle(tab === 'descubrir')} onClick={() => setTab('descubrir')}>
          🌎 Descubrí lectores ({todos.length})
        </button>
      </div>

      {/* ── TAB: Mis amigos ── */}
      {tab === 'amigos' && (
        <div className="row g-4 align-items-start">

          {/* Lista amigos */}
          <div className="col-lg-8">
            {loading ? (
              <div className="text-muted py-5 text-center">
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                Cargando...
              </div>
            ) : amigos.length === 0 ? (
              <div className="card p-5 text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <p className="text-muted mb-3">Aún no seguís a nadie.</p>
                <button className="btn-gold btn-sm mx-auto" style={{ width: 'fit-content' }} onClick={() => setTab('descubrir')}>
                  Explorar lectores →
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {amigos.map(a => (
                  <UserCardComp key={a.id} user={a} esAmigo={true} onAgregar={agregar} onEliminar={eliminar} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '1.5rem' }}>
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
                          onError={e => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/img/personajes/personaje_1.png' }}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.85rem' }}>@{s.username}</div>
                          {!!s.libros_en_comun && s.libros_en_comun > 0 && (
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
              <div className="card p-4" style={{ borderLeft: '4px solid var(--accent-gold)', background: 'rgba(212,175,55,0.04)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💡</div>
                <p className="text-white small mb-0" style={{ fontStyle: 'italic' }}>
                  Seguí lectores para ver su actividad en tu feed y comparar bibliotecas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Descubrí lectores ── */}
      {tab === 'descubrir' && (
        <div>
          {/* Buscador local dentro de la tab */}
          <div className="mb-4 mx-auto" style={{ maxWidth: 420 }}>
            <input
              type="text"
              className="form-control"
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              placeholder="Filtrar por usuario o nombre..."
              value={filtroBusq}
              onChange={e => setFiltroBusq(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-muted py-5 text-center">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Cargando...
            </div>
          ) : todosFiltered.length === 0 ? (
            <div className="card p-5 text-center text-muted">No se encontraron lectores.</div>
          ) : (
            <>
              {/* Separador: ya seguidos / no seguidos */}
              {(() => {
                const noSeguidos = todosFiltered.filter(u => !amigoIds.has(u.id))
                const seguidos   = todosFiltered.filter(u => amigoIds.has(u.id))
                return (
                  <>
                    {noSeguidos.length > 0 && (
                      <>
                        <h5 className="font-title mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Lectores que no seguís aún · {noSeguidos.length}
                        </h5>
                        <div className="row g-3 mb-5">
                          {noSeguidos.map(u => (
                            <UserCardComp key={u.id} user={u} esAmigo={false} onAgregar={agregar} onEliminar={eliminar} />
                          ))}
                        </div>
                      </>
                    )}
                    {seguidos.length > 0 && (
                      <>
                        <h5 className="font-title mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Ya seguís · {seguidos.length}
                        </h5>
                        <div className="row g-3">
                          {seguidos.map(u => (
                            <UserCardComp key={u.id} user={u} esAmigo={true} onAgregar={agregar} onEliminar={eliminar} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </div>
      )}

    </div>
  )
}
