'use client'

import Image from 'next/image'
import { useState } from 'react'
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
      <span style={{ color: '#8a7654', fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #8a765488', transform: 'translateY(-2px)' }} />
      <span style={{ color: '#3a2a1a', fontWeight: 600, textAlign: 'right' }}>{valor}</span>
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
      opacity: 0.8, pointerEvents: 'none',
    }} />
  )
}

const ANIMATIONS = `
  @keyframes shimmer-carta {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
`

export default function CartaPersonaje({ carta, obtenida = true, size = 'md', numero, total }: Props) {
  const rareza = RAREZAS[rarezaVisual(carta.rareza)]
  const esEspecial = rarezaVisual(carta.rareza) === 'legendario'
  const dims = size === 'sm' ? { w: 168, h: 268 } : size === 'lg' ? { w: 300, h: 480 } : { w: 220, h: 352 }
  const [imgError, setImgError] = useState(false)

  const wrapperStyle: React.CSSProperties = {
    width: dims.w, height: dims.h,
    borderRadius: 10,
    border: `3px double ${rareza.color}70`,
    boxShadow: rareza.glow
      ? `0 0 16px ${rareza.color}40, inset 0 0 0 1px rgba(58,42,26,0.15)`
      : 'inset 0 0 0 1px rgba(58,42,26,0.1)',
    overflow: 'hidden', position: 'relative', flexShrink: 0,
    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
    filter: obtenida ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))' : 'grayscale(1) brightness(0.45)',
    opacity: obtenida ? 1 : 0.7,
    cursor: obtenida ? undefined : 'default',
  }

  // ── ÉPICO ────────────────────────────────────────────────────────────────
  if (carta.rareza === 'epico' && !carta.fullArt) {
    const artH = Math.round(dims.h * 0.47)
    return (
      <div
        className="carta-personaje"
        style={{
          width: dims.w, height: dims.h,
          borderRadius: 10,
          position: 'relative',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(155deg, #2a1c0e 0%, #4a3018 50%, #3a2410 100%)',
          border: '2px solid #8a6a3a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,200,100,0.15)',
          overflow: 'hidden',
          filter: obtenida ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))' : 'grayscale(1) brightness(0.45)',
          opacity: obtenida ? 1 : 0.7,
        }}
      >
        {/* Header */}
        <div style={{
          padding: size === 'sm' ? '6px 8px 4px' : '8px 10px 5px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ maxWidth: '80%' }}>
            <div style={{
              fontFamily: 'Georgia, "Palatino Linotype", serif',
              fontWeight: 900,
              fontSize: size === 'sm' ? '0.7rem' : '0.9rem',
              color: '#e8c87a',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {carta.nombre}
            </div>
            <div style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: size === 'sm' ? '0.52rem' : '0.62rem',
              color: '#c4a870', marginTop: 1,
            }}>
              {carta.epiteto}
            </div>
          </div>
          <div style={{
            width: size === 'sm' ? 18 : 22, height: size === 'sm' ? 18 : 22,
            borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1a1208', border: '1.5px solid #8a6a3a',
            fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 800,
            color: '#c4a060', fontFamily: 'Georgia, serif',
          }}>É</div>
        </div>

        {/* Art window */}
        <div style={{
          height: artH, position: 'relative', overflow: 'hidden', flexShrink: 0,
          borderTop: '1px solid rgba(138,100,50,0.5)', borderBottom: '1px solid rgba(138,100,50,0.5)',
        }}>
          {!imgError ? (
            <Image
              src={carta.imagen} alt={carta.nombre} fill
              style={{ objectFit: 'cover', objectPosition: `${carta.posicionX ?? 50}% ${carta.posicionY ?? 20}%` }}
              unoptimized onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#7a6040', opacity: 0.5 }}>📜</div>
          )}
        </div>

        {/* Concepto separator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: size === 'sm' ? '4px 8px' : '5px 10px',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8a6a3a', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: size === 'sm' ? '0.52rem' : '0.6rem', color: '#c4a870',
          }}>{carta.concepto}</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(138,100,50,0.6), transparent)' }} />
        </div>

        {/* Facts panel */}
        <div style={{
          flex: 1, margin: '0 8px',
          background: 'rgba(240,220,175,0.88)',
          borderRadius: 4,
          padding: size === 'sm' ? '5px 8px' : '6px 10px',
          display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 2 : 3,
        }}>
          <FilaInfo label="OBRA" valor={carta.obra} dark={size === 'sm'} />
          <FilaInfo label="AUTOR" valor={carta.autor} dark={size === 'sm'} />
          {size !== 'sm' && <FilaInfo label="AÑO" valor={String(carta.anio)} />}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: size === 'sm' ? '4px 8px 5px' : '5px 10px 7px', marginTop: 4,
        }}>
          <span style={{
            fontSize: size === 'sm' ? '0.48rem' : '0.54rem', fontWeight: 800,
            color: '#c4a060', textTransform: 'uppercase', letterSpacing: '0.12em',
            fontFamily: 'Georgia, serif',
          }}>Épico</span>
          {size !== 'sm' && (
            <span style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '0.54rem', color: '#b89060', textAlign: 'right',
              maxWidth: '70%', lineHeight: 1.2,
            }}>« {carta.cita} »</span>
          )}
        </div>

        {numero !== undefined && total !== undefined && (
          <div style={{
            position: 'absolute', bottom: 4, right: 6,
            fontSize: size === 'sm' ? '0.44rem' : '0.5rem',
            color: 'rgba(196,160,96,0.5)', fontWeight: 700,
          }}>
            №{String(numero).padStart(2, '0')}/{total}
          </div>
        )}
      </div>
    )
  }

  // ── FULL ART (Legendario / Mítico) ────────────────────────────────────────
  if (carta.fullArt) {
    return (
      <div className="carta-personaje" style={{ ...wrapperStyle, background: '#0a0806' }}>
        {!imgError ? (
          <Image src={carta.imagen} alt={carta.nombre} fill
            style={{ objectFit: 'cover', objectPosition: '50% 50%' }}
            unoptimized onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.3 }}>📜</div>
        )}

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
        <style dangerouslySetInnerHTML={{ __html: ANIMATIONS }} />
      </div>
    )
  }

  // ── CARTA ESTÁNDAR ────────────────────────────────────────────────────────
  return (
    <div
      className="carta-personaje"
      style={{
        ...wrapperStyle,
        background: 'linear-gradient(155deg, #f3e8d0 0%, #e9dab8 55%, #ecdfc0 100%)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {esEspecial && ESQUINAS.map(pos => (
        <Esquina key={pos} pos={pos} color={rareza.color} size={size === 'sm' ? 12 : 18} />
      ))}

      <div style={{ padding: size === 'sm' ? '0.4rem 0.55rem 0.25rem' : '0.55rem 0.7rem 0.3rem', position: 'relative' }}>
        <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 800, fontSize: size === 'sm' ? '0.78rem' : '0.92rem', color: '#3a2a1a', lineHeight: 1.1, paddingRight: 24 }}>
          {carta.nombre}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: size === 'sm' ? '0.56rem' : '0.64rem', color: '#8a7654' }}>
          {carta.epiteto}
        </div>
        <div style={{
          position: 'absolute', top: size === 'sm' ? 6 : 8, right: size === 'sm' ? 6 : 8,
          width: size === 'sm' ? 18 : 22, height: size === 'sm' ? 18 : 22, borderRadius: '50%',
          background: rareza.color, border: '1.5px solid #f3e8d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 800, color: '#fff',
          fontFamily: 'Georgia, serif',
        }}>
          {rareza.letra}
        </div>
        {numero !== undefined && total !== undefined && (
          <div style={{ position: 'absolute', bottom: -2, right: size === 'sm' ? 6 : 8, fontSize: size === 'sm' ? '0.46rem' : '0.52rem', color: '#8a7654', fontWeight: 700, letterSpacing: 0.5 }}>
            №{String(numero).padStart(2, '0')}/{total}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', height: size === 'sm' ? '38%' : '42%', margin: '0 auto', overflow: 'hidden', borderTop: '1px solid rgba(138,118,84,0.4)', borderBottom: '1px solid rgba(138,118,84,0.4)', background: '#d8c8a0' }}>
        {!imgError ? (
          <Image src={carta.imagen} alt={carta.nombre} fill
            style={{ objectFit: 'cover', objectPosition: `${carta.posicionX}% ${carta.posicionY}%` }}
            unoptimized onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'lg' ? '3rem' : '2rem', opacity: 0.3 }}>📜</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: size === 'sm' ? '0.3rem 0.55rem' : '0.4rem 0.7rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: rareza.color }} />
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: size === 'sm' ? '0.56rem' : '0.64rem', color: '#5a4530' }}>
          {carta.concepto}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 2 : 3, padding: size === 'sm' ? '0 0.55rem' : '0 0.7rem' }}>
        <FilaInfo label="OBRA" valor={carta.obra} dark={size === 'sm'} />
        <FilaInfo label="AUTOR" valor={carta.autor} dark={size === 'sm'} />
        <FilaInfo label="AÑO" valor={String(carta.anio)} dark={size === 'sm'} />
        {size !== 'sm' && <FilaInfo label="ORIGEN" valor={carta.origen} />}
        {size !== 'sm' && <FilaInfo label="SÍMBOLO" valor={carta.simbolo} />}
      </div>

      <div style={{ borderTop: '1px solid rgba(138,118,84,0.35)', padding: size === 'sm' ? '0.3rem 0.55rem' : '0.4rem 0.7rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: size === 'sm' ? '0.5rem' : '0.56rem', fontWeight: 800, color: rareza.color, textTransform: 'uppercase', letterSpacing: 1 }}>
          {rareza.label}
        </span>
        {size !== 'sm' && (
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.6rem', color: '#6a5a40', lineHeight: 1.3 }}>
            {carta.cita}
          </span>
        )}
      </div>

      {rareza.glow && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 40%, ${rareza.color}1a 50%, transparent 60%)`,
          backgroundSize: '200% 100%', animation: 'shimmer-carta 3.5s infinite',
        }} />
      )}
      <style>{ANIMATIONS}</style>
    </div>
  )
}
