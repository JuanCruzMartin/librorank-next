'use client'

import { useState } from 'react'
import { CARTAS, RAREZAS, type Carta, type Rareza } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'
import CartaDorso from '@/components/CartaDorso'

interface Props {
  coleccion: string[]
  tiradas: number
}

const ORDEN_RAREZA: Rareza[] = ['comun', 'raro', 'epico', 'legendario', 'mitico']

const EMOJI_RAREZA: Record<Rareza, string> = {
  comun: '🥉', raro: '🔵', epico: '💜', legendario: '⭐', mitico: '👑',
}

export default function ColeccionClient({ coleccion: coleccionInicial, tiradas: tiradasIniciales }: Props) {
  const [coleccion, setColeccion] = useState<string[]>(coleccionInicial)
  const [tiradas, setTiradas] = useState(tiradasIniciales)
  const [tirando, setTirando] = useState(false)
  const [reveal, setReveal] = useState<{ carta: Carta; esNueva: boolean; revelada: boolean } | null>(null)
  const [ampliada, setAmpliada] = useState<Carta | null>(null)

  const totalObtenidas = new Set(coleccion).size

  async function tirar() {
    if (tiradas <= 0 || tirando) return
    setTirando(true)
    try {
      const res = await fetch('/api/cartas/tirar', { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      setTiradas(t => t - 1)
      if (data.esNueva) setColeccion(c => [...c, data.carta.id])
      setReveal({ carta: data.carta, esNueva: data.esNueva, revelada: false })
    } finally {
      setTirando(false)
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>

      {/* Header álbum */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 className="font-title" style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', marginBottom: 4 }}>
            📖 Mi Colección
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            {totalObtenidas} de {CARTAS.length} personajes desbloqueados
          </p>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 5, width: 220, overflow: 'hidden' }}>
            <div style={{
              width: `${(totalObtenidas / CARTAS.length) * 100}%`,
              height: '100%',
              background: 'var(--accent-gold)',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 10, padding: '4px 12px',
          }}>
            🎴 {tiradas} tirada{tiradas !== 1 ? 's' : ''}
          </div>
          <button
            onClick={tirar}
            disabled={tiradas <= 0 || tirando}
            className="btn--brand"
            style={{ opacity: tiradas <= 0 ? 0.4 : 1, fontSize: '0.85rem' }}
          >
            {tirando ? 'Revelando...' : tiradas > 0 ? '✨ Tirar carta' : 'Sin tiradas'}
          </button>
          {tiradas <= 0 && (
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right', maxWidth: 180 }}>
              1 tirada cada 500 puntos acumulados
            </p>
          )}
        </div>
      </div>

      {/* Secciones por rareza */}
      {ORDEN_RAREZA.map(rareza => {
        const cartasDeRareza = CARTAS.filter(c => c.rareza === rareza)
        const obtenidas = cartasDeRareza.filter(c => coleccion.includes(c.id)).length
        const r = RAREZAS[rareza]

        return (
          <div key={rareza} style={{ marginBottom: '2rem' }}>
            {/* Cabecera sección */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: '1rem',
              paddingBottom: '0.6rem',
              borderBottom: `1px solid ${r.color}30`,
            }}>
              <span style={{ fontSize: '1.1rem' }}>{EMOJI_RAREZA[rareza]}</span>
              <span style={{ fontWeight: 800, color: r.color, fontSize: '0.95rem' }}>
                {r.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                {obtenidas}/{cartasDeRareza.length}
              </span>
              {/* Mini barra */}
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                borderRadius: 99, height: 4, overflow: 'hidden', maxWidth: 100,
              }}>
                <div style={{
                  width: `${cartasDeRareza.length > 0 ? (obtenidas / cartasDeRareza.length) * 100 : 0}%`,
                  height: '100%', background: r.color, borderRadius: 99,
                }} />
              </div>
              {obtenidas === cartasDeRareza.length && cartasDeRareza.length > 0 && (
                <span style={{ fontSize: '0.65rem', color: r.color, fontWeight: 700, background: `${r.color}20`, padding: '2px 8px', borderRadius: 20 }}>
                  ✓ Completo
                </span>
              )}
            </div>

            {/* Grid de cartas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
              {cartasDeRareza.map(carta => {
                const tengo = coleccion.includes(carta.id)
                const indiceGlobal = CARTAS.findIndex(c => c.id === carta.id) + 1
                return (
                  <div
                    key={carta.id}
                    title={tengo ? `${carta.nombre} — ${carta.obra}` : '???'}
                    onClick={() => tengo && setAmpliada(carta)}
                    style={{ cursor: tengo ? 'pointer' : 'default' }}
                  >
                    <CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={indiceGlobal} total={CARTAS.length} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Modal reveal */}
      {reveal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => reveal.revelada && setReveal(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
          }}>
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase',
              color: !reveal.revelada ? 'rgba(255,255,255,0.4)' : reveal.esNueva ? '#4cd137' : 'rgba(255,255,255,0.3)',
              minHeight: '1em',
            }}>
              {!reveal.revelada ? 'Tocá la carta para revelar' : reveal.esNueva ? '✨ ¡Carta nueva!' : '🔁 Duplicada'}
            </p>

            {/* Flip card */}
            <div
              onClick={() => !reveal.revelada && setReveal(r => r ? { ...r, revelada: true } : r)}
              style={{
                width: 300, height: 480, perspective: 1200,
                cursor: reveal.revelada ? 'default' : 'pointer',
                position: 'relative',
              }}
            >
              {/* Partículas para rarezas altas, solo después de revelar */}
              {reveal.revelada && (reveal.carta.rareza === 'legendario' || reveal.carta.rareza === 'mitico') && (
                <div style={{ position: 'absolute', inset: -40, pointerEvents: 'none', zIndex: 10 }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        position: 'absolute',
                        left: '50%', top: '50%',
                        width: 5, height: 5, borderRadius: '50%',
                        background: reveal.carta.color,
                        boxShadow: `0 0 6px ${reveal.carta.color}`,
                        animation: 'particula-fly 1.1s ease-out forwards',
                        animationDelay: `${i * 30}ms`,
                        opacity: 0,
                        ['--ang' as string]: `${(360 / 16) * i}deg`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}

              <div style={{
                width: '100%', height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
                transform: reveal.revelada ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
                  <CartaDorso size="lg" />
                </div>
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <CartaPersonaje carta={reveal.carta} obtenida size="lg" numero={CARTAS.findIndex(c => c.id === reveal.carta.id) + 1} total={CARTAS.length} />
                </div>
              </div>
            </div>

            {reveal.revelada && (
              <>
                <div style={{ textAlign: 'center', animation: 'fade-in-bg 0.4s ease' }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                    {reveal.carta.autor} · {reveal.carta.anio}
                  </p>
                  <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', maxWidth: 260, fontStyle: 'italic' }}>
                    {reveal.carta.cita}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, animation: 'fade-in-bg 0.4s ease' }}>
                  {tiradas > 0 && (
                    <button className="btn--brand" onClick={() => { setReveal(null); setTimeout(tirar, 80) }}>
                      🎴 Otra tirada ({tiradas})
                    </button>
                  )}
                  <button
                    onClick={() => setReveal(null)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10, color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer', fontSize: '0.82rem',
                    }}
                  >
                    Ver colección
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal ampliar carta */}
      {ampliada && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.82)',
            backdropFilter: 'blur(3px)',
            zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in-bg 0.2s ease',
          }}
          onClick={() => setAmpliada(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ animation: 'zoom-in-carta 0.3s cubic-bezier(0.22,1,0.36,1)', position: 'relative' }}
          >
            <CartaPersonaje carta={ampliada} obtenida size="lg" numero={CARTAS.findIndex(c => c.id === ampliada.id) + 1} total={CARTAS.length} />
            <button
              onClick={() => setAmpliada(null)}
              style={{
                position: 'absolute', top: -14, right: -14,
                width: 32, height: 32, borderRadius: '50%',
                background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-bg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes zoom-in-carta {
          from { transform: scale(0.7) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0);      opacity: 1; }
        }
        @keyframes particula-fly {
          0%   { opacity: 1; transform: translate(-50%, -50%) rotate(var(--ang)) translateX(0px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--ang)) translateX(110px) scale(0.2); }
        }
      `}</style>
    </div>
  )
}
