'use client'

import { useState, useEffect } from 'react'
import type { LibroRecomendado } from '@/app/api/recomendaciones/route'
import type { LibroAmigo } from '@/lib/dao/libroDAO'

const MOODS: { key: string; emoji: string; descripcion: string; color: string }[] = [
  { key: 'Relajado',    emoji: '☕', descripcion: 'Algo tranquilo y cómodo',     color: '#4a9e7a' },
  { key: 'Aventurero',  emoji: '🗺️', descripcion: 'Acción, aventura, adrenalina', color: '#e67e22' },
  { key: 'Emotivo',     emoji: '💛', descripcion: 'Algo que me llegue adentro',   color: '#f39c12' },
  { key: 'Intelectual', emoji: '🧠', descripcion: 'Para pensar y aprender',       color: '#8e44ad' },
  { key: 'Nostálgico',  emoji: '🌅', descripcion: 'Clásicos y recuerdos',         color: '#c0392b' },
  { key: 'Inspirador',  emoji: '🔥', descripcion: 'Que me motive y mueva',        color: '#d4af37' },
  { key: 'Oscuro',      emoji: '🌑', descripcion: 'Thriller, horror, suspenso',   color: '#2c3e50' },
  { key: 'Divertido',   emoji: '😂', descripcion: 'Humor y ligereza',             color: '#1abc9c' },
]

const TABS = [
  { key: 'mood',       label: '🎭 Tu mood',          desc: 'Según cómo te sentís hoy' },
  { key: 'favoritos',  label: '⭐ Tus favoritos',     desc: 'Más libros de tus autores preferidos' },
  { key: 'amigos',     label: '👥 Tus amigos leen',   desc: 'Lo que leyeron quienes seguís' },
]

interface Props {
  moodFavorito: string
  topGeneros: string[]
}

