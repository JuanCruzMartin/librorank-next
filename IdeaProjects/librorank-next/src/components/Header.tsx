'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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

  const isActive = (path: string) =>
    pathname.startsWith(path) ? 'nav-link-custom active-nav' : 'nav-link-custom'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
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
