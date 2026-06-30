'use client'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export default function CartaDorso({ size = 'lg' }: Props) {
  const dims = size === 'sm' ? { w: 168, h: 268 } : size === 'lg' ? { w: 300, h: 480 } : { w: 220, h: 352 }

  return (
    <div style={{
      width: dims.w,
      height: dims.h,
      borderRadius: 10,
      border: '3px double #d4af37aa',
      background: 'linear-gradient(155deg, #1a1410 0%, #2a2018 55%, #1a1410 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(212,175,55,0.25), inset 0 0 0 1px rgba(212,175,55,0.15)',
    }}>
      {/* Patrón ornamental de fondo */}
      <div style={{
        position: 'absolute', inset: 8,
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 6,
      }} />
      <div style={{
        position: 'absolute', inset: 14,
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 4,
      }} />

      {/* Logo central */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
        <div style={{
          fontSize: size === 'lg' ? '2.5rem' : size === 'sm' ? '1.4rem' : '1.9rem',
          filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))',
        }}>
          📖
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 800,
          letterSpacing: 3,
          fontSize: size === 'lg' ? '0.85rem' : size === 'sm' ? '0.5rem' : '0.65rem',
          color: '#d4af37',
          textTransform: 'uppercase',
        }}>
          LibroRank
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: size === 'lg' ? '0.62rem' : size === 'sm' ? '0.4rem' : '0.5rem',
          color: 'rgba(212,175,55,0.6)',
        }}>
          Colección de Personajes
        </div>
      </div>

      {/* Shimmer sutil */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.12) 50%, transparent 65%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer-dorso 4s infinite',
      }} />

      <style>{`
        @keyframes shimmer-dorso {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  )
}
