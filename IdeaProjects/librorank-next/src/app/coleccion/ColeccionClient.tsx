'use client'

import { useState } from 'react'
import { CARTAS, RAREZAS, type Carta, type Rareza } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'

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
  const [reveal, setReveal] = useState<{ carta: Carta; esNueva: boolean } | null>(null)

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
      setReveal({ carta: data.carta, esNueva: data.esNueva })
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {cartasDeRareza.map(carta => {
                const tengo = coleccion.includes(carta.id)
                return (
                  <div
                    key={carta.id}
                    style={{ position: 'relative' }}
                    title={tengo ? `${carta.nombre} — ${carta.obra}` : '???'}
                  >
                    {tengo ? (
                      <CartaPersonaje carta={carta} obtenida size="sm" />
                    ) : (
                      /* Slot vacío estilo álbum */
                      <div style={{
                        width: 130, height: 182,
                        borderRadius: 10,
                        border: `1.5px dashed ${r.color}35`,
                        background: `${r.color}06`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        flexShrink: 0,
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: `${r.color}12`,
                          border: `1px solid ${r.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.3rem', color: `${r.color}60`,
                        }}>
                          ?
                        </div>
                        <div style={{
                          fontSize: '0.55rem', fontWeight: 700, color: `${r.color}50`,
                          textTransform: 'uppercase', letterSpacing: 1,
                        }}>
                          {r.label}
                        </div>
                      </div>
                    )}
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
          onClick={() => setReveal(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
          }}>
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase',
              color: reveal.esNueva ? '#4cd137' : 'rgba(255,255,255,0.3)',
            }}>
              {reveal.esNueva ? '✨ ¡Carta nueva!' : '🔁 Duplicada'}
            </p>

            <div style={{ animation: 'reveal-carta 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <CartaPersonaje carta={reveal.carta} obtenida size="lg" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                {reveal.carta.autor} · {reveal.carta.anio}
              </p>
              <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', maxWidth: 260 }}>
                {reveal.carta.descripcion}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
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
          </div>
        </div>
      )}

      <style>{`
        @keyframes reveal-carta {
          from { transform: scale(0.4) rotateY(90deg); opacity: 0; }
          to   { transform: scale(1) rotateY(0deg);   opacity: 1; }
        }
        @keyframes shimmer-carta {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .carta-personaje:hover { transform: translateY(-3px) scale(1.04); }
      `}</style>
    </div>
  )
}
