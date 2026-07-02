'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Carta } from '@/lib/cartas'
import { RAREZAS } from '@/lib/cartas'

interface Props {
  carta: Carta
  obtenida?: boolean
  size?: 'sm' | 'md' | 'lg'
  numero?: number
  total?: number
}

function FilaInfo({ label, valor, dark }: { label: string; valor: string; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontSize: dark ? '0.56rem' : '0.6rem' }}>
      <span style={{ color: '#8a7654', fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ flex: 1, borderBottom: '1px dotted #8a765488', transform: 'translateY(-2px)' }} />
      <span style={{ color: '#3a2a1a', fontWeight: 600, textAlign: 'right' }}>{valor}</span>
    </div>
  )
}

function FilaInfoDark({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontSize: '0.58rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted rgba(255,255,255,0.15)', transform: 'translateY(-2px)' }} />
      <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, textAlign: 'right' }}>{valor}</span>
    </div>
  )
}

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

function Esquina({ pos, color, size }: { pos: typeof ESQUINAS[number]; color: string; size: number }) {
  const [v, h] = pos.split('-') as ['top' | 'bottom', 'left' | 'right']
  return (
    <div style={{
      position: 'absolute', [v]: 4, [h]: 4,
      width: size, height: size,
      borderTop: v === 'top' ? `2px solid ${color}` : undefined,
      borderBottom: v === 'bottom' ? `2px solid ${color}` : undefined,
      borderLeft: h === 'left' ? `2px solid ${color}` : undefined,
      borderRight: h === 'right' ? `2px solid ${color}` : undefined,
      opacity: 0.75,
    }} />
  )
}

