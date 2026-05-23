'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Usuario, NivelInfo } from '@/lib/dao/usuarioDAO'
import type { Libro, PerfilStats } from '@/lib/dao/libroDAO'
import type { Logro } from '@/lib/dao/logroDAO'

const AVATARES = [
  '/img/avatar_explorador/avatar_explorador_0.png',
  '/img/avatar_explorador/avatar_explorador_1.png',
  '/img/avatar_explorador/avatar_explorador_2.png',
  '/img/avatar_explorador/avatar_explorador_3.png',
  '/img/avatar_maestro/avatar_maestro_0.png',
  '/img/avatar_maestro/avatar_maestro_1.png',
  '/img/avatar_maestro/avatar_maestro_2.png',
  '/img/avatar_maestro/avatar_maestro_3.png',
]


interface Props {
  usuario: Usuario
  stats: PerfilStats
  ultimasLecturas: Libro[]
  logros: Logro[]
  leidosEsteAnio: number
  totalLeidos: number
  nivelInfo: NivelInfo
  esMiPerfil: boolean
}

export default function PerfilClient({
  usuario, stats, ultimasLecturas, logros,
  leidosEsteAnio, totalLeidos, nivelInfo, esMiPerfil,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'resumen' | 'config'>('resumen')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [avatarActual, setAvatarActual] = useState(usuario.avatar_url || '/img/personajes/personaje_1.png')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null)
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 })
  const isDragging = useRef(false)
  const lastDrag = useRef({ x: 0, y: 0 })

  async function guardarPerfil(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {}
    fd.forEach((v, k) => { data[k] = v })
    const res = await fetch('/api/perfil', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setGuardando(false)
    if (res.ok) { setMensaje('¡Perfil actualizado!'); router.refresh() }
    else setMensaje('Error al guardar')
  }

  async function seleccionarAvatar(url: string) {
    await fetch('/api/perfil', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    setAvatarActual(url)
    router.refresh()
  }

  function abrirCrop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropPreviewUrl(URL.createObjectURL(file))
    setCropPos({ x: 50, y: 50 })
    e.target.value = ''
  }

  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    isDragging.current = true
    const pt = 'touches' in e ? e.touches[0] : e
    lastDrag.current = { x: pt.clientX, y: pt.clientY }
  }

  function onDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDragging.current) return
    const pt = 'touches' in e ? e.touches[0] : e
    const dx = pt.clientX - lastDrag.current.x
    const dy = pt.clientY - lastDrag.current.y
    lastDrag.current = { x: pt.clientX, y: pt.clientY }
    setCropPos(prev => ({
      x: Math.max(0, Math.min(100, prev.x - dx * 0.3)),
      y: Math.max(0, Math.min(100, prev.y - dy * 0.3)),
    }))
  }

  function onDragEnd() { isDragging.current = false }

  async function confirmarCrop() {
    if (!cropFile) return
    setSubiendo(true)
    const img = new Image()
    img.src = cropPreviewUrl!
    await new Promise(res => { img.onload = res })
    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 400
    const ctx = canvas.getContext('2d')!
    const size = Math.min(img.width, img.height)
    const sx = (img.width - size) * (cropPos.x / 100)
    const sy = (img.height - size) * (cropPos.y / 100)
    ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const fd = new FormData()
      fd.append('foto', blob, 'avatar.jpg')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      setSubiendo(false)
      setCropFile(null)
      setCropPreviewUrl(null)
      if (json.avatarUrl) { setAvatarActual(json.avatarUrl); setMensaje('¡Foto actualizada!') }
      else setMensaje(json.error || 'Error al subir la foto')
      router.refresh()
    }, 'image/jpeg', 0.92)
  }

  const nivelPct = Math.min((leidosEsteAnio / (usuario.objetivo_anual || 12)) * 100, 100)

  return (
    <div className="container">
      <div className="perfil-layout">

        {/* ══════════════════════════════
            SIDEBAR — 3 cards separadas
        ══════════════════════════════ */}
        <aside className="perfil-side">

          {/* Card 1 — Datos del usuario */}
          <div className="card p-4 text-center">
            <div className="user-avatar" style={{ position: 'relative' }}>
              <img
                src={avatarActual}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = '/img/personajes/personaje_1.png' }}
              />
              {esMiPerfil && (
                <label style={{
                  position: 'absolute', bottom: 4, right: 4,
                  background: 'var(--accent-gold)', borderRadius: '50%',
                  width: 30, height: 30, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  📷
                  <input type="file" accept="image/*" className="d-none" onChange={abrirCrop} />
                </label>
              )}
            </div>

            <div className="user-meta mt-3">
              <h1 className="user-name">{usuario.nombre}</h1>
              <p className="user-handle text-muted">@{usuario.username}</p>
              <span className="badge--level">{nivelInfo.emoji} {nivelInfo.titulo}</span>
            </div>

            <div className="mt-3 text-muted small">
              <div className="fw-bold text-white">Nivel {nivelInfo.nivel} · {usuario.puntos ?? 0} <span style={{ color: 'var(--accent-gold)' }}>⭐</span></div>
              <div className="mt-1">Total leídos: <strong className="text-white">{totalLeidos}</strong></div>
            </div>

            {usuario.bio && (
              <p className="text-muted small mt-3 mb-0" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                &ldquo;{usuario.bio}&rdquo;
              </p>
            )}

            {usuario.generos_favoritos && (
              <div className="mt-3">
                {usuario.generos_favoritos.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                  <span key={g} className="badge-cozy me-1 mb-1" style={{ display: 'inline-block' }}>{g}</span>
                ))}
              </div>
            )}
          </div>

          {/* Card 2 — Progreso de lectura */}
          {usuario.objetivo_anual && (
            <div className="card p-4">
              <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>Progreso de lectura</h6>
              <div className="text-muted small mb-2">
                Objetivo anual: <strong className="text-white">{usuario.objetivo_anual} libros</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{
                  height: '100%',
                  width: `${nivelPct}%`,
                  background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div className="text-muted small">
                Lleva <strong className="text-white">{leidosEsteAnio}</strong> libros este año
                {' · '}
                Faltan <strong className="text-white">{Math.max(0, usuario.objetivo_anual - leidosEsteAnio)}</strong>
              </div>
            </div>
          )}

          {/* Card 3 — Próximo nivel */}
          {nivelInfo.nivel < 12 ? (
            <div className="card p-4">
              <h6 className="font-title mb-2" style={{ color: 'var(--accent-gold)' }}>Próximo nivel</h6>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.6rem' }}>
                <div style={{
                  height: '100%',
                  width: `${nivelInfo.progreso}%`,
                  background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p className="text-muted small mb-2">
                <strong className="text-white">{usuario.puntos ?? 0}</strong> / <strong className="text-white">{nivelInfo.puntosMax}</strong> pts · faltan <strong className="text-white">{Math.max(0, nivelInfo.puntosMax - (usuario.puntos ?? 0))}</strong>
              </p>
              <span style={{
                background: 'rgba(39,174,96,0.15)',
                color: '#27ae60',
                border: '1px solid rgba(39,174,96,0.4)',
                padding: '5px 14px',
                borderRadius: 50,
                fontWeight: 800,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-block',
              }}>
                Siguiente: {nivelInfo.emoji} Nv.{nivelInfo.nivel + 1}
              </span>
            </div>
          ) : (
            <div className="card p-4 text-center">
              <div style={{ fontSize: '2rem' }}>👑</div>
              <p className="text-muted small mt-2 mb-0">¡Oráculo Eterno alcanzado!</p>
            </div>
          )}

          {/* Botón editar (solo dueño) */}
          {esMiPerfil && (
            <button onClick={() => setTab('config')} className="btn--brand w-100">
              ⚙️ Editar Cuenta
            </button>
          )}
        </aside>

        {/* ══════════════════════════════
            CONTENIDO PRINCIPAL
        ══════════════════════════════ */}
        <div className="perfil-main">

          {/* Tabs — solo 2 */}
          {esMiPerfil && (
            <div className="inventory-tabs mb-4">
              <button onClick={() => setTab('resumen')} className={`tab-btn ${tab === 'resumen' ? 'active' : ''}`}>
                ✨ Resumen
              </button>
              <button onClick={() => setTab('config')} className={`tab-btn ${tab === 'config' ? 'active' : ''}`}>
                ⚙️ Editar Cuenta
              </button>
            </div>
          )}

          {/* ── RESUMEN ── */}
          {tab === 'resumen' && (
            <>
              {/* Últimas conquistas */}
              <div className="card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>Últimas conquistas</h5>
                  <Link href="/biblioteca" className="small text-decoration-none" style={{ color: 'var(--accent-gold)' }}>
                    Ver biblioteca completa →
                  </Link>
                </div>

                {ultimasLecturas.length === 0 ? (
                  <p className="text-muted small mb-0">Aún no hay libros leídos.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {ultimasLecturas.map(l => (
                      <div key={l.id} className="card-lectura-mini">
                        {l.portada_url ? (
                          <img
                            src={l.portada_url}
                            alt={l.titulo}
                            style={{ width: 50, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ width: 50, height: 72, background: 'rgba(212,175,55,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.4rem' }}>
                            📚
                          </div>
                        )}
                        <div className="flex-grow-1 min-w-0">
                          <h4 className="text-truncate mb-0">{l.titulo}</h4>
                          <p className="text-truncate">{l.autor}</p>
                        </div>
                        <span className="badge-cozy flex-shrink-0" style={{
                          background: l.estado === 'LEIDO' ? 'rgba(39,174,96,0.15)' : 'rgba(212,175,55,0.1)',
                          color: l.estado === 'LEIDO' ? '#27ae60' : 'var(--accent-gold)',
                          border: l.estado === 'LEIDO' ? '1px solid rgba(39,174,96,0.4)' : '1px solid rgba(212,175,55,0.3)',
                        }}>
                          {l.estado === 'LEIDO' ? '✓ LEÍDO' : l.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Muro de Trofeos */}
              <div className="card p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>🏆 Sala de Trofeos</h5>
                  <span className="text-muted small">
                    {logros.filter(l => l.desbloqueado).length} / {logros.length} desbloqueados
                  </span>
                </div>

                {logros.length === 0 ? (
                  <p className="text-muted small">Aún no hay logros disponibles.</p>
                ) : (
                  <>
                    {(['lectura', 'critica', 'social', 'comunidad', 'puntos'] as const).map(cat => {
                      const grupo = logros.filter(l => l.categoria === cat)
                      if (grupo.length === 0) return null
                      const labels: Record<string, string> = {
                        lectura: '📚 Lectura', critica: '✍️ Crítica', social: '🤝 Social',
                        comunidad: '🌐 Comunidad', puntos: '⭐ Puntos',
                      }
                      return (
                        <div key={cat} style={{ marginBottom: '1.8rem' }}>
                          <div style={{
                            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                            marginBottom: '0.9rem', paddingBottom: '0.4rem',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}>
                            {labels[cat]}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
                            {grupo.map(l => (
                              <div key={l.id} style={{
                                position: 'relative',
                                background: l.desbloqueado
                                  ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))'
                                  : 'rgba(255,255,255,0.03)',
                                border: l.desbloqueado
                                  ? '1px solid rgba(212,175,55,0.35)'
                                  : '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 12,
                                padding: '1rem 0.75rem',
                                textAlign: 'center',
                                transition: 'transform 0.15s ease',
                                cursor: 'default',
                                opacity: l.desbloqueado ? 1 : 0.5,
                              }}>
                                {/* Brillo dorado en desbloqueados */}
                                {l.desbloqueado && (
                                  <div style={{
                                    position: 'absolute', top: 6, right: 8,
                                    fontSize: '0.55rem', color: '#d4af37', fontWeight: 800, letterSpacing: '0.5px',
                                  }}>✦</div>
                                )}

                                {/* Ícono */}
                                <div style={{ fontSize: l.desbloqueado ? '2rem' : '1.6rem', marginBottom: '0.5rem', lineHeight: 1 }}>
                                  {l.desbloqueado ? l.icono : '🔒'}
                                </div>

                                {/* Nombre */}
                                <div style={{
                                  fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.3,
                                  color: l.desbloqueado ? '#fff' : 'rgba(255,255,255,0.4)',
                                  marginBottom: '0.3rem',
                                }}>
                                  {l.desbloqueado ? l.nombre : '???'}
                                </div>

                                {/* Descripción / hint */}
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                                  {l.descripcion}
                                </div>

                                {/* Fecha de desbloqueo */}
                                {l.desbloqueado && l.fecha_desbloqueo && (
                                  <div style={{
                                    marginTop: '0.5rem', fontSize: '0.6rem',
                                    color: 'rgba(212,175,55,0.6)', fontStyle: 'italic',
                                  }}>
                                    {new Date(l.fecha_desbloqueo).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── EDITAR CUENTA ── */}
          {tab === 'config' && esMiPerfil && (
            <div className="card p-4">
              <h5 className="font-title mb-4" style={{ color: 'var(--accent-gold)' }}>Editar Cuenta</h5>

              {mensaje && (
                <div style={{
                  background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent-gold)',
                }}>
                  {mensaje}
                </div>
              )}

              {/* Avatar selector */}
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold text-uppercase" style={{ letterSpacing: 1 }}>
                  Foto de perfil
                </label>
                <div className="d-flex gap-3 flex-wrap align-items-center mt-2">
                  <label className="btn--brand" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    {subiendo ? 'Subiendo...' : '📷 Subir foto'}
                    <input type="file" accept="image/*" className="d-none" onChange={abrirCrop} />
                  </label>
                  {AVATARES.map(av => (
                    <button key={av} onClick={() => seleccionarAvatar(av)} style={{
                      border: usuario.avatar_url === av ? '2px solid var(--accent-gold)' : '2px solid transparent',
                      borderRadius: 8, padding: 2, background: 'transparent', cursor: 'pointer',
                    }}>
                      <img src={av} alt="avatar" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={guardarPerfil} className="perfil-form">
                <div className="form-grid">
                  <div className="field">
                    <label>Nombre</label>
                    <input name="nombre" defaultValue={usuario.nombre} />
                  </div>
                  <div className="field">
                    <label>Username</label>
                    <input name="username" defaultValue={usuario.username} />
                  </div>
                  <div className="field field--full">
                    <label>Email</label>
                    <input name="email" type="email" defaultValue={usuario.email} />
                  </div>
                  <div className="field field--full">
                    <label>Bio</label>
                    <textarea name="bio" defaultValue={usuario.bio || ''} rows={3} />
                  </div>
                  <div className="field">
                    <label>Objetivo anual (libros)</label>
                    <input name="objetivo_anual" type="number" min="1" defaultValue={usuario.objetivo_anual || ''} />
                  </div>
                  <div className="field">
                    <label>Géneros favoritos</label>
                    <input name="generos_favoritos" defaultValue={usuario.generos_favoritos || ''} placeholder="Ej: Fantasía, Thriller" />
                  </div>
                </div>
                <button type="submit" disabled={guardando} className="btn--brand" style={{ alignSelf: 'flex-start' }}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── MODAL DE RECORTE ── */}
    {cropFile && cropPreviewUrl && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="card p-4" style={{ width: 320, textAlign: 'center' }}>
          <h5 className="font-title mb-2" style={{ color: 'var(--accent-gold)' }}>Ajustá tu foto</h5>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>
            Arrastrá para elegir qué parte mostrar
          </p>

          <div
            style={{
              width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
              margin: '0 auto 1.5rem', cursor: 'grab',
              border: '3px solid var(--accent-gold)',
              boxShadow: '0 0 20px rgba(212,175,55,0.3)',
              userSelect: 'none',
            }}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          >
            <img
              src={cropPreviewUrl}
              alt="preview"
              draggable={false}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: `${cropPos.x}% ${cropPos.y}%`,
                pointerEvents: 'none',
              }}
            />
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <button
              onClick={() => { setCropFile(null); setCropPreviewUrl(null) }}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '0.5rem 1.25rem', color: '#fff', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={confirmarCrop}
              disabled={subiendo}
              style={{ background: 'linear-gradient(135deg,#d4af37,#f1c40f)', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              {subiendo ? 'Subiendo...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
