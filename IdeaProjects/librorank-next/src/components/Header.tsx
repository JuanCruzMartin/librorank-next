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

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) =>
    pathname.startsWith(path) ? 'nav-link-custom active-nav' : 'nav-link-custom'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  // Cargar notificaciones al montar (solo si hay usuario)
  useEffect(() => {
    if (!user) return
    fetchNotifs()
    // Polling cada 2 minutos
    const interval = setInterval(fetchNotifs, 120_000)
    return () => clearInterval(interval)
  }, [user])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAbierto(false)
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
    } catch {
      // silencioso
    }
  }

  async function abrirNotifs() {
    setAbierto(prev => !prev)
    if (!abierto && noLeidas > 0) {
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

  /* ── Header sin usuario (landing/login) ── */
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
    <header className="site-header">
      <div className="container d-flex justify-content-between align-items-center">

        {/* Logo */}
        <Link href="/home" className="logo text-decoration-none" style={{ flexShrink: 0 }}>
          Libro<span>Rank</span>
        </Link>

        {/* Nav central */}
        <nav>
          <ul className="d-flex list-unstyled gap-3 mb-0 align-items-center">
            <li><Link href="/biblioteca"      className={isActive('/biblioteca')}>📚 Biblioteca</Link></li>
            <li><Link href="/recomendaciones" className={isActive('/recomendaciones')}>✨ Para vos</Link></li>
            <li><Link href="/misiones"         className={isActive('/misiones')}>🎯 Misiones</Link></li>
            <li><Link href="/bingo"           className={isActive('/bingo')}>🎲 Bingo</Link></li>
            <li><Link href="/retos"           className={isActive('/retos')}>⚔️ Retos</Link></li>
            <li><Link href="/cuento"          className={isActive('/cuento')}>✍️ Cuento</Link></li>
            <li><Link href="/ranking"         className={isActive('/ranking')}>🏆 Ranking</Link></li>
            <li><Link href="/clubes"          className={isActive('/clubes')}>📚 Clubes</Link></li>
            <li><Link href="/amigos"          className={isActive('/amigos')}>👥 Comunidad</Link></li>
          </ul>
        </nav>

        {/* Acciones derecha */}
        <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
          {/* Racha */}
          <span className="header-badge" style={{
            background: 'rgba(255,69,0,0.12)',
            color: '#ff6b35',
            border: '1px solid rgba(255,69,0,0.3)',
          }}>
            🔥 {user.racha_actual ?? 0}
          </span>

          {/* Puntos */}
          <span className="header-badge" style={{
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
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                position: 'relative',
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
              title="Notificaciones"
            >
              🔔
              {noLeidas > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#e74c3c',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {/* Dropdown de notificaciones */}
            {abierto && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                background: '#1a1a2e',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 9999,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#d4af37',
                }}>
                  🔔 Notificaciones
                </div>

                {notifs.length === 0 ? (
                  <div style={{ padding: '16px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textAlign: 'center' }}>
                    Sin notificaciones
                  </div>
                ) : (
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifs.map(n => (
                      <div key={n.id} style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: n.leido ? 'transparent' : 'rgba(212,175,55,0.06)',
                        transition: 'background 0.2s',
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                          {n.mensaje}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                          {formatFecha(n.fecha_creacion)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Perfil */}
          <Link href="/perfil" className="btn-gold" style={{
            fontSize: '0.72rem',
            padding: '0.3rem 0.8rem',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
          }}>
            👤 Perfil
          </Link>

          {/* Salir */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff5e57')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Salir
          </button>
        </div>

      </div>
    </header>
  )
}