export default function CartaPersonaje({ carta, obtenida = true, size = 'md', numero, total }: Props) {
  const rareza = RAREZAS[carta.rareza]
  const esEspecial = carta.rareza === 'legendario' || carta.rareza === 'mitico'
  const dims = size === 'sm' ? { w: 168, h: 268 } : size === 'lg' ? { w: 300, h: 480 } : { w: 220, h: 352 }
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 14
    const rotateX = (0.5 - y) * 14

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.035,1.035,1.035)`

    // Sombra que se proyecta hacia el lado opuesto de la inclinación
    const shadowX = (x - 0.5) * -22
    const shadowY = (y - 0.5) * -22
    card.style.filter = `drop-shadow(${shadowX}px ${shadowY}px 14px rgba(0,0,0,0.35))`

    if (glowRef.current) {
      if (rareza.glow) {
        // Holo arcoíris que se mueve con el cursor
        const angle = 115 + (x - 0.5) * 50
        glowRef.current.style.background = `linear-gradient(${angle}deg, transparent 15%, rgba(255,70,150,0.32) 32%, rgba(70,180,255,0.32) 48%, rgba(255,225,60,0.32) 64%, transparent 85%)`
        glowRef.current.style.backgroundSize = '250% 250%'
        glowRef.current.style.backgroundPosition = `${x * 100}% ${y * 100}%`
      } else {
        glowRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.4), transparent 55%)`
      }
      glowRef.current.style.opacity = '1'
    }
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    card.style.filter = 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))'
    if (glowRef.current) glowRef.current.style.opacity = '0'
  }

  if (!obtenida) {
    return (
      <div style={{
        width: dims.w, height: dims.h,
        borderRadius: 10,
        border: `1.5px dashed ${rareza.color}40`,
        background: `${rareza.color}08`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: size === 'sm' ? 36 : 48, height: size === 'sm' ? 36 : 48, borderRadius: '50%',
          background: `${rareza.color}15`, border: `1px solid ${rareza.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'sm' ? '1.1rem' : '1.4rem', color: `${rareza.color}80`,
        }}>
          ?
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: `${rareza.color}60`, textTransform: 'uppercase', letterSpacing: 1 }}>
          {rareza.label}
        </div>
      </div>
    )
  }

  const wrapperStyle: React.CSSProperties = {
    width: dims.w,
    height: dims.h,
    borderRadius: 10,
    border: `3px double ${rareza.color}70`,
    boxShadow: rareza.glow
      ? `0 0 16px ${rareza.color}40, inset 0 0 0 1px rgba(58,42,26,0.15)`
      : 'inset 0 0 0 1px rgba(58,42,26,0.1)',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
    willChange: 'transform',
    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))',
  }

  // ── FULL ART (Legendario / Mítico con imagen de carta completa) ──────────
  if (carta.fullArt) {
    return (
      <div ref={cardRef} className="carta-personaje" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ ...wrapperStyle, background: '#0a0806' }}
      >
        {/* Imagen de fondo cubriendo toda la carta */}
        {!imgError ? (
          <Image
            src={carta.imagen} alt={carta.nombre} fill
            style={{ objectFit: 'cover', objectPosition: '50% 50%' }}
            unoptimized onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.3 }}>📜</div>
        )}

        {/* Glow cursor */}
        <div ref={glowRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, opacity: 0, transition: 'opacity 0.3s ease', mixBlendMode: 'overlay' }} />

        {/* Esquinas ornamentadas */}
        {esEspecial && ESQUINAS.map(pos => (
          <Esquina key={pos} pos={pos} color={rareza.color} size={size === 'sm' ? 12 : 18} />
        ))}

        {/* Badge rareza */}
        <div style={{
          position: 'absolute', top: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8, zIndex: 2,
          width: size === 'sm' ? 18 : 22, height: size === 'sm' ? 18 : 22, borderRadius: '50%',
          background: rareza.color, border: '1.5px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 800, color: '#fff',
          fontFamily: 'Georgia, serif',
        }}>
          {rareza.letra}
        </div>
        {numero !== undefined && total !== undefined && (
          <div style={{ position: 'absolute', bottom: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8, zIndex: 2, fontSize: size === 'sm' ? '0.44rem' : '0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
            №{String(numero).padStart(2, '0')}/{total}
          </div>
        )}

        {/* Shimmer */}
        {rareza.glow && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
            background: `linear-gradient(105deg, transparent 40%, ${rareza.color}1a 50%, transparent 60%)`,
            backgroundSize: '200% 100%', animation: 'shimmer-carta 3.5s infinite',
          }} />
        )}
        <style>{`@keyframes shimmer-carta { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }`}</style>
      </div>
    )
  }

  // ── CARTA ESTÁNDAR ────────────────────────────────────────────────────────
  return (
    <div
      ref={cardRef}
      className="carta-personaje"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...wrapperStyle,
        background: 'linear-gradient(155deg, #f3e8d0 0%, #e9dab8 55%, #ecdfc0 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Glow que sigue al cursor */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          opacity: 0, transition: 'opacity 0.3s ease', mixBlendMode: 'overlay',
        }}
      />

      {/* Esquinas ornamentadas — solo Legendario y Mítico */}
      {esEspecial && ESQUINAS.map(pos => (
        <Esquina key={pos} pos={pos} color={rareza.color} size={size === 'sm' ? 12 : 18} />
      ))}
      {/* Nombre + epíteto */}
      <div style={{ padding: size === 'sm' ? '0.4rem 0.55rem 0.25rem' : '0.55rem 0.7rem 0.3rem', position: 'relative' }}>
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 800,
          fontSize: size === 'sm' ? '0.78rem' : '0.92rem',
          color: '#3a2a1a',
          lineHeight: 1.1,
          paddingRight: 24,
        }}>
          {carta.nombre}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: size === 'sm' ? '0.56rem' : '0.64rem',
          color: '#8a7654',
        }}>
          {carta.epiteto}
        </div>
        {/* Badge rareza */}
        <div style={{
          position: 'absolute', top: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8,
          width: size === 'sm' ? 18 : 22, height: size === 'sm' ? 18 : 22, borderRadius: '50%',
          background: rareza.color,
          border: '1.5px solid #f3e8d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 800, color: '#fff',
          fontFamily: 'Georgia, serif',
        }}>
          {rareza.letra}
        </div>
        {/* Numeración de carta */}
        {numero !== undefined && total !== undefined && (
          <div style={{
            position: 'absolute', bottom: -2, right: size === 'sm' ? 6 : 8,
            fontSize: size === 'sm' ? '0.46rem' : '0.52rem',
            color: '#8a7654', fontWeight: 700, letterSpacing: 0.5,
          }}>
            №{String(numero).padStart(2, '0')}/{total}
          </div>
        )}
      </div>

      {/* Imagen */}
      <div style={{
        position: 'relative', width: '100%', height: size === 'sm' ? '38%' : '42%',
        margin: '0 auto', overflow: 'hidden',
        borderTop: '1px solid rgba(138,118,84,0.4)', borderBottom: '1px solid rgba(138,118,84,0.4)',
        background: '#d8c8a0',
      }}>
        {!imgError ? (
          <Image
            src={carta.imagen}
            alt={carta.nombre}
            fill
            style={{ objectFit: 'cover', objectPosition: `${carta.posicionX}% ${carta.posicionY}%` }}
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'lg' ? '3rem' : '2rem', opacity: 0.3 }}>
            📜
          </div>
        )}
      </div>

      {/* Concepto */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: size === 'sm' ? '0.3rem 0.55rem' : '0.4rem 0.7rem',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: rareza.color }} />
        <span style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: size === 'sm' ? '0.56rem' : '0.64rem', color: '#5a4530',
        }}>
          {carta.concepto}
        </span>
      </div>

      {/* Info */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 2 : 3,
        padding: size === 'sm' ? '0 0.55rem' : '0 0.7rem',
      }}>
        <FilaInfo label="OBRA" valor={carta.obra} dark={size === 'sm'} />
        <FilaInfo label="AUTOR" valor={carta.autor} dark={size === 'sm'} />
        <FilaInfo label="AÑO" valor={String(carta.anio)} dark={size === 'sm'} />
        {size !== 'sm' && <FilaInfo label="ORIGEN" valor={carta.origen} />}
        {size !== 'sm' && <FilaInfo label="SÍMBOLO" valor={carta.simbolo} />}
      </div>

      {/* Footer: rareza + cita */}
      <div style={{
        borderTop: '1px solid rgba(138,118,84,0.35)',
        padding: size === 'sm' ? '0.3rem 0.55rem' : '0.4rem 0.7rem',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <span style={{
          fontSize: size === 'sm' ? '0.5rem' : '0.56rem', fontWeight: 800,
          color: rareza.color, textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {rareza.label}
        </span>
        {size !== 'sm' && (
          <span style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.6rem', color: '#6a5a40', lineHeight: 1.3,
          }}>
            {carta.cita}
          </span>
        )}
      </div>

      {/* Shimmer para épico+ */}
      {rareza.glow && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 40%, ${rareza.color}1a 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer-carta 3.5s infinite',
        }} />
      )}

      <style>{`
        @keyframes shimmer-carta {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  )
}
