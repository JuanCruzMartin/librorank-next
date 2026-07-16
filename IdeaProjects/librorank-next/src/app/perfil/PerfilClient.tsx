'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import type { Usuario, NivelInfo } from '@/lib/dao/usuarioDAO'
import type { Libro, PerfilStats, LibroFavorito } from '@/lib/dao/libroDAO'
import type { Logro } from '@/lib/dao/logroDAO'
import type { Personaje } from '@/lib/personaje'
import PersonajeCard from '@/components/PersonajeCard'
import CartaPersonaje from '@/components/CartaPersonaje'
import { CARTAS, RAREZAS } from '@/lib/cartas'

interface WrappedData {
  anio: number
  resumen: { total: number; paginas: number; promedio: number }
  generos: { genero: string; total: number }[]
  autores: { autor: string; total: number }[]
  meses: { mes: string; total: number }[]
  mesMasActivo: { mes: number; nombre: string; total: number } | null
  mejorLibro: { titulo: string; autor: string; estrellas: number; portada_url: string } | null
  librosRecientes: { titulo: string; portada_url: string; autor: string }[]
  libroMasLargo: { titulo: string; autor: string; paginas: number } | null
  primerLibro: { titulo: string; autor: string; portada_url: string } | null
  rachaActual: number
  paginasPorDia: number
  diaFavorito: { dia: string; total: number } | null
  anioAnterior: { total: number; diferencia: number }
  objetivoAnual: number | null
  progresoObjetivo: number | null
  logrosEsteAnio: number
  frase: string
}

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
  topGeneros: string[]
  resenasPublicas: Libro[]
  paginasLeidas: number
  librosDestacados: LibroFavorito[]
  promedioEstrellas: number
  personaje: Personaje
  coleccionCartas: string[]
  leyendoAhora: Libro[]
  totalAmigos: number
}

