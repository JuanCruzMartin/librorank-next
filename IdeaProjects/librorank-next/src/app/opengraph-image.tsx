import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'LibroRank — La red social para lectores en español'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1614 0%, #25211e 50%, #1a1614 100%)',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Borde dorado */}
        <div style={{
          position: 'absolute', inset: 20,
          border: '2px solid rgba(212,175,55,0.4)',
          borderRadius: 24,
        }} />

        {/* Logo */}
        <div style={{
          fontSize: 80, fontWeight: 900,
          color: '#ffffff', marginBottom: 16,
          display: 'flex',
        }}>
          Libro<span style={{ color: '#d4af37' }}>Rank</span>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28, color: 'rgba(255,255,255,0.7)',
          textAlign: 'center', maxWidth: 700, lineHeight: 1.4,
          marginBottom: 40,
        }}>
          La red social para lectores en español
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['📚 Biblioteca', '🏆 Ranking', '🎯 Misiones', '⚔️ Retos'].map(pill => (
            <div key={pill} style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: 99, padding: '8px 20px',
              fontSize: 18, color: '#d4af37', fontWeight: 700,
            }}>
              {pill}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: 40,
          fontSize: 16, color: 'rgba(255,255,255,0.3)',
        }}>
          librorank-next.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
