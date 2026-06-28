'use client'

import { useState } from 'react'
import { CARTAS, RAREZAS, getProbabilidadCarta, type Carta } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'

interface Props {
  coleccion: string[]
  tiradas: number
}

export default function CartasClient({ coleccion: coleccionInicial, tiradas: tiradasIniciales }: Props) {
  const [coleccion, setColeccion] = useState<string[]>(coleccionInicial)
  const [tiradas, setTiradas] = useState(tiradasIniciales)
  const [tirando, setTirando] = useState(false)
  const [cartaRevealada, setCartaRevealada] = useState<{ carta: Carta; esNueva: boolean } | null>(null)
  const [filtroRareza, setFiltroRareza] = useState<string>('todas')

  const totalCartas = CARTAS.length
  const cartasObtenidas = coleccion.length

  async function tirar() {
    if (tiradas <= 0 || tirando) return
    setTirando(true)
    try {
      const res = await fetch('/api/cartas/tirar', { method: 'POST' })
      if (!res.ok) { setTirando(false); return }
      const data = await res.json()
      setTiradas(t => t - 1)
      if (data.esNueva) setColeccion(c => [...c, data.carta.id])
      setCartaRevealada({ carta: data.carta, esNueva: data.esNueva })
    } finally {
      setTirando(false)
    }
  }

  const cartasFiltradas = filtroRareza === 'todas'
    ? CARTAS
    : CARTAS.filter(c => c.rareza === filtroRareza)

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="font-title" style={{ color: 'var(--accent-gold)', marginBottom: 4, fontSize: '1.5rem' }}>
            🃏 Colección de Cartas
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            {cartasObtenidas} / {totalCartas} cartas obtenidas
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 12,
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            color: 'var(--accent-gold)',
            fontWeight: 700,
          }}>
            🎴 {tiradas} tirada{tiradas !== 1 ? 's' : ''} disponible{tiradas !== 1 ? 's' : ''}
          </div>
          <button
            onClick={tirar}
            disabled={tiradas <= 0 || tirando}
            className="btn--brand"
            style={{ opacity: tiradas <= 0 ? 0.4 : 1 }}
          >
            {tirando ? 'Revelando...' : tiradas > 0 ? '✨ Tirar carta' : 'Sin tiradas'}
          </button>
          {tiradas <= 0 && (
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right', maxWidth: 200 }}>
              Ganás 3 tiradas cada 500 puntos acumulados
            </p>
          )}
        </div>
      </div>

      {/* Barra de progreso colección */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 6, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{
          width: `${(cartasObtenidas / totalCartas) * 100}%`,
          height: '100%',
          background: 'var(--accent-gold)',
          borderRadius: 99,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Filtros por rareza */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['todas', ...Object.keys(RAREZAS)].map(r => (
          <button
            key={r}
            onClick={() => setFiltroRareza(r)}
            style={{
              padding: '4px 14px',
              borderRadius: 20,
              border: `1px solid ${r === 'todas' ? 'rgba(255,255,255,0.2)' : RAREZAS[r as keyof typeof RAREZAS]?.color ?? 'transparent'}`,
              background: filtroRareza === r
                ? r === 'todas' ? 'rgba(255,255,255,0.1)' : `${RAREZAS[r as keyof typeof RAREZAS]?.color}22`
                : 'transparent',
              color: r === 'todas' ? 'rgba(255,255,255,0.7)' : RAREZAS[r as keyof typeof RAREZAS]?.color,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {r === 'todas' ? 'Todas' : RAREZAS[r as keyof typeof RAREZAS]?.label}
          </button>
        ))}
      </div>

      {/* Grid de cartas */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.85rem',
        justifyContent: 'flex-start',
      }}>
        {cartasFiltradas.map(carta => (
          <div key={carta.id} style={{ position: 'relative' }}>
            <CartaPersonaje
              carta={carta}
              obtenida={coleccion.includes(carta.id)}
              size="md"
            />
            {!coleccion.includes(carta.id) && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                🔒
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda de rareza */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
      }}>
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Probabilidad por carta
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.entries(RAREZAS) as [string, typeof RAREZAS[keyof typeof RAREZAS]][]).map(([key, r]) => {
            const cartasDeRareza = CARTAS.filter(c => c.rareza === key)
            const prob = getProbabilidadCarta(cartasDeRareza[0])
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color: r.color, fontWeight: 600, width: 72 }}>{r.label}</span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>
                  {prob.toFixed(2)}% por carta · {cartasDeRareza.length} carta{cartasDeRareza.length > 1 ? 's' : ''}
                </span>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.75rem' }}>
          Ganás 1 tirada por cada 500 puntos acumulados. Los duplicados cuentan.
        </p>
      </div>

      {/* Modal reveal */}
      {cartaRevealada && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1.5rem',
          }}
          onClick={() => setCartaRevealada(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: cartaRevealada.esNueva ? '#4cd137' : 'rgba(255,255,255,0.35)',
            }}>
              {cartaRevealada.esNueva ? '✨ ¡Carta nueva!' : '🔁 Duplicada'}
            </p>

            <div style={{ animation: 'reveal-carta 0.4s ease' }}>
              <CartaPersonaje carta={cartaRevealada.carta} obtenida size="lg" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                {cartaRevealada.carta.autor} · {cartaRevealada.carta.anio}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', maxWidth: 260 }}>
                {cartaRevealada.carta.descripcion}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {tiradas > 0 && (
                <button
                  className="btn--brand"
                  onClick={() => { setCartaRevealada(null); setTimeout(tirar, 100) }}
                >
                  🎴 Tirar otra ({tiradas})
                </button>
              )}
              <button
                onClick={() => setCartaRevealada(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes reveal-carta {
          from { transform: scale(0.5) rotateY(90deg); opacity: 0; }
          to   { transform: scale(1) rotateY(0deg);   opacity: 1; }
        }
        @keyframes shimmer-carta {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .carta-personaje:hover {
          transform: translateY(-4px) scale(1.03);
        }
      `}</style>
    </div>
  )
}
