'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Carta } from '@/lib/cartas'
import { RAREZAS, rarezaVisual } from '@/lib/cartas'

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
      opacity: 0.8,
      pointerEvents: 'none',
    }} />
  )
}

function getSagaColor(autor: string): string {
  if (autor === 'J.R.R. Tolkien') return '#2e7d32'
  if (autor === 'George R.R. Martin') return '#b71c1c'
  if (autor === 'Antoine de Saint-Exupéry') return '#e65100'
  if (autor === 'J.K. Rowling') return '#7b1fa2'
  return '#b8860b'
}

const ANIMATIONS = `
  @keyframes shimmer-carta {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes holoRotate {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmerEpico {
    0%, 100% { background-position: 200% center; }
    50%       { background-position: -200% center; }
  }
  @keyframes sparkleAnim {
    0%, 100% { opacity: 0.15; transform: scale(0.6); }
    50%       { opacity: 1;    transform: scale(1.5); }
  }
`

// Solo en la zona de imagen (top 28%), no en el panel de texto
const SPARKLE_POS = [
  { x: '12%', y: '9%' },
  { x: '76%', y: '7%' },
  { x: '20%', y: '24%' },
  { x: '70%', y: '21%' },
]

export default function CartaPersonaje({ carta, obtenida = true, size = 'md', numero, total }: Props) {
  const rareza = RAREZAS[rarezaVisual(carta.rareza)]
  const esEspecial = rarezaVisual(carta.rareza) === 'legendario'
  const esEpico = carta.rareza === 'epico'
  const sagaColor = esEpico ? getSagaColor(carta.autor) : rareza.color
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

    const shadowX = (x - 0.5) * -22
    const shadowY = (y - 0.5) * -22
    if (esEpico) {
      card.style.filter = `drop-shadow(${shadowX}px ${shadowY}px 14px rgba(0,0,0,0.5)) drop-shadow(0 0 18px ${sagaColor}70)`
    } else {
      card.style.filter = `drop-shadow(${shadowX}px ${shadowY}px 14px rgba(0,0,0,0.35))`
    }

    if (glowRef.current) {
      if (rareza.glow || esEpico) {
        const angle = 115 + (x - 0.5) * 50
        glowRef.current.style.background = `linear-gradient(${angle}deg, transparent 15%, rgba(255,70,150,0.28) 32%, rgba(70,180,255,0.28) 48%, rgba(255,225,60,0.28) 64%, transparent 85%)`
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
    card.style.filter = esEpico
      ? `drop-shadow(0px 8px 20px ${sagaColor}80)`
      : obtenida ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))' : 'grayscale(1) brightness(0.45)'
    if (glowRef.current) glowRef.current.style.opacity = '0'
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
    filter: obtenida ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))' : 'grayscale(1) brightness(0.45)',
    opacity: obtenida ? 1 : 0.7,
    cursor: obtenida ? undefined : 'default',
  }

  // ── ÉPICO (Holographic) ──────────────────────────────────────────────────
  if (esEpico) {
    return (
      <div
        ref={cardRef}
        className="carta-personaje"
        onMouseMove={obtenida ? handleMouseMove : undefined}
        onMouseLeave={obtenida ? handleMouseLeave : undefined}
        style={{
          width: dims.w,
          height: dims.h,
          borderRadius: 10,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
          willChange: 'transform',
          filter: obtenida
            ? `drop-shadow(0px 8px 20px ${sagaColor}80)`
            : 'grayscale(1) brightness(0.45)',
          opacity: obtenida ? 1 : 0.7,
          cursor: obtenida ? undefined : 'default',
          boxShadow: `0 0 0 2px ${sagaColor}cc, 0 0 22px ${sagaColor}50`,
        }}
      >
        {/* ── Fondo holográfico ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(145deg, #0d0820 0%, #150d28 40%, #0d1228 100%)`,
          zIndex: 0,
        }}>
          {/* Conic gradient rotando — efecto arcoíris */}
          <div style={{
            position: 'absolute',
            top: '-75%', left: '-75%',
            width: '250%', height: '250%',
            background: `conic-gradient(from 0deg at 50% 50%,
              transparent 0deg,
              ${sagaColor}35 80deg,
              rgba(255,61,232,0.18) 160deg,
              rgba(0,212,255,0.18) 240deg,
              rgba(255,229,96,0.18) 300deg,
              transparent 360deg)`,
            animation: 'holoRotate 8s linear infinite',
            mixBlendMode: 'screen',
          }} />
          {/* Grilla de diamantes */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='10,1 19,10 10,19 1,10' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px',
          }} />
          {/* Shimmer diagonal */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)',
            backgroundSize: '250% 100%',
            animation: 'shimmerEpico 4s ease-in-out infinite',
          }} />
        </div>

        {/* ── Imagen (ocupa parte superior, fade largo hacia el panel) ── */}
        {!imgError ? (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '72%',
            zIndex: 2,
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 92%)',
            pointerEvents: 'none',
          }}>
            <Image
              src={carta.imagen}
              alt={carta.nombre}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: `${carta.posicionX}% ${carta.posicionY}%`,
              }}
              unoptimized
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div style={{
            position: 'absolute', top: '8%', left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', opacity: 0.3, zIndex: 2,
          }}>📜</div>
        )}

        {/* ── Panel de texto ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '58%',
          background: `linear-gradient(to bottom, transparent 0%, rgba(13,8,32,0.82) 16%, rgba(13,8,32,0.97) 38%, rgba(13,8,32,0.99) 100%)`,
          padding: size === 'sm'
            ? '0.8rem 0.55rem 0.35rem'
            : '1.1rem 0.7rem 0.45rem',
          display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 2 : 3,
          zIndex: 5,
        }}>
          {/* Nombre metálico */}
          <div style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 800,
            fontSize: size === 'sm' ? '0.78rem' : '0.92rem',
            background: `linear-gradient(135deg, #ffffff 20%, ${sagaColor} 55%, #ffe566 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
            paddingRight: 26,
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.95))',
          }}>
            {carta.nombre}
          </div>

          {/* Concepto — alma del personaje */}
          <div style={{
            fontSize: size === 'sm' ? '0.52rem' : '0.62rem',
            fontWeight: 700,
            color: sagaColor,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            textShadow: `0 0 8px ${sagaColor}60`,
          }}>
            {carta.concepto}
          </div>

          {/* Separador saga */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${sagaColor}80, transparent)` }} />

          {/* Info compacta */}
          <FilaInfoDark label="OBRA" valor={carta.obra} />
          {size !== 'sm' && <FilaInfoDark label="AUTOR" valor={carta.autor} />}

          {/* Cita — solo md y lg */}
          {size !== 'sm' && (
            <>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)' }} />
              <div style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: size === 'lg' ? '0.6rem' : '0.54rem',
                color: 'rgba(255,255,255,0.38)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
              }}>
                {carta.cita}
              </div>
            </>
          )}

          {/* Label rareza */}
          <div style={{
            marginTop: 'auto',
            fontSize: size === 'sm' ? '0.5rem' : '0.56rem',
            fontWeight: 800,
            color: sagaColor,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            textShadow: `0 0 12px ${sagaColor}cc`,
          }}>
            ✦ Épico ✦
          </div>
        </div>

        {/* ── Badge rareza ── */}
        <div style={{
          position: 'absolute', top: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8, zIndex: 15,
          width: size === 'sm' ? 18 : 22, height: size === 'sm' ? 18 : 22, borderRadius: '50%',
          background: sagaColor,
          border: '2px solid rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 800, color: '#fff',
          fontFamily: 'Georgia, serif',
          boxShadow: `0 0 12px ${sagaColor}cc`,
        }}>
          É
        </div>

        {/* Numeración */}
        {numero !== undefined && total !== undefined && (
          <div style={{
            position: 'absolute', bottom: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8, zIndex: 15,
            fontSize: size === 'sm' ? '0.44rem' : '0.5rem',
            color: 'rgba(255,255,255,0.4)', fontWeight: 700,
          }}>
            №{String(numero).padStart(2, '0')}/{total}
          </div>
        )}

        {/* Esquinas ornamentadas */}
        {ESQUINAS.map(pos => (
          <Esquina key={pos} pos={pos} color={sagaColor} size={size === 'sm' ? 12 : 18} />
        ))}

        {/* Partículas sparkle */}
        {SPARKLE_POS.map(({ x, y }, i) => (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, zIndex: 11,
            width: size === 'sm' ? 4 : 5, height: size === 'sm' ? 4 : 5,
            background: sagaColor, borderRadius: '50%',
            boxShadow: `0 0 6px ${sagaColor}, 0 0 14px ${sagaColor}80`,
            animation: `sparkleAnim ${1.2 + i * 0.45}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Glow cursor */}
        <div ref={glowRef} style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          pointerEvents: 'none', zIndex: 12,
          opacity: 0, transition: 'opacity 0.3s ease', mixBlendMode: 'screen',
        }} />

        <style>{ANIMATIONS}</style>
      </div>
    )
  }

  // ── FULL ART (Legendario / Mítico con imagen de carta completa) ──────────
  if (carta.fullArt) {
    return (
      <div ref={cardRef} className="carta-personaje"
        onMouseMove={obtenida ? handleMouseMove : undefined}
        onMouseLeave={obtenida ? handleMouseLeave : undefined}
        style={{ ...wrapperStyle, background: '#0a0806' }}
      >
        {!imgError ? (
          <Image
            src={carta.imagen} alt={carta.nombre} fill
            style={{ objectFit: 'cover', objectPosition: '50% 50%' }}
            unoptimized onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.3 }}>📜</div>
        )}

        <div ref={glowRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, opacity: 0, transition: 'opacity 0.3s ease', mixBlendMode: 'overlay' }} />

        {esEspecial && ESQUINAS.map(pos => (
          <Esquina key={pos} pos={pos} color={rareza.color} size={size === 'sm' ? 12 : 18} />
        ))}

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

        {rareza.glow && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
            background: `linear-gradient(105deg, transparent 40%, ${rareza.color}1a 50%, transparent 60%)`,
            backgroundSize: '200% 100%', animation: 'shimmer-carta 3.5s infinite',
          }} />
        )}
        <style>{ANIMATIONS}</style>
      </div>
    )
  }

  // ── CARTA ESTÁNDAR ────────────────────────────────────────────────────────
  return (
    <div
      ref={cardRef}
      className="carta-personaje"
      onMouseMove={obtenida ? handleMouseMove : undefined}
      onMouseLeave={obtenida ? handleMouseLeave : undefined}
      style={{
        ...wrapperStyle,
        background: 'linear-gradient(155deg, #f3e8d0 0%, #e9dab8 55%, #ecdfc0 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          opacity: 0, transition: 'opacity 0.3s ease', mixBlendMode: 'overlay',
        }}
      />

      {esEspecial && ESQUINAS.map(pos => (
        <Esquina key={pos} pos={pos} color={rareza.color} size={size === 'sm' ? 12 : 18} />
      ))}

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

      {rareza.glow && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 40%, ${rareza.color}1a 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer-carta 3.5s infinite',
        }} />
      )}

      <style>{ANIMATIONS}</style>
    </div>
  )
}
