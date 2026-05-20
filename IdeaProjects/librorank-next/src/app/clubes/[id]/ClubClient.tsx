'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Club, ClubMiembro, ClubPost } from '@/lib/dao/clubDAO'

const CAPITULOS_SUGERIDOS = [
  'General', 'Caps. 1–5', 'Caps. 6–10', 'Caps. 11–15', 'Caps. 16–20',
  'Caps. 21–25', 'Caps. 26–30', 'Segunda mitad', 'Final del libro', 'Opinión general',
]

interface Props {
  club: Club
  miembrosIniciales: ClubMiembro[]
  postsIniciales: ClubPost[]
  usuarioId: number
}

export default function ClubClient({ club, miembrosIniciales, postsIniciales, usuarioId }: Props) {
  const [posts, setPosts] = useState(postsIniciales)
  const [capituloActivo, setCapituloActivo] = useState('General')
  const [contenido, setContenido] = useState('')
  const [capituloNuevo, setCapituloNuevo] = useState('General')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [showMiembros, setShowMiembros] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Capítulos con posts
  const capitulosConPosts = Array.from(new Set(posts.map(p => p.capitulo)))
  const todosCapitulos = Array.from(new Set(CAPITULOS_SUGERIDOS.concat(capitulosConPosts)))

  const postsFiltrados = posts.filter(p => p.capitulo === capituloActivo)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [postsFiltrados.length])

  async function enviarPost(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    setEnviando(true); setError('')
    try {
      const res = await fetch(`/api/clubes/${club.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capitulo: capituloNuevo, contenido }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Error'); return }

      // Agregar el post localmente (optimistic)
      const nuevoPost: ClubPost = {
        id: Date.now(),
        club_id: club.id,
        usuario_id: usuarioId,
        username: miembrosIniciales.find(m => m.usuario_id === usuarioId)?.username || '',
        nombre: miembrosIniciales.find(m => m.usuario_id === usuarioId)?.nombre || '',
        avatar_url: miembrosIniciales.find(m => m.usuario_id === usuarioId)?.avatar_url || null,
        capitulo: capituloNuevo,
        contenido,
        fecha_creacion: new Date().toISOString(),
      }
      setPosts(prev => [...prev, nuevoPost])
      if (!capitulosConPosts.includes(capituloNuevo)) setCapituloActivo(capituloNuevo)
      else setCapituloActivo(capituloNuevo)
      setContenido('')
    } finally { setEnviando(false) }
  }

  async function salirDelClub() {
    if (!confirm('¿Querés salir de este club?')) return
    await fetch('/api/clubes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'salir', clubId: club.id }),
    })
    window.location.href = '/clubes'
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HEADER DEL CLUB ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a0a0a,#0d1a0d)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        padding: '1.5rem 0',
      }}>
        <div className="container">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <Link href="/clubes" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Volver
            </Link>

            {club.libro_portada && (
              <img src={club.libro_portada} alt="" style={{ height: 64, width: 44, objectFit: 'cover', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }} />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="font-title h4 mb-1 text-white" style={{ lineHeight: 1.2 }}>{club.nombre}</h1>
              {club.libro_titulo && (
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  📖 <em>{club.libro_titulo}</em>
                  {club.libro_autor && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {club.libro_autor}</span>}
                </p>
              )}
            </div>

            <div className="d-flex align-items-center gap-3">
              <button
                onClick={() => setShowMiembros(!showMiembros)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.4rem 0.9rem', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                👥 {club.total_miembros} miembros
              </button>
              {!club.soy_creador && (
                <button onClick={salirDelClub}
                  style={{ background: 'none', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '0.4rem 0.9rem', color: 'rgba(231,76,60,0.7)', cursor: 'pointer', fontSize: '0.82rem' }}>
                  Salir
                </button>
              )}
            </div>
          </div>

          {/* Panel miembros */}
          {showMiembros && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {miembrosIniciales.map(m => (
                <div key={m.usuario_id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '0.25rem 0.75rem' }}>
                  <img
                    src={m.avatar_url || '/img/personajes/personaje_1.png'}
                    alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = '/img/personajes/personaje_1.png' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>@{m.username}</span>
                  {m.rol === 'creador' && <span style={{ fontSize: '0.6rem', color: '#d4af37' }}>✦</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LAYOUT: Tabs capítulos + Chat ── */}
      <div className="container py-4">
        <div className="row g-4">

          {/* Sidebar: capítulos */}
          <div className="col-lg-3">
            <div className="card p-3" style={{ position: 'sticky', top: '1rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', marginBottom: '0.75rem' }}>
                Salas de discusión
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {todosCapitulos.map(cap => {
                  const count = posts.filter(p => p.capitulo === cap).length
                  const activo = cap === capituloActivo
                  return (
                    <button key={cap} onClick={() => setCapituloActivo(cap)}
                      style={{
                        background: activo ? 'rgba(212,175,55,0.12)' : 'transparent',
                        border: activo ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                        borderRadius: 8, padding: '0.5rem 0.75rem',
                        textAlign: 'left', cursor: 'pointer',
                        color: activo ? '#fff' : 'rgba(255,255,255,0.55)',
                        fontSize: '0.82rem', fontWeight: activo ? 700 : 400,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.15s',
                      }}>
                      <span>{cap}</span>
                      {count > 0 && (
                        <span style={{ background: activo ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)', borderRadius: 99, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 800 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Chat principal */}
          <div className="col-lg-9">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>

              {/* Header del chat */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>💬 {capituloActivo}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>— {postsFiltrados.length} mensaje{postsFiltrados.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Mensajes */}
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', maxHeight: 480, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {postsFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem 0' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💭</div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no hay mensajes en esta sala.</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>¡Sé el primero en comentar!</p>
                  </div>
                ) : (
                  postsFiltrados.map(post => {
                    const esMio = post.usuario_id === usuarioId
                    return (
                      <div key={post.id} style={{ display: 'flex', gap: '0.75rem', flexDirection: esMio ? 'row-reverse' : 'row' }}>
                        <img
                          src={post.avatar_url || '/img/personajes/personaje_1.png'}
                          alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}
                          onError={e => { (e.target as HTMLImageElement).src = '/img/personajes/personaje_1.png' }}
                        />
                        <div style={{ maxWidth: '75%' }}>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textAlign: esMio ? 'right' : 'left' }}>
                            <span style={{ fontWeight: 700, color: esMio ? '#d4af37' : 'rgba(255,255,255,0.7)' }}>
                              {esMio ? 'Vos' : `@${post.username}`}
                            </span>
                            {' · '}
                            {new Date(post.fecha_creacion).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{
                            background: esMio ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                            border: esMio ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: esMio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            padding: '0.65rem 0.9rem',
                            fontSize: '0.875rem', color: '#fff', lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {post.contenido}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Formulario */}
              {club.soy_miembro ? (
                <form onSubmit={enviarPost} style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {error && <div className="alert alert-danger py-2 mb-2" style={{ fontSize: '0.8rem' }}>{error}</div>}
                  <div className="d-flex gap-2 mb-2">
                    <select
                      value={capituloNuevo}
                      onChange={e => setCapituloNuevo(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ maxWidth: 180 }}
                    >
                      {todosCapitulos.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
                      ← elegí la sala de tu mensaje
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <textarea
                      value={contenido}
                      onChange={e => setContenido(e.target.value)}
                      placeholder="Escribí tu comentario..."
                      rows={2}
                      maxLength={1000}
                      className="form-control"
                      style={{ resize: 'none' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (contenido.trim()) enviarPost(e as unknown as React.FormEvent) }
                      }}
                    />
                    <button type="submit" disabled={enviando || !contenido.trim()}
                      style={{ background: contenido.trim() ? 'linear-gradient(135deg,#d4af37,#f1c40f)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '0 1rem', fontWeight: 700, fontSize: '1rem', cursor: contenido.trim() ? 'pointer' : 'default', color: contenido.trim() ? '#000' : 'rgba(255,255,255,0.2)', transition: 'all 0.15s', flexShrink: 0 }}>
                      {enviando ? '...' : '→'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>
                    {contenido.length}/1000 · Enter para enviar
                  </div>
                </form>
              ) : (
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                  Unite al club para participar en la discusión.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
