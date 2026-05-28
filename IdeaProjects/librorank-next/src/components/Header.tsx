'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

interface Notificacion {
  id: number
  tipo: string
  mensaje: string
  leido: boolean
  fecha_creacion: string
}

interface HeaderProps {
  user: {
    nombre: string
    username: string
    racha_actual?: number
    puntos?: number
    avatar_url?: string | null
  } | null
}

const NAV_ITEMS = [
  { href: '/biblioteca',      label: '📚 Biblioteca' },
  { href: '/recomendaciones', label: '✨ Para vos' },
  { href: '/misiones',        label: '🎯 Misiones' },
  { href: '/bingo',           label: '🎲 Bingo' },
  { href: '/retos',           label: '⚔️ Retos' },
  { href: '/cuento',          label: '✍️ Cuento' },
  { href: '/ranking',         label: '🏆 Ranking' },
  { href: '/clubes',          label: '📚 Clubes' },
  { href: '/amigos',          label: '👥 Comunidad' },
]

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [notifAbierto, setNotifAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) =>
    pathname.startsWith(path) ? 'nav-link-custom active-nav' : 'nav-link-custom'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  // Cerrar menú al cambiar de ruta
  useEffect(() => { setMenuAbierto(false) }, [pathname])

  // Cargar notificaciones
  useEffect(() => {
    if (!user) return
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 120_000)
    return () => clearInterval(interval)
  }, [user])

  // Cerrar dropdown notif al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifs() {
    try {
      const res = await fetch('/api/notificaciones')
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.notificaciones ?? [])
      setNoLeidas(data.total_no_leidas ?? 0)
    } catch { /* silencioso */ }
  }

  async function abrirNotifs() {
    setNotifAbierto(prev => !prev)
    if (!notifAbierto && noLeidas > 0) {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'leerTodas' }),
      })
      setNoLeidas(0)
      setNotifs(prev => prev.map(n => ({ ...n, leido: true })))
    }
  }

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  /* ── Header sin usuario ── */
  if (!user) {
    return (
      <header className="site-header">
        <div className="container d-flex justify-content-between align-items-center">
          <Link href="/" className="logo-landing text-decoration-none">
            LIBRO<span>RANK</span>
          </Link>
          <div className="d-flex align-items-center gap-4">
            <Link href="/ranking" className="nav-link-custom">Ranking</Link>
            <Link href="/login"   className="nav-link-custom">Ingresar</Link>
            <Link href="/signup"  className="btn-landing-cta text-decoration-none">Empezar ahora</Link>
          </div>
        </div>
      </header>
    )
  }

  /* ── Header con usuario logueado ── */
  return (
    <>
      <header className="site-header">
        <div className="container d-flex justify-content-between align-items-center">

          {/* Logo */}
          <Link href="/home" className="logo text-decoration-none" style={{ flexShrink: 0 }}>
            Libro<span>Rank</span>
          </Link>

          {/* Nav desktop */}
          <nav className="header-nav-desktop">
            <ul className="d-flex list-unstyled gap-3 mb-0 align-items-center">
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className={isActive(item.href)}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Acciones derecha */}
          <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>

            {/* Racha — oculta en mobile */}
            <span className="header-badge header-badge-hide-sm" style={{
              background: 'rgba(255,69,0,0.12)',
              color: '#ff6b35',
              border: '1px solid rgba(255,69,0,0.3)',
            }}>
              🔥 {user.racha_actual ?? 0}
            </span>

            {/* Puntos — oculta en mobile */}
            <span className="header-badge header-badge-hide-sm" style={{
              background: 'rgba(212,175,55,0.12)',
              color: '#d4af37',
              border: '1px solid rgba(212,175,55,0.35)',
            }}>
              ⭐ {user.puntos ?? 0}
            </span>

            {/* Campana de notificaciones */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={abrirNotifs}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.2rem 0.4rem', position: 'relative',
                  fontSize: '1.1rem', lineHeight: 1,
                }}
                title="Notificaciones"
              >
                🔔
                {noLeidas > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    background: '#e74c3c', color: '#fff', borderRadius: '50%',
                    fontSize: '0.6rem', fontWeight: 700,
                    width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {notifAbierto && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 300, background: '#1a1a2e',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 9999, overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.85rem', color: '#d4af37' }}>
                    🔔 Notificaciones
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '16px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textAlign: 'center' }}>
                      Sin notificaciones
                    </div>
                  ) : (
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifs.map(n => (
                        <div key={n.id} style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: n.leido ? 'transparent' : 'rgba(212,175,55,0.06)',
                        }}>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{n.mensaje}</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{formatFecha(n.fecha_creacion)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón Perfil — oculto en mobile (está en el menú) */}
            <Link href="/perfil" className="btn-gold header-perfil-desktop" style={{
              fontSize: '0.72rem', padding: '0.3rem 0.8rem',
              borderRadius: 8, fontWeight: 700, textDecoration: 'none',
            }}>
              👤 Perfil
            </Link>

            {/* Salir — oculto en mobile */}
            <button
              onClick={handleLogout}
              className="header-salir-desktop"
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem',
                fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff5e57')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              Salir
            </button>

            {/* Hamburger — solo mobile */}
            <button
              className="header-hamburger"
              onClick={() => setMenuAbierto(prev => !prev)}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#fff', cursor: 'pointer',
                padding: '0.35rem 0.55rem', fontSize: '1rem', lineHeight: 1,
              }}
              aria-label="Menú"
            >
              {menuAbierto ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Menú mobile desplegable */}
      {menuAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          overflowY: 'auto',
        }}>
          {/* Header del menú */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link href="/home" className="logo text-decoration-none" onClick={() => setMenuAbierto(false)}>
              Libro<span>Rank</span>
            </Link>
            <button
              onClick={() => setMenuAbierto(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          {/* Info usuario */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12, padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
          }}>
            <img
              src={user.avatar_url || '/img/personajes/personaje_1.png'}
              alt={user.username}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37', flexShrink: 0 }}
              onError={e => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/img/personajes/personaje_1.png' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>@{user.username}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>🔥 {user.racha_actual ?? 0} racha · ⭐ {user.puntos ?? 0} pts</div>
            </div>
          </div>

          {/* Items de nav */}
          <nav style={{ flex: 1 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuAbierto(false)}
                    style={{
                      display: 'block',
                      padding: '0.85rem 1rem',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '1rem',
                      textDecoration: 'none',
                      background: pathname.startsWith(item.href) ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: pathname.startsWith(item.href) ? '#d4af37' : 'rgba(255,255,255,0.8)',
                      borderLeft: pathname.startsWith(item.href) ? '3px solid #d4af37' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/perfil"
                  onClick={() => setMenuAbierto(false)}
                  style={{
                    display: 'block', padding: '0.85rem 1rem', borderRadius: 10,
                    fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
                    background: pathname.startsWith('/perfil') ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: pathname.startsWith('/perfil') ? '#d4af37' : 'rgba(255,255,255,0.8)',
                    borderLeft: pathname.startsWith('/perfil') ? '3px solid #d4af37' : '3px solid transparent',
                  }}
                >
                  👤 Perfil
                </Link>
              </li>
            </ul>
          </nav>

          {/* Salir */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: '1.5rem', width: '100%',
              background: 'rgba(255,94,87,0.1)',
              border: '1px solid rgba(255,94,87,0.3)',
              borderRadius: 10, color: '#ff5e57',
              padding: '0.85rem', fontWeight: 700,
              fontSize: '0.95rem', cursor: 'pointer',
            }}
          >
            Salir de la cuenta
          </button>
        </div>
      )}
    </>
  )
}
