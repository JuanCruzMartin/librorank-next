'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Carta } from '@/lib/cartas'
import { RAREZAS } from '@/lib/cartas'

interface Props {
  carta: Carta
  obtenida?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CartaPersonaje({ carta, obtenida = true, size = 'md' }: Props) {
  const rareza = RAREZAS[carta.rareza]
  const dims = size === 'sm' ? { w: 130, h: 182 } : size === 'lg' ? { w: 240, h: 336 } : { w: 180, h: 252 }
  const [imgError, setImgError] = useState(false)

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 12,
        border: `2px solid ${obtenida ? carta.color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: obtenida && rareza.glow ? `0 0 18px ${carta.color}55, 0 0 6px ${carta.color}33` : 'none',
        background: obtenida
          ? `linear-gradient(160deg, ${carta.color}18 0%, #1a1a2e 60%)`
          : 'rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        filter: obtenida ? 'none' : 'grayscale(1) brightness(0.35)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: obtenida ? 'default' : 'not-allowed',
      }}
      className="carta-personaje"
    >
      {/* Imagen */}
      <div style={{ position: 'relative', width: '100%', height: '62%', overflow: 'hidden', background: `${carta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!imgError ? (
          <Image
            src={carta.imagen}
            alt={carta.nombre}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ fontSize: size === 'lg' ? '4rem' : '2.5rem', opacity: 0.4 }}>📜</div>
        )}
        {/* Gradiente sobre imagen */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 50%, #1a1a2e 100%)`,
        }} />
        {/* Badge rareza */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: `${carta.color}cc`,
          borderRadius: 20,
          padding: '2px 7px',
          fontSize: size === 'sm' ? '0.52rem' : '0.6rem',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          backdropFilter: 'blur(4px)',
        }}>
          {rareza.label}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: size === 'sm' ? '0.4rem 0.5rem' : '0.55rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: size === 'sm' ? '0.62rem' : '0.72rem',
          fontWeight: 800,
          color: obtenida ? '#fff' : 'rgba(255,255,255,0.3)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {carta.nombre}
        </div>
        <div style={{
          fontSize: size === 'sm' ? '0.52rem' : '0.58rem',
          color: obtenida ? carta.color : 'rgba(255,255,255,0.15)',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {carta.obra}
        </div>
        {size !== 'sm' && (
          <div style={{
            fontSize: '0.52rem',
            color: 'rgba(255,255,255,0.3)',
            marginTop: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {carta.descripcion}
          </div>
        )}
      </div>

      {/* Shimmer para épico+ */}
      {obtenida && rareza.glow && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 40%, ${carta.color}12 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer-carta 3s infinite',
        }} />
      )}
    </div>
  )
}