export default function PerfilClient({
  usuario, stats, ultimasLecturas, logros,
  leidosEsteAnio, totalLeidos, nivelInfo, esMiPerfil, topGeneros, resenasPublicas,
  paginasLeidas, librosDestacados, promedioEstrellas, personaje, coleccionCartas, leyendoAhora, totalAmigos,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'resumen' | 'anio' | 'config' | 'personaje' | 'coleccion'>('resumen')
  const [wrapped, setWrapped] = useState<WrappedData | null>(null)
  const [loadingWrapped, setLoadingWrapped] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [avatarActual, setAvatarActual] = useState(usuario.avatar_url || '/img/personajes/personaje_1.png')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null)
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 })
  const [avatarHover, setAvatarHover] = useState(false)
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

  async function cargarWrapped() {
    if (wrapped) return
    setLoadingWrapped(true)
    const res = await fetch('/api/stats/wrapped')
    const json = await res.json()
    setWrapped(json)
    setLoadingWrapped(false)
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
    <>
    <div className="container">
      <div className="perfil-layout">

        {/* ══════════════════════════════
            SIDEBAR — 3 cards separadas
        ══════════════════════════════ */}
        <aside className="perfil-side">

          {/* Card 1 — Datos del usuario */}
          <div className="card p-4 text-center">
            <div className="user-avatar" style={{ position: 'relative', boxShadow: '0 0 0 3px rgba(212,175,55,0.45), 0 0 24px rgba(212,175,55,0.15)' }}>
              <img
                src={avatarActual}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = '/img/personajes/personaje_1.png' }}
              />
              {esMiPerfil && (
                <label
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: avatarHover ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    gap: 4,
                  }}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                >
                  <span style={{
                    fontSize: '1.8rem', lineHeight: 1,
                    filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))',
                    opacity: avatarHover ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}>📷</span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    opacity: avatarHover ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}>Cambiar foto</span>
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
              <div className="mt-1" style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
                <span>📚 <strong className="text-white">{totalLeidos}</strong> leídos</span>
                <span>🤝 <strong className="text-white">{totalAmigos}</strong> amigos</span>
              </div>
            </div>

            {usuario.bio && (
              <p className="text-muted small mt-3 mb-0" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                &ldquo;{usuario.bio}&rdquo;
              </p>
            )}

            {topGeneros.length > 0 && (
              <div className="mt-3">
                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>
                  📚 Géneros más leídos
                </p>
                {topGeneros.map(g => (
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

          {/* Tabs */}
          <div className="inventory-tabs mb-4">
            <button onClick={() => setTab('resumen')} className={`tab-btn ${tab === 'resumen' ? 'active' : ''}`}>
              ✨ Resumen
            </button>
            <button onClick={() => setTab('coleccion')} className={`tab-btn ${tab === 'coleccion' ? 'active' : ''}`}>
              🃏 Colección
            </button>
            {esMiPerfil && <>
              <button onClick={() => { setTab('anio'); cargarWrapped() }} className={`tab-btn ${tab === 'anio' ? 'active' : ''}`}>
                🎬 Mi Año
              </button>
              <button onClick={() => setTab('config')} className={`tab-btn ${tab === 'config' ? 'active' : ''}`}>
                ⚙️ Editar
              </button>
              <button onClick={() => setTab('personaje')} className={`tab-btn ${tab === 'personaje' ? 'active' : ''}`}>
                ⚔️ Personaje
              </button>
            </>}
          </div>

          {/* ── RESUMEN ── */}
          {tab === 'resumen' && (
            <>
              {/* Leyendo ahora */}
              {leyendoAhora.length > 0 && (
                <div className="card p-4 mb-4">
                  <h5 className="font-title mb-3" style={{ color: '#5dade2', fontSize: '0.95rem' }}>
                    📖 Leyendo ahora
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {leyendoAhora.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        {l.portada_url ? (
                          <img
                            src={l.portada_url.replace('http://', 'https://')}
                            alt={l.titulo}
                            style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}
                          />
                        ) : (
                          <div style={{ width: 44, height: 64, background: 'rgba(93,173,226,0.1)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            📖
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.titulo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.autor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats hero */}
              <div className="perfil-datos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { icon: '📚', valor: totalLeidos, label: 'libros leídos', color: '#d4af37' },
                  { icon: '📄', valor: paginasLeidas > 0 ? paginasLeidas.toLocaleString('es-AR') : '—', label: 'páginas', color: '#4cd137' },
                  { icon: '📖', valor: leidosEsteAnio, label: `leídos en ${new Date().getFullYear()}`, color: '#5dade2' },
                  { icon: '⭐', valor: promedioEstrellas > 0 ? promedioEstrellas : '—', label: 'nota media', color: '#f39c12' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: `${s.color}12`,
                    border: `1px solid ${s.color}35`,
                    borderRadius: 14, padding: '1rem 1.1rem',
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${s.color}18`, border: `1px solid ${s.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Libros destacados */}
              {librosDestacados.length > 0 && (
                <div className="card p-4 mb-4">
                  <h5 className="font-title mb-3" style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                    ⭐ Libros favoritos
                  </h5>
                  <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {librosDestacados.map((l, i) => (
                      <div key={i} style={{ flexShrink: 0, width: 64, position: 'relative' }} title={`${l.titulo} — ${l.autor}`}>
                        {l.portada_url ? (
                          <img
                            src={l.portada_url.replace('http://', 'https://')}
                            alt={l.titulo}
                            style={{ width: 64, height: 92, objectFit: 'cover', borderRadius: 8, display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                          />
                        ) : (
                          <div style={{ width: 64, height: 92, background: 'rgba(212,175,55,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            📚
                          </div>
                        )}
                        {l.estrellas === 5 && (
                          <div style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.6rem', background: '#d4af37', color: '#000', borderRadius: 99, padding: '1px 4px', fontWeight: 800 }}>
                            5⭐
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Racha */}
              {(usuario.racha_actual ?? 0) > 0 && (
                <div className="card p-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem', lineHeight: 1 }}>🔥</div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ff6b35' }}>
                      {usuario.racha_actual} día{(usuario.racha_actual ?? 0) !== 1 ? 's' : ''} de racha
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>seguidos marcando libros</div>
                  </div>
                </div>
              )}

              {/* Últimas conquistas */}
              <div className="card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>Últimas conquistas</h5>
                  <Link
                    href={esMiPerfil ? '/biblioteca' : `/biblioteca?id=${usuario.id}`}
                    className="small text-decoration-none"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    Ver biblioteca completa →
                  </Link>
                </div>

                {ultimasLecturas.length === 0 ? (
                  <p className="text-muted small mb-0">Aún no hay libros leídos.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {ultimasLecturas.map(l => (
                      <div key={l.id} className="card-lectura-mini" style={{
                        borderLeft: `3px solid ${l.estado === 'LEIDO' ? 'rgba(39,174,96,0.6)' : l.estado === 'LEYENDO' ? 'rgba(93,173,226,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        paddingLeft: '0.75rem',
                      }}>
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

              {/* Reseñas públicas */}
              {resenasPublicas.length > 0 && (
                <div className="card p-4 mb-4">
                  <h5 className="font-title mb-4" style={{ color: 'var(--accent-gold)' }}>
                    ✍️ Reseñas
                    <span className="ms-2" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                      {resenasPublicas.length} reseña{resenasPublicas.length !== 1 ? 's' : ''}
                    </span>
                  </h5>
                  <div className="d-flex flex-column gap-4">
                    {resenasPublicas.map(l => (
                      <div key={l.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Portada */}
                        {l.portada_url ? (
                          <img src={l.portada_url.replace('http://', 'https://')} alt={l.titulo}
                            style={{ width: 48, height: 68, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div style={{ width: 48, height: 68, background: 'rgba(212,175,55,0.1)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                        )}
                        {/* Texto */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: 2 }}>{l.titulo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{l.autor}</div>
                          {(l.estrellas ?? 0) > 0 && (
                            <div style={{ fontSize: '0.75rem', marginBottom: 6 }}>{'⭐'.repeat(l.estrellas ?? 0)}</div>
                          )}
                          <p style={{
                            margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)',
                            fontStyle: 'italic', lineHeight: 1.6,
                            borderLeft: '2px solid rgba(212,175,55,0.3)',
                            paddingLeft: '0.6rem',
                          }}>
                            &ldquo;{l.resena}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                          <div className="perfil-logros-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
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
                                filter: l.desbloqueado ? 'none' : 'grayscale(1)',
                                opacity: l.desbloqueado ? 1 : 0.35,
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

          {/* ── MI AÑO (WRAPPED) ── */}
          {tab === 'anio' && (
            <div>
              {loadingWrapped && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <p>Preparando tu año lector...</p>
                </div>
              )}
              {wrapped && !loadingWrapped && (
                <>
                  {/* Hero */}
                  <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a1208,#0d1a0d)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.2)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '0.5rem' }}>Tu año en libros</p>
                    <h2 className="font-title" style={{ fontSize: '3.5rem', color: '#d4af37', margin: 0, lineHeight: 1 }}>{wrapped.anio}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', marginTop: '0.75rem', fontStyle: 'italic', maxWidth: 340, margin: '0.75rem auto 0' }}>{wrapped.frase}</p>

                    {/* Botón compartir */}
                    <a
                      href="/api/wrapped-image"
                      download={`mi-wrapped-${wrapped.anio}.png`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        marginTop: '1.25rem',
                        background: 'linear-gradient(135deg,#d4af37,#f1c40f)',
                        color: '#000', fontWeight: 800, fontSize: '0.85rem',
                        padding: '0.6rem 1.5rem', borderRadius: 10,
                        textDecoration: 'none',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      📤 Descargar imagen para compartir
                    </a>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.5rem', marginBottom: 0 }}>
                      1080×1080 · lista para Instagram y Twitter
                    </p>
                  </div>

                  {/* Stats grandes */}
                  <div className="perfil-wrapped-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { valor: wrapped.resumen.total, label: 'libros leídos', icon: '📚', color: '#d4af37' },
                      { valor: wrapped.resumen.paginas.toLocaleString(), label: 'páginas', icon: '📄', color: '#4cd137' },
                      { valor: wrapped.resumen.promedio > 0 ? `${wrapped.resumen.promedio}⭐` : '—', label: 'calificación prom.', icon: '⭐', color: '#f39c12' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}30`, borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico de barras por mes */}
                  <div className="card p-4" style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '1rem' }}>
                      📅 Lecturas por mes
                    </p>
                    {wrapped.mesMasActivo && (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                        Tu mes más activo fue <strong style={{ color: '#d4af37' }}>{wrapped.mesMasActivo.nombre}</strong> con {wrapped.mesMasActivo.total} libro{wrapped.mesMasActivo.total !== 1 ? 's' : ''}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 80 }}>
                      {(() => {
                        const maxVal = Math.max(...wrapped.meses.map(m => m.total), 1)
                        return wrapped.meses.map((m, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              width: '100%',
                              height: `${Math.max((m.total / maxVal) * 64, m.total > 0 ? 6 : 2)}px`,
                              background: m.total > 0 ? (wrapped.mesMasActivo?.mes === i + 1 ? '#d4af37' : 'rgba(212,175,55,0.4)') : 'rgba(255,255,255,0.06)',
                              borderRadius: 4,
                              transition: 'height 0.3s ease',
                            }} title={`${m.mes}: ${m.total}`} />
                            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>{m.mes}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* Datos curiosos: racha, páginas/día, libro más largo, primer libro */}
                  <div className="perfil-wrapped-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>

                    {/* Racha actual */}
                    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,107,53,0.8)', margin: 0 }}>🔥 Racha actual</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ff6b35', lineHeight: 1 }}>
                        {wrapped.rachaActual}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {wrapped.rachaActual === 0 ? 'Marcá un libro hoy para arrancar' : wrapped.rachaActual === 1 ? 'día seguido leyendo' : 'días seguidos leyendo'}
                      </p>
                    </div>

                    {/* Páginas por día */}
                    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(76,209,55,0.8)', margin: 0 }}>⚡ Páginas / día</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#4cd137', lineHeight: 1 }}>
                        {wrapped.paginasPorDia > 0 ? wrapped.paginasPorDia : '—'}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {wrapped.paginasPorDia > 0 ? `promedio en lo que va del ${wrapped.anio}` : 'Leé libros con páginas para ver este dato'}
                      </p>
                    </div>

                    {/* Día favorito */}
                    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(93,173,226,0.8)', margin: 0 }}>📅 Día favorito</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#5dade2', lineHeight: 1 }}>
                        {wrapped.diaFavorito?.dia ?? '—'}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {wrapped.diaFavorito ? `terminaste ${wrapped.diaFavorito.total} libro${wrapped.diaFavorito.total !== 1 ? 's' : ''} este día` : 'Sin datos aún'}
                      </p>
                    </div>

                    {/* Vs año anterior */}
                    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', margin: 0 }}>📊 Vs {wrapped.anio - 1}</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: wrapped.anioAnterior.diferencia >= 0 ? '#4cd137' : '#e74c3c' }}>
                        {wrapped.anioAnterior.diferencia >= 0 ? '+' : ''}{wrapped.anioAnterior.diferencia}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {wrapped.anioAnterior.total > 0
                          ? `vs ${wrapped.anioAnterior.total} libros el año pasado`
                          : 'no hay datos del año anterior'}
                      </p>
                    </div>

                    {/* Libro más largo */}
                    {wrapped.libroMasLargo && (
                      <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(93,173,226,0.8)', margin: 0 }}>📏 Libro más largo</p>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', lineHeight: 1.3 }}>
                          {wrapped.libroMasLargo.titulo}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{wrapped.libroMasLargo.autor}</div>
                        <div style={{ fontSize: '0.8rem', color: '#5dade2', fontWeight: 700 }}>{wrapped.libroMasLargo.paginas.toLocaleString()} páginas</div>
                      </div>
                    )}

                    {/* Primer libro del año */}
                    {wrapped.primerLibro && (
                      <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(175,122,197,0.8)', margin: 0 }}>🌅 Primer libro del año</p>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', lineHeight: 1.3 }}>
                          {wrapped.primerLibro.titulo}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{wrapped.primerLibro.autor}</div>
                        <div style={{ fontSize: '0.72rem', color: '#af7ac5' }}>Con el que arrancaste {wrapped.anio} 🎉</div>
                      </div>
                    )}

                    {/* Logros desbloqueados */}
                    <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', margin: 0 }}>🏆 Logros ganados</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>
                        {wrapped.logrosEsteAnio}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {wrapped.logrosEsteAnio === 0 ? '¡A conseguir logros!' : `logro${wrapped.logrosEsteAnio !== 1 ? 's' : ''} desbloqueado${wrapped.logrosEsteAnio !== 1 ? 's' : ''} este año`}
                      </p>
                    </div>

                    {/* Objetivo anual */}
                    {wrapped.objetivoAnual && wrapped.objetivoAnual > 0 && (
                      <div className="card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', margin: 0 }}>🎯 Objetivo anual</p>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: (wrapped.progresoObjetivo ?? 0) >= 100 ? '#4cd137' : '#d4af37' }}>
                            {wrapped.resumen.total} / {wrapped.objetivoAnual} libros
                          </span>
                        </div>
                        <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginTop: '0.25rem' }}>
                          <div style={{
                            height: '100%',
                            width: `${wrapped.progresoObjetivo ?? 0}%`,
                            background: (wrapped.progresoObjetivo ?? 0) >= 100
                              ? 'linear-gradient(90deg,#27ae60,#2ecc71)'
                              : 'linear-gradient(90deg,#b8860b,#d4af37)',
                            borderRadius: 99, transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                          {(wrapped.progresoObjetivo ?? 0) >= 100
                            ? '🎉 ¡Objetivo cumplido!'
                            : `${wrapped.progresoObjetivo ?? 0}% del objetivo — faltan ${wrapped.objetivoAnual - wrapped.resumen.total} libro${wrapped.objetivoAnual - wrapped.resumen.total !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Géneros y Autores */}
                  <div className="perfil-wrapped-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Géneros */}
                    <div className="card p-4">
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '1rem' }}>🎭 Géneros</p>
                      {wrapped.generos.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Sin datos aún</p>
                      ) : (() => {
                        const max = wrapped.generos[0].total
                        const colores = ['#d4af37','#4cd137','#5dade2','#af7ac5','#ff5e57']
                        return wrapped.generos.map((g, i) => (
                          <div key={g.genero} style={{ marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 3 }}>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{g.genero}</span>
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{g.total}</span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                              <div style={{ height: '100%', width: `${(g.total / max) * 100}%`, background: colores[i] || '#d4af37', borderRadius: 99 }} />
                            </div>
                          </div>
                        ))
                      })()}
                    </div>

                    {/* Autores */}
                    <div className="card p-4">
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '1rem' }}>✍️ Autores</p>
                      {wrapped.autores.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Sin datos aún</p>
                      ) : wrapped.autores.map((a, i) => (
                        <div key={a.autor} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#d4af37' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: i === 0 ? '#000' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{a.autor}</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{a.total} libro{a.total !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mejor libro */}
                  {wrapped.mejorLibro && (
                    <div style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {wrapped.mejorLibro.portada_url && (
                        <NextImage src={wrapped.mejorLibro.portada_url} alt={wrapped.mejorLibro.titulo} width={56} height={80} style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      )}
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '0.25rem' }}>⭐ Tu libro del año</p>
                        <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 2px', fontSize: '0.9rem' }}>{wrapped.mejorLibro.titulo}</p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{wrapped.mejorLibro.autor}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{'⭐'.repeat(wrapped.mejorLibro.estrellas)}</p>
                      </div>
                    </div>
                  )}

                  {/* Últimos leídos */}
                  {wrapped.librosRecientes.length > 0 && (
                    <div className="card p-4">
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '1rem' }}>📖 Últimos leídos</p>
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {wrapped.librosRecientes.map((l, i) => (
                          <div key={i} style={{ flexShrink: 0, width: 56 }}>
                            {l.portada_url
                              ? <NextImage src={l.portada_url} alt={l.titulo} width={56} height={80} style={{ objectFit: 'cover', borderRadius: 6 }} title={l.titulo} />
                              : <div style={{ width: 56, height: 80, background: '#36302c', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {wrapped.resumen.total === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                      <p>Todavía no tenés libros marcados como leídos este año.</p>
                      <p style={{ fontSize: '0.8rem' }}>¡Empezá a leer y volvé acá!</p>
                    </div>
                  )}
                </>
              )}
            </div>
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
                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                      {topGeneros.length > 0 ? (
                        <>
                          {topGeneros.map(g => (
                            <span key={g} className="badge-cozy me-1" style={{ display: 'inline-block' }}>{g}</span>
                          ))}
                          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', margin: '0.4rem 0 0' }}>
                            Se calculan automáticamente según tus libros leídos
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                          Marcá libros como leídos con género para que aparezcan acá
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={guardando} className="btn--brand" style={{ alignSelf: 'flex-start' }}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}

          {/* ── PERSONAJE ── */}
          {tab === 'personaje' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <PersonajeCard personaje={personaje} username={usuario.username} />
            </div>
          )}

          {/* ── COLECCIÓN DE CARTAS ── */}
          {tab === 'coleccion' && (() => {
            const colSet = new Set(coleccionCartas)
            const total = CARTAS.length
            const obtenidas = colSet.size
            const pct = (obtenidas / total) * 100
            const ORDEN_RAREZA = ['comun', 'raro', 'epico', 'legendario', 'mitico'] as const
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header progreso */}
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 14, padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                  <span style={{ fontSize: '1.8rem' }}>🃏</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.9rem', marginBottom: 4 }}>
                      {obtenidas} de {total} cartas
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Cards por rareza */}
                {ORDEN_RAREZA.map(rareza => {
                  const cartasRareza = CARTAS.filter(c => c.rareza === rareza)
                  const obtenidasRareza = cartasRareza.filter(c => colSet.has(c.id)).length
                  const r = RAREZAS[rareza]
                  return (
                    <div key={rareza}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${r.color}30` }}>
                        <span style={{ fontWeight: 800, color: r.color, fontSize: '0.88rem' }}>{r.label}</span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{obtenidasRareza}/{cartasRareza.length}</span>
                      </div>
                      <div className="cartas-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {cartasRareza.map(carta => {
                          const tengo = colSet.has(carta.id)
                          const idx = CARTAS.findIndex(c => c.id === carta.id) + 1
                          return (
                            <div key={carta.id} title={tengo ? `${carta.nombre} — ${carta.obra}` : `${carta.nombre} (no obtenida)`}>
                              <CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={idx} total={total} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
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
    </>
  )
}
