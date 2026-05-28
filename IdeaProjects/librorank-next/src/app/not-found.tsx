import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
}

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/css/styles.css" />
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-body)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>

        {/* Logo */}
        <Link href="/" className="logo text-decoration-none" style={{ fontSize: '1.4rem', marginBottom: '3rem', opacity: 0.6 }}>
          Libro<span>Rank</span>
        </Link>

        {/* Número 404 */}
        <div style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: "'Playfair Display', serif",
          background: 'linear-gradient(135deg, #d4af37, rgba(212,175,55,0.3))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
          userSelect: 'none',
        }}>
          404
        </div>

        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>

        <h1 style={{
          color: '#fff',
          fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
          fontWeight: 700,
          marginBottom: '0.75rem',
        }}>
          Esta página no existe
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '1rem',
          maxWidth: 380,
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}>
          Puede que el link esté roto, que el usuario no exista o que la página haya sido movida.
        </p>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              background: 'var(--accent-gold)',
              color: '#000',
              fontWeight: 800,
              padding: '0.75rem 2rem',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
            }}
          >
            Ir al inicio
          </Link>
          <Link
            href="/ranking"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 700,
              padding: '0.75rem 2rem',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Ver ranking
          </Link>
        </div>

      </div>
    </>
  )
}
