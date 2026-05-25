'use client'

import { useState, useEffect } from 'react'
import type { LibroRecomendado } from '@/app/api/recomendaciones/route'
import BannerExplicativo from '@/components/BannerExplicativo'

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

interface Props {
  moodFavorito: string
  topGeneros: string[]
}

export default function RecomendacionesClient({ moodFavorito, topGeneros }: Props) {
  const [moodSeleccionado, setMoodSeleccionado] = useState(moodFavorito || 'Relajado')
  const [libros, setLibros] = useState<LibroRecomendado[]>([])
  const [cargando, setCargando] = useState(false)
  const [yaAgregados, setYaAgregados] = useState<Set<string>>(new Set())
  const [agregando, setAgregando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')

  const moodActual = MOODS.find(m => m.key === moodSeleccionado) || MOODS[0]

  useEffect(() => {
    buscarRecomendaciones(moodSeleccionado)
  }, [moodSeleccionado])

  async function buscarRecomendaciones(mood: string) {
    setCargando(true)
    setLibros([])
    setMensaje('')
    try {
      const res = await fetch(`/api/recomendaciones?mood=${encodeURIComponent(mood)}`)
      const data = await res.json()
      setLibros(data.libros || [])
    } catch {
      setMensaje('Error al cargar recomendaciones.')
    } finally {
      setCargando(false)
    }
  }

  async function agregarLibro(libro: LibroRecomendado) {
    setAgregando(libro.id)
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'nuevo',
          titulo: libro.titulo,
          autor: libro.autor,
          anio: libro.anio,
          paginas: libro.paginas,
          estado: 'PENDIENTE',
          portada_url: libro.portada,
        }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        setYaAgregados(prev => { const s = new Set(prev); s.add(libro.id); return s })
      }
    } finally {
      setAgregando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 60%, #1a1208 100%)',
        borderBottom: '2px solid rgba(212,175,55,0.2)',
        padding: '3.5rem 0 3rem',
      }}>
        <div className="container">
          <div className="text-center mb-4">
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', lineHeight: 1 }}>
              {moodActual.emoji}
            </div>
            <h1 className="font-title display-5 mb-2" style={{ color: '#fff' }}>
              Recomendaciones
            </h1>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
              Decinos cómo te sentís hoy y te recomendamos el próximo libro perfecto.
            </p>
            {topGeneros.length > 0 && (
              <p className="mt-2" style={{ fontSize: '0.8rem', color: 'rgba(212,175,55,0.7)' }}>
                ✦ Personalizado con tus géneros favoritos: {topGeneros.join(', ')}
              </p>
            )}
          </div>

          {/* Selector de moods */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            maxWidth: 800,
            margin: '0 auto',
          }}>
            {MOODS.map(m => {
              const activo = m.key === moodSeleccionado
              return (
                <button
                  key={m.key}
                  onClick={() => setMoodSeleccionado(m.key)}
                  style={{
                    background: activo
                      ? `linear-gradient(135deg, ${m.color}33, ${m.color}18)`
                      : 'rgba(255,255,255,0.04)',
                    border: activo
                      ? `2px solid ${m.color}`
                      : '2px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '0.9rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    transform: activo ? 'translateY(-3px)' : 'none',
                    boxShadow: activo ? `0 8px 24px ${m.color}30` : 'none',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: '0.35rem' }}>
                    {m.emoji}
                  </div>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: activo ? '#fff' : 'rgba(255,255,255,0.6)',
                    marginBottom: '0.2rem',
                  }}>
                    {m.key}
                  </div>
                  <div style={{
                    fontSize: '0.62rem',
                    color: activo ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                    lineHeight: 1.3,
                  }}>
                    {m.descripcion}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── RESULTADOS ── */}
      <div className="container py-5">
        <BannerExplicativo
          icon="✨"
          titulo="Recomendaciones para vos"
          descripcion="Libros elegidos según tu estado de ánimo"
          pasos={[
            { icon: '🎭', texto: 'Elegí tu mood del momento' },
            { icon: '🤖', texto: 'Recibís sugerencias personalizadas' },
            { icon: '📚', texto: 'Basadas en tus géneros favoritos' },
            { icon: '➕', texto: 'Agregá los que te gusten directo a tu biblioteca' },
          ]}
          color="#9b59b6"
        />

        {/* Header resultados */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="font-title h4 mb-1" style={{ color: '#fff' }}>
              {moodActual.emoji} Libros para cuando estás {moodSeleccionado.toLowerCase()}
            </h2>
            {!cargando && libros.length > 0 && (
              <p className="text-muted small mb-0">{libros.length} recomendaciones encontradas</p>
            )}
          </div>
          <button
            onClick={() => buscarRecomendaciones(moodSeleccionado)}
            className="btn btn-outline-secondary btn-sm"
            disabled={cargando}
          >
            {cargando ? '⟳' : '↻'} Refrescar
          </button>
        </div>

        {mensaje && <div className="alert alert-danger">{mensaje}</div>}

        {/* Skeleton loader */}
        {cargando && (
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="col">
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, overflow: 'hidden',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <div style={{ height: 220, background: 'rgba(255,255,255,0.05)' }} />
                  <div className="p-3">
                    <div style={{ height: 12, background: 'rgba(255,255,255,0.07)', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 6, width: '70%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de libros */}
        {!cargando && libros.length > 0 && (
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-4">
            {libros.map(libro => {
              const agregado = yaAgregados.has(libro.id)
              const esteAgregando = agregando === libro.id
              return (
                <div key={libro.id} className="col">
                  <div style={{
                    background: 'var(--bg-card)',
                    border: agregado
                      ? '1px solid rgba(39,174,96,0.4)'
                      : '1px solid rgba(212,175,55,0.1)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    }}
                  >
                    {/* Portada */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt={libro.titulo}
                          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div style={{ height: 220, background: '#2c2724', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                          📚
                        </div>
                      )}
                      {/* Rating badge */}
                      {libro.rating > 0 && (
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                          borderRadius: 20, padding: '2px 8px',
                          fontSize: '0.7rem', fontWeight: 700, color: '#d4af37',
                        }}>
                          ⭐ {libro.rating.toFixed(1)}
                        </div>
                      )}
                      {/* Check si ya está agregado */}
                      {agregado && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(39,174,96,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2.5rem',
                        }}>
                          ✅
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{
                        fontSize: '0.82rem', fontWeight: 700, color: '#fff',
                        lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {libro.titulo}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                        {libro.autor}
                      </div>
                      {libro.descripcion && (
                        <div style={{
                          fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)',
                          lineHeight: 1.4, marginTop: '0.25rem',
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {libro.descripcion}
                        </div>
                      )}
                      <div style={{ marginTop: 'auto', paddingTop: '0.6rem' }}>
                        {agregado ? (
                          <div style={{
                            textAlign: 'center', fontSize: '0.72rem',
                            color: '#27ae60', fontWeight: 700,
                          }}>
                            ✓ En tu biblioteca
                          </div>
                        ) : (
                          <button
                            onClick={() => agregarLibro(libro)}
                            disabled={esteAgregando}
                            style={{
                              width: '100%',
                              background: esteAgregando
                                ? 'rgba(212,175,55,0.3)'
                                : 'linear-gradient(135deg, #d4af37, #f1c40f)',
                              border: 'none', borderRadius: 8,
                              padding: '0.45rem',
                              fontSize: '0.72rem', fontWeight: 700,
                              color: '#000', cursor: esteAgregando ? 'default' : 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {esteAgregando ? 'Agregando...' : '+ Agregar a biblioteca'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!cargando && libros.length === 0 && !mensaje && (
          <div className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <p className="text-muted">No encontramos resultados. Probá otro mood.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