export default function RecomendacionesClient({ moodFavorito, topGeneros }: Props) {
  const [tab, setTab] = useState<'mood' | 'favoritos' | 'amigos'>('mood')
  const [moodSeleccionado, setMoodSeleccionado] = useState(moodFavorito || 'Relajado')
  const [libros, setLibros] = useState<LibroRecomendado[]>([])
  const [librosAmigos, setLibrosAmigos] = useState<LibroAmigo[]>([])
  const [autoresBase, setAutoresBase] = useState<string[]>([])
  const [sinFavoritos, setSinFavoritos] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [yaAgregados, setYaAgregados] = useState<Set<string>>(new Set())
  const [agregando, setAgregando] = useState<string | null>(null)

  const moodActual = MOODS.find(m => m.key === moodSeleccionado) || MOODS[0]

  useEffect(() => {
    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, moodSeleccionado])

  async function cargar() {
    setCargando(true)
    setLibros([])
    setLibrosAmigos([])
    setSinFavoritos(false)
    try {
      const url = tab === 'mood'
        ? `/api/recomendaciones?tipo=mood&mood=${encodeURIComponent(moodSeleccionado)}`
        : `/api/recomendaciones?tipo=${tab}`
      const res = await fetch(url)
      const data = await res.json()
      if (tab === 'amigos') {
        setLibrosAmigos(data.libros || [])
      } else {
        setLibros(data.libros || [])
        if (tab === 'favoritos') {
          setAutoresBase(data.autoresBase || [])
          setSinFavoritos(data.sinFavoritos || false)
        }
      }
    } finally {
      setCargando(false)
    }
  }

  async function agregarLibro(titulo: string, autor: string, portada: string | null, id?: string) {
    const key = id || titulo
    setAgregando(key)
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'nuevo',
          titulo,
          autor,
          estado: 'PENDIENTE',
          portada_url: portada || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        setYaAgregados(prev => { const s = new Set(prev); s.add(key); return s })
      }
    } finally {
      setAgregando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HEADER CON TABS ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 60%, #1a1208 100%)',
        borderBottom: '2px solid rgba(212,175,55,0.2)',
        padding: '2.5rem 0 0',
      }}>
        <div className="container">
          <div className="text-center mb-4">
            <h1 className="font-title display-5 mb-2" style={{ color: '#fff' }}>Recomendaciones</h1>
            <p className="text-muted" style={{ fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
              Descubrí tu próxima lectura de tres formas distintas
            </p>
          </div>

          {/* Tabs */}
          <div className="d-flex justify-content-center gap-2 mb-0" style={{ flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '12px 12px 0 0',
                  border: 'none',
                  background: tab === t.key
                    ? 'rgba(212,175,55,0.12)'
                    : 'transparent',
                  borderBottom: tab === t.key
                    ? '3px solid #d4af37'
                    : '3px solid transparent',
                  color: tab === t.key ? '#d4af37' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  fontWeight: tab === t.key ? 700 : 400,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-4">

        {/* ── TAB: MOOD ── */}
        {tab === 'mood' && (
          <>
            <div className="text-center mb-4">
              <p className="text-muted small">¿Cómo te sentís hoy?</p>
              {topGeneros.length > 0 && (
                <p style={{ fontSize: '0.78rem', color: 'rgba(212,175,55,0.7)' }}>
                  ✦ Combinado con tus géneros: {topGeneros.join(', ')}
                </p>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.65rem',
              maxWidth: 750,
              margin: '0 auto 2rem',
            }}>
              {MOODS.map(m => {
                const activo = m.key === moodSeleccionado
                return (
                  <button key={m.key} onClick={() => setMoodSeleccionado(m.key)} style={{
                    background: activo ? `linear-gradient(135deg, ${m.color}33, ${m.color}18)` : 'rgba(255,255,255,0.04)',
                    border: activo ? `2px solid ${m.color}` : '2px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '0.8rem 0.6rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    transform: activo ? 'translateY(-3px)' : 'none',
                    boxShadow: activo ? `0 8px 20px ${m.color}30` : 'none',
                  }}>
                    <div style={{ fontSize: '1.5rem', lineHeight: 1, marginBottom: '0.3rem' }}>{m.emoji}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: activo ? '#fff' : 'rgba(255,255,255,0.6)', marginBottom: '0.15rem' }}>{m.key}</div>
                    <div style={{ fontSize: '0.6rem', color: activo ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{m.descripcion}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── TAB: FAVORITOS ── */}
        {tab === 'favoritos' && !cargando && (
          <div className="text-center mb-4">
            {sinFavoritos ? (
              <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⭐</div>
                Calificá libros con 4 o 5 estrellas para obtener recomendaciones basadas en tus autores favoritos.
              </div>
            ) : autoresBase.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'rgba(212,175,55,0.7)' }}>
                ✦ Otros libros de: {autoresBase.join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* ── TAB: AMIGOS ── */}
        {tab === 'amigos' && !cargando && librosAmigos.length === 0 && (
          <div className="text-center py-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>👥</div>
            <p>Seguí a otros lectores para ver qué están leyendo.</p>
          </div>
        )}

        {/* ── HEADER RESULTADOS ── */}
        {(tab !== 'amigos' || librosAmigos.length > 0) && (tab !== 'favoritos' || !sinFavoritos) && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              {tab === 'mood' && (
                <h2 className="font-title h5 mb-1" style={{ color: '#fff' }}>
                  {moodActual.emoji} Para cuando estás {moodSeleccionado.toLowerCase()}
                </h2>
              )}
              {tab === 'favoritos' && <h2 className="font-title h5 mb-1" style={{ color: '#fff' }}>Más de tus autores favoritos</h2>}
              {tab === 'amigos' && <h2 className="font-title h5 mb-1" style={{ color: '#fff' }}>Lo que leen tus amigos</h2>}
              {!cargando && (tab === 'amigos' ? librosAmigos.length : libros.length) > 0 && (
                <p className="text-muted small mb-0">{tab === 'amigos' ? librosAmigos.length : libros.length} resultados</p>
              )}
            </div>
            <button onClick={cargar} className="btn btn-outline-secondary btn-sm" disabled={cargando}>
              {cargando ? '⟳' : '↻'} Refrescar
            </button>
          </div>
        )}

        {/* ── SKELETON ── */}
        {cargando && (
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="col">
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', animation: 'pulse 1.5s ease-in-out infinite' }}>
                  <div style={{ height: 200, background: 'rgba(255,255,255,0.05)' }} />
                  <div className="p-3">
                    <div style={{ height: 11, background: 'rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 7 }} />
                    <div style={{ height: 9, background: 'rgba(255,255,255,0.04)', borderRadius: 5, width: '65%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GRID: MOOD / FAVORITOS ── */}
        {!cargando && tab !== 'amigos' && libros.length > 0 && (
          <LibrosGrid libros={libros} yaAgregados={yaAgregados} agregando={agregando} onAgregar={(l) => agregarLibro(l.titulo, l.autor, l.portada, l.id)} />
        )}

        {/* ── GRID: AMIGOS ── */}
        {!cargando && tab === 'amigos' && librosAmigos.length > 0 && (
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-3">
            {librosAmigos.map(libro => {
              const key = libro.titulo
              const agregado = yaAgregados.has(key)
              return (
                <div key={key} className="col">
                  <LibroCard
                    titulo={libro.titulo}
                    autor={libro.autor}
                    portada={libro.portada_url}
                    badge={libro.amigos_leyeron > 1
                      ? `${libro.amigos_leyeron} amigos`
                      : libro.amigos_names.split(',')[0].trim()}
                    badgeColor="#3498db"
                    agregado={agregado}
                    cargando={agregando === key}
                    onAgregar={() => agregarLibro(libro.titulo, libro.autor, libro.portada_url)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function LibrosGrid({ libros, yaAgregados, agregando, onAgregar }: {
  libros: LibroRecomendado[]
  yaAgregados: Set<string>
  agregando: string | null
  onAgregar: (l: LibroRecomendado) => void
}) {
  return (
    <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-3">
      {libros.map(libro => (
        <div key={libro.id} className="col">
          <LibroCard
            titulo={libro.titulo}
            autor={libro.autor}
            portada={libro.portada}
            descripcion={libro.descripcion}
            rating={libro.rating}
            agregado={yaAgregados.has(libro.id)}
            cargando={agregando === libro.id}
            onAgregar={() => onAgregar(libro)}
          />
        </div>
      ))}
    </div>
  )
}

function LibroCard({ titulo, autor, portada, descripcion, rating, badge, badgeColor, agregado, cargando, onAgregar }: {
  titulo: string
  autor: string
  portada: string | null
  descripcion?: string
  rating?: number
  badge?: string
  badgeColor?: string
  agregado: boolean
  cargando: boolean
  onAgregar: () => void
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: agregado ? '1px solid rgba(39,174,96,0.4)' : '1px solid rgba(212,175,55,0.1)',
      borderRadius: 12, overflow: 'hidden',
      height: '100%', display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Portada */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {portada ? (
          <img src={portada.replace('http://', 'https://')} alt={titulo}
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{ height: 200, background: '#2c2724', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📚</div>
        )}
        {rating && rating > 0 && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '2px 7px', fontSize: '0.68rem', fontWeight: 700, color: '#d4af37' }}>
            ⭐ {rating.toFixed(1)}
          </div>
        )}
        {badge && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: badgeColor || '#d4af37', borderRadius: 20, padding: '2px 7px', fontSize: '0.62rem', fontWeight: 700, color: '#fff', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {badge}
          </div>
        )}
        {agregado && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>✅</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.8rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {titulo}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{autor}</div>
        {descripcion && (
          <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {descripcion}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          {agregado ? (
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#27ae60', fontWeight: 700 }}>✓ En tu biblioteca</div>
          ) : (
            <button onClick={onAgregar} disabled={cargando} style={{
              width: '100%',
              background: cargando ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg, #d4af37, #f1c40f)',
              border: 'none', borderRadius: 7, padding: '0.4rem',
              fontSize: '0.7rem', fontWeight: 700, color: '#000',
              cursor: cargando ? 'default' : 'pointer', transition: 'opacity 0.15s',
            }}>
              {cargando ? '...' : '+ Agregar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
