'use client'

import Image from 'next/image'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  glowColor?: string
  pulsar?: boolean
  imagen?: string
}

export default function CartaDorso({ size = 'lg', glowColor, pulsar, imagen }: Props) {
  const dims = size === 'sm' ? { w: 168, h: 268 } : size === 'lg' ? { w: 300, h: 480 } : { w: 220, h: 352 }
  const colorGlow = glowColor ?? '#d4af37'

  if (imagen) {
    return (
      <div
        className={pulsar ? 'dorso-pulsante' : undefined}
        style={{
          width: dims.w, height: dims.h, borderRadius: 10,
          border: `3px double ${colorGlow}aa`,
          boxShadow: `0 0 20px ${colorGlow}40`,
          overflow: 'hidden', position: 'relative', flexShrink: 0,
          ['--glow-soft' as string]: `0 0 20px ${colorGlow}40`,
          ['--glow-strong' as string]: `0 0 38px ${colorGlow}90`,
        } as React.CSSProperties}
      >
        <Image src={imagen} alt="dorso" fill style={{ objectFit: 'cover' }} unoptimized />
        <style>{`
          .dorso-pulsante { animation: pulso-dorso 1.3s ease-in-out infinite; }
          @keyframes pulso-dorso { 0%, 100% { box-shadow: var(--glow-soft); } 50% { box-shadow: var(--glow-strong); } }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className={pulsar ? 'dorso-pulsante' : undefined}
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 10,
        border: `3px double ${colorGlow}aa`,
        background: 'linear-gradient(155deg, #1a1410 0%, #2a2018 55%, #1a1410 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 0 20px ${colorGlow}40, inset 0 0 0 1px ${colorGlow}25`,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        ['--glow-soft' as string]: `0 0 20px ${colorGlow}40, inset 0 0 0 1px ${colorGlow}25`,
        ['--glow-strong' as string]: `0 0 38px ${colorGlow}90, inset 0 0 0 1px ${colorGlow}60`,
      } as React.CSSProperties}
    >
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
        .dorso-pulsante {
          animation: pulso-dorso 1.3s ease-in-out infinite;
        }
        @keyframes pulso-dorso {
          0%, 100% { box-shadow: var(--glow-soft); }
          50%      { box-shadow: var(--glow-strong); }
        }
      `}</style>
    </div>
  )
}
