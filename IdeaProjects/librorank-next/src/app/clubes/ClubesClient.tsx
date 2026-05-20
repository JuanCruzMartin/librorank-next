'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Club } from '@/lib/dao/clubDAO'

const COMO_FUNCIONA = [
  { emoji: '📖', titulo: 'Elegís un libro', texto: 'Al crear el club indicás qué libro van a leer juntos. Puede ser cualquiera.' },
  { emoji: '👥', titulo: 'Invitás lectores', texto: 'Compartís el link del club. Cualquier usuario de LibroRank puede unirse (hasta el límite que definas).' },
  { emoji: '💬', titulo: 'Discuten por capítulos', texto: 'Cada mensaje pertenece a un capítulo. Así evitás spoilers y las conversaciones quedan organizadas.' },
  { emoji: '🔒', titulo: 'Sin spoilers', texto: 'Solo ves los mensajes del capítulo que elegís. El ritmo lo define cada lector.' },
]

interface Props {
  clubesIniciales: Club[]
}

export default function ClubesClient({ clubesIniciales }: Props) {
  const router = useRouter()
  const [clubes, setClubes] = useState(clubesIniciales)
  const [showCrear, setShowCrear] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [uniendose, setUniendose] = useState<number | null>(null)

  // form crear
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [libroTitulo, setLibroTitulo] = useState('')
  const [libroAutor, setLibroAutor] = useState('')
  const [libroPortada, setLibroPortada] = useState('')
  const [maxMiembros, setMaxMiembros] = useState(20)
  const [privado, setPrivado] = useState(false)
  // busqueda google books para el form
  const [busqLibro, setBusqLibro] = useState('')
  const [sugerencias, setSugerencias] = useState<{ titulo: string; autor: string; portada: string }[]>([])

  async function buscarLibro(q: string) {
    setBusqLibro(q)
    if (q.length < 3) { setSugerencias([]); return }
    const res = await fetch(`/api/libros/buscar?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSugerencias(data.slice(0, 5))
  }

  function seleccionarLibro(s: { titulo: string; autor: string; portada: string }) {
    setLibroTitulo(s.titulo)
    setLibroAutor(s.autor)
    setLibroPortada(s.portada)
    setBusqLibro(s.titulo)
    setSugerencias([])
  }

  async function crearClub(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError('')
    try {
      const res = await fetch('/api/clubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear', nombre, descripcion,
          libro_titulo: libroTitulo, libro_autor: libroAutor, libro_portada: libroPortada,
          max_miembros: maxMiembros, privado,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Error al crear'); return }
      router.push(`/clubes/${json.clubId}`)
    } finally { setGuardando(false) }
  }

  async function unirse(clubId: number) {
    setUniendose(clubId)
    try {
      const res = await fetch('/api/clubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'unirse', clubId }),
      })
      const json = await res.json()
      if (res.ok && json.ok) router.push(`/clubes/${clubId}`)
      else setError(json.error || 'No se pudo unir')
    } finally { setUniendose(null) }
  }

  const misClubes = clubes.filter(c => c.soy_miembro)
  const otrosClubes = clubes.filter(c => !c.soy_miembro)

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a0a0a 0%,#151515 60%,#0d1a0d 100%)',
        borderBottom: '2px solid rgba(212,175,55,0.2)',
        padding: '3.5rem 0 3rem',
      }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📚</div>
              <h1 className="font-title display-5 mb-3" style={{ color: '#fff' }}>
                Clubes de Lectura
              </h1>
              <p className="text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                Leé el mismo libro con otros lectores, discutí capítulo por capítulo y compartí la experiencia sin spoilers.
              </p>
              <button
                onClick={() => setShowCrear(true)}
                className="btn-gold"
                style={{ fontSize: '1rem', padding: '0.75rem 2rem', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                + Crear mi club
              </button>
            </div>

            {/* Cómo funciona */}
            <div className="col-lg-6">
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: 16, padding: '1.5rem',
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', marginBottom: '1rem' }}>
                  ¿Cómo funciona?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {COMO_FUNCIONA.map((paso, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                      <div style={{
                        flexShrink: 0, width: 38, height: 38,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem',
                      }}>
                        {paso.emoji}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: '0.15rem' }}>
                          {paso.titulo}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                          {paso.texto}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="container py-5">
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {/* Mis clubes */}
        {misClubes.length > 0 && (
          <div className="mb-5">
            <h2 className="font-title h5 mb-3" style={{ color: 'var(--accent-gold)' }}>
              📖 Mis clubes
            </h2>
            <div className="row g-4">
              {misClubes.map(c => (
                <ClubCard key={c.id} club={c} onUnirse={unirse} uniendose={uniendose} />
              ))}
            </div>
          </div>
        )}

        {/* Otros clubes */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="font-title h5 mb-0" style={{ color: '#fff' }}>
              🌐 Clubes abiertos
            </h2>
            <span className="text-muted small">{otrosClubes.length} disponibles</span>
          </div>

          {otrosClubes.length === 0 && misClubes.length === 0 && (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
              <p className="text-muted mb-3">Todavía no hay clubes. ¡Sé el primero en crear uno!</p>
              <button onClick={() => setShowCrear(true)} className="btn-gold" style={{ border: 'none', padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                + Crear club
              </button>
            </div>
          )}

          {otrosClubes.length > 0 && (
            <div className="row g-4">
              {otrosClubes.map(c => (
                <ClubCard key={c.id} club={c} onUnirse={unirse} uniendose={uniendose} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL CREAR ── */}
      {showCrear && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCrear(false) }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 20 }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title font-title" style={{ color: 'var(--accent-gold)' }}>📚 Crear club de lectura</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowCrear(false)} />
              </div>
              <form onSubmit={crearClub}>
                <div className="modal-body py-4">
                  {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>{error}</div>}
                  <div className="row g-3">

                    {/* Nombre del club */}
                    <div className="col-12">
                      <label className="form-label">Nombre del club *</label>
                      <input
                        type="text" className="form-control"
                        placeholder="Ej: Club de los Martes, Fanáticos de Sanderson..."
                        value={nombre} onChange={e => setNombre(e.target.value)} required
                      />
                    </div>

                    {/* Descripción */}
                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control" rows={2}
                        placeholder="¿De qué trata el club? ¿Hay reglas o temática?"
                        value={descripcion} onChange={e => setDescripcion(e.target.value)}
                      />
                    </div>

                    {/* Libro */}
                    <div className="col-12">
                      <label className="form-label">Libro a leer</label>
                      <div className="position-relative">
                        <input
                          type="text" className="form-control"
                          placeholder="Buscá el libro o escribí el título manualmente..."
                          value={busqLibro}
                          onChange={e => buscarLibro(e.target.value)}
                        />
                        {sugerencias.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#2c2724', border: '1px solid rgba(212,175,55,0.3)',
                            borderRadius: 8, zIndex: 999, maxHeight: 250, overflowY: 'auto',
                          }}>
                            {sugerencias.map((s, i) => (
                              <button key={i} type="button"
                                onClick={() => seleccionarLibro(s)}
                                style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '0.6rem', background: 'none', border: 'none', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                {s.portada && <img src={s.portada} alt="" style={{ height: 40, borderRadius: 4 }} />}
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.titulo}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{s.autor}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Campos manuales si no hay sugerencia */}
                      {libroTitulo && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                          {libroPortada && <img src={libroPortada} alt="" style={{ height: 44, borderRadius: 4 }} />}
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{libroTitulo}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{libroAutor}</div>
                          </div>
                          <button type="button" onClick={() => { setLibroTitulo(''); setLibroAutor(''); setLibroPortada(''); setBusqLibro('') }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                        </div>
                      )}
                      {!libroTitulo && busqLibro.length > 0 && sugerencias.length === 0 && (
                        <div className="row g-2 mt-1">
                          <div className="col-6">
                            <input type="text" className="form-control form-control-sm" placeholder="Título exacto"
                              value={libroTitulo} onChange={e => setLibroTitulo(e.target.value)} />
                          </div>
                          <div className="col-6">
                            <input type="text" className="form-control form-control-sm" placeholder="Autor"
                              value={libroAutor} onChange={e => setLibroAutor(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Config */}
                    <div className="col-6">
                      <label className="form-label">Máximo de miembros</label>
                      <select className="form-select" value={maxMiembros} onChange={e => setMaxMiembros(Number(e.target.value))}>
                        {[5, 10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n} miembros</option>)}
                      </select>
                    </div>

                    <div className="col-6 d-flex align-items-end">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', paddingBottom: '0.75rem' }}>
                        <input type="checkbox" checked={privado} onChange={e => setPrivado(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
                        Club privado (solo por invitación)
                      </label>
                    </div>

                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowCrear(false)}>Cancelar</button>
                  <button type="submit" className="btn-gold btn-sm" disabled={guardando}
                    style={{ border: 'none', padding: '0.4rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: guardando ? 'default' : 'pointer' }}>
                    {guardando ? 'Creando...' : '✓ Crear club'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClubCard({ club, onUnirse, uniendose }: { club: Club; onUnirse: (id: number) => void; uniendose: number | null }) {
  const router = useRouter()
  const lleno = club.total_miembros >= club.max_miembros
  const pct = Math.round((club.total_miembros / club.max_miembros) * 100)

  return (
    <div className="col-md-6 col-lg-4">
      <div style={{
        background: 'var(--bg-card)',
        border: club.soy_miembro ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        {/* Header con portada */}
        <div style={{ position: 'relative', height: 90, background: 'linear-gradient(135deg,#1a1208,#0d1a0d)', display: 'flex', alignItems: 'center', padding: '1rem', gap: '0.75rem' }}>
          {club.libro_portada ? (
            <img src={club.libro_portada} alt="" style={{ height: 70, width: 48, objectFit: 'cover', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', flexShrink: 0 }} />
          ) : (
            <div style={{ height: 70, width: 48, background: 'rgba(212,175,55,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>📚</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', lineHeight: 1.3, marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {club.nombre}
            </div>
            {club.libro_titulo && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📖 {club.libro_titulo}
              </div>
            )}
          </div>
          {club.soy_creador && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 20, padding: '2px 8px', fontSize: '0.6rem', fontWeight: 800, color: '#d4af37' }}>
              CREADOR
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {club.descripcion && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {club.descripcion}
            </p>
          )}

          {/* Creador */}
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
            por <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>@{club.creador_username}</span>
          </div>

          {/* Barra de miembros */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.3rem' }}>
              <span>👥 {club.total_miembros} / {club.max_miembros} miembros</span>
              {lleno && <span style={{ color: '#e74c3c', fontWeight: 700 }}>COMPLETO</span>}
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: lleno ? '#e74c3c' : 'linear-gradient(90deg,#27ae60,#2ecc71)', borderRadius: 99 }} />
            </div>
          </div>

          {/* Acción */}
          <div style={{ paddingTop: '0.5rem' }}>
            {club.soy_miembro ? (
              <button
                onClick={() => router.push(`/clubes/${club.id}`)}
                style={{ width: '100%', background: 'linear-gradient(135deg,#d4af37,#f1c40f)', border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#000' }}>
                Entrar al club →
              </button>
            ) : (
              <button
                onClick={() => !lleno && onUnirse(club.id)}
                disabled={lleno || uniendose === club.id}
                style={{ width: '100%', background: lleno ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)', border: `1px solid ${lleno ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 8, padding: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: lleno ? 'default' : 'pointer', color: lleno ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                {uniendose === club.id ? 'Uniéndose...' : lleno ? 'Club completo' : '+ Unirse al club'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
