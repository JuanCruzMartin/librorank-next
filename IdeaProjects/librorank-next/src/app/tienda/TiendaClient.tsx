'use client'

import { useState } from 'react'
import type { ItemTienda } from '@/lib/tienda'
import type { Carta } from '@/lib/cartas'
import { RAREZAS } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'

interface CartaResultado { carta: Carta; esNueva: boolean }

interface Props {
  items: ItemTienda[]
  puntosIniciales: number
}

type AnimSobre = 'flying-in' | 'arrived' | 'flying-out'

export default function TiendaClient({ items, puntosIniciales }: Props) {
  const [puntos, setPuntos] = useState(puntosIniciales)
  const [comprando, setComprando] = useState(false)
  const [resultado, setResultado] = useState<CartaResultado[] | null>(null)
  const [itemAbierto, setItemAbierto] = useState<ItemTienda | null>(null)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)

  // Modal carta ampliada (igual que en colección)
  const [cartaAmpliada, setCartaAmpliada] = useState<CartaResultado | null>(null)
  const [cartaAmpliadaOrigin, setCartaAmpliadaOrigin] = useState<DOMRect | null>(null)
  const [cartaAnimState, setCartaAnimState] = useState<'flying-in' | 'arrived' | 'flying-out' | null>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false })

  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * 100
    const my = ((e.clientY - rect.top) / rect.height) * 100
    setTilt({ rx: (50 - my) * 0.25, ry: (mx - 50) * 0.25, mx, my, active: true })
  }
  const handleCardLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })

  function abrirCarta(e: React.MouseEvent, r: CartaResultado) {
    const rect = e.currentTarget.getBoundingClientRect()
    setCartaAmpliadaOrigin(rect)
    setCartaAmpliada(r)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })
    setCartaAnimState('flying-in')
  }

  function cerrarCartaAmpliada() {
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })
    setCartaAnimState('flying-out')
  }

  function handleCartaAnimEnd() {
    if (cartaAnimState === 'flying-in') setCartaAnimState('arrived')
    else if (cartaAnimState === 'flying-out') {
      setCartaAmpliada(null)
      setCartaAmpliadaOrigin(null)
      setCartaAnimState(null)
    }
  }

  const DORSO_MAP: Record<string, string> = {
    got: '/dorso-got.png',
    sda: '/dorso-sda.png',
    hp: '/dorso-hp.png',
    principito: '/dorso-principito.png',
  }

  // Para la animación del sobre volando al centro
  const [sobreSeleccionado, setSobreSeleccionado] = useState<ItemTienda | null>(null)
  const [sobreOrigin, setSobreOrigin] = useState<DOMRect | null>(null)
  const [animSobre, setAnimSobre] = useState<AnimSobre | null>(null)

  function clickSobre(e: React.MouseEvent, item: ItemTienda) {
    if (puntos < item.precio) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setSobreOrigin(rect)
    setSobreSeleccionado(item)
    setAnimSobre('flying-in')
    setError(null)
  }

  function cancelarSobre() {
    setAnimSobre('flying-out')
  }

  function handleAnimEnd() {
    if (animSobre === 'flying-in') {
      setAnimSobre('arrived')
    } else if (animSobre === 'flying-out') {
      setSobreSeleccionado(null)
      setSobreOrigin(null)
      setAnimSobre(null)
    }
  }

  async function confirmarCompra() {
    if (!sobreSeleccionado || comprando) return
    setComprando(true)
    setError(null)
    try {
      const res = await fetch('/api/tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: sobreSeleccionado.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al comprar'); setComprando(false); return }
      setPuntos(data.monedasRestantes)
      setItemAbierto(sobreSeleccionado)
      // Primero cerramos el modal del sobre
      setSobreSeleccionado(null)
      setSobreOrigin(null)
      setAnimSobre(null)
      // Luego mostramos las cartas
      setResultado(data.cartas)
      setFlippedCards(new Array(data.cartas.length).fill(false))
    } catch {
      setError('Error de conexión')
    } finally {
      setComprando(false)
    }
  }

  function flipCarta(i: number) {
    setFlippedCards(prev => prev.map((v, idx) => idx === i ? true : v))
  }

  function flipTodas() {
    setFlippedCards(prev => prev.map(() => true))
  }

  function cerrarResultado() {
    setResultado(null)
    setItemAbierto(null)
    setFlippedCards([])
  }

  const rareza = (r: string) => RAREZAS[r as keyof typeof RAREZAS] ?? RAREZAS.comun

  // Calcular posición para la animación
  const sobreVuela = sobreSeleccionado && sobreOrigin && animSobre ? (() => {
    const PREVIEW_W = 260
    const cx = sobreOrigin.left + sobreOrigin.width / 2
    const cy = sobreOrigin.top + sobreOrigin.height / 2
    const dx = cx - window.innerWidth / 2
    const dy = cy - window.innerHeight / 2
    const sc = sobreOrigin.width / PREVIEW_W
    return { dx, dy, sc }
  })() : null

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes sobreEntrada {
          from { opacity: 0; transform: translateY(30px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sobreFlota {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          30%  { transform: translateY(-10px) rotate(1deg); }
          70%  { transform: translateY(4px) rotate(-0.5deg); }
        }
        @keyframes sobreVuelaIn {
          0%   { transform: translate(calc(-50% + var(--sdx)), calc(-50% + var(--sdy))) scale(var(--ssc)); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes sobreVuelaOut {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--sdx)), calc(-50% + var(--sdy))) scale(var(--ssc)); opacity: 0; }
        }
        @keyframes sobreVivoCentro {
          0%, 100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg) scale(1); }
          25%  { transform: translateY(-12px) rotateY(5deg) rotateX(2deg) scale(1.02); }
          75%  { transform: translateY(5px) rotateY(-4deg) rotateX(-1.5deg) scale(0.99); }
        }
        @keyframes sobreGlowCentro {
          0%, 100% { filter: drop-shadow(0 0 18px var(--sobre-glow, rgba(255,255,255,0.4))) drop-shadow(0 16px 40px rgba(0,0,0,0.7)); }
          50%       { filter: drop-shadow(0 0 40px var(--sobre-glow, rgba(255,255,255,0.7))) drop-shadow(0 20px 60px rgba(0,0,0,0.9)); }
        }
        @keyframes cartaEntrada {
          from { opacity: 0; transform: translateY(50px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes brilloNueva {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(255,215,0,0.5); }
          50%       { box-shadow: 0 0 28px 10px rgba(255,215,0,0.9); }
        }
        .card-flip-inner {
          position: relative; width: 100%; height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.4,0,0.2,1);
        }
        .card-flip-inner.flipped { transform: rotateY(180deg); }
        .card-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 10px; overflow: hidden;
        }
        .card-face-back { }
        .card-face-front { transform: rotateY(180deg); }
        @keyframes fadeInConfirm {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes carta-vuela-in {
          0%   { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--sc)) rotateY(0deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotateY(360deg); }
        }
        @keyframes carta-vuela-out {
          0%   { transform: translate(-50%, -50%) scale(1) rotateY(0deg); }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--sc)) rotateY(-360deg); }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="font-title" style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', color: '#fff', margin: 0 }}>
            🏪 Tienda
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Abrí sobres y expandí tu colección
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 20, padding: '0.4rem 1.2rem', marginTop: '0.75rem',
          }}>
            <span>🪙</span>
            <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '1.1rem' }}>
              {puntos.toLocaleString()} puntos
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 10, padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Grid de sobres */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}>
          {items.map((item, i) => {
            const puedeComprar = puntos >= item.precio
            return (
              <div
                key={item.id}
                onClick={(e) => clickSobre(e, item)}
                style={{
                  background: `linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${puedeComprar ? item.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  animation: `sobreEntrada 0.5s ease both`,
                  animationDelay: `${i * 0.07}s`,
                  cursor: puedeComprar ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { if (puedeComprar) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${item.color}30` } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
              >
                <div style={{
                  position: 'relative', aspectRatio: '5/7', overflow: 'hidden',
                  background: `radial-gradient(ellipse at center, ${item.color}18 0%, rgba(0,0,0,0.5) 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={item.imagen} alt={item.nombre}
                    style={{
                      width: '90%', height: '90%', objectFit: 'contain', display: 'block',
                      animation: puedeComprar ? 'sobreFlota 3.8s ease-in-out infinite' : 'none',
                      filter: puedeComprar ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))' : 'grayscale(0.4) brightness(0.6)',
                    }}
                  />
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                    borderRadius: 20, padding: '0.3rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: 5,
                    border: `1px solid ${item.color}50`,
                  }}>
                    <span style={{ fontSize: '0.75rem' }}>🪙</span>
                    <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.82rem' }}>{item.precio.toLocaleString()}</span>
                  </div>
                  {!puedeComprar && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2rem', opacity: 0.7 }}>🔒</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{item.nombre}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '0 0 0.85rem', lineHeight: 1.4 }}>{item.descripcion}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                    {[...Array(5)].map((_, k) => (
                      <div key={k} style={{ width: 28, height: 38, borderRadius: 4, background: item.color + '30', border: `1px solid ${item.color}50`, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎴</div>
                    ))}
                  </div>
                  <div style={{
                    width: '100%', padding: '0.6rem', borderRadius: 10, textAlign: 'center',
                    background: puedeComprar ? `linear-gradient(135deg, ${item.color}, ${item.colorSecundario})` : 'rgba(255,255,255,0.06)',
                    color: puedeComprar ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {puedeComprar ? '✨ Ver sobre' : 'Puntos insuficientes'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sobre volando al centro */}
      {sobreSeleccionado && sobreOrigin && sobreVuela && animSobre && (
        <>
          {/* Backdrop */}
          <div
            onClick={animSobre === 'arrived' ? cancelarSobre : undefined}
            style={{
              position: 'fixed', inset: 0, zIndex: 9997,
              background: 'rgba(5,3,10,0.85)',
              backdropFilter: 'blur(8px)',
              opacity: animSobre === 'arrived' ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Sobre animado */}
          <div
            onAnimationEnd={handleAnimEnd}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              width: 260,
              zIndex: 9998,
              ['--sdx' as string]: `${sobreVuela.dx}px`,
              ['--sdy' as string]: `${sobreVuela.dy}px`,
              ['--ssc' as string]: sobreVuela.sc,
              animation: animSobre === 'flying-in'
                ? 'sobreVuelaIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards'
                : animSobre === 'flying-out'
                ? 'sobreVuelaOut 0.4s ease-in forwards'
                : 'none',
              transform: animSobre === 'arrived' ? 'translate(-50%, -50%)' : undefined,
            } as React.CSSProperties}
          >
            {/* Imagen del sobre — solo la imagen, sin caja */}
            <img
              src={sobreSeleccionado.imagen}
              alt={sobreSeleccionado.nombre}
              style={{
                width: '100%', maxHeight: 340, objectFit: 'contain', display: 'block',
                animation: animSobre === 'arrived'
                  ? 'sobreVivoCentro 4s ease-in-out infinite, sobreGlowCentro 2.5s ease-in-out infinite'
                  : 'none',
                ['--sobre-glow' as string]: `${sobreSeleccionado.color}cc`,
              } as React.CSSProperties}
            />

            {/* Info y botones — solo cuando llegó */}
            {animSobre === 'arrived' && (
              <div style={{ animation: 'fadeInConfirm 0.35s ease', textAlign: 'center', marginTop: '1.25rem' }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>
                  {sobreSeleccionado.nombre}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                  {sobreSeleccionado.descripcion}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '1rem' }}>
                  <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '1.1rem' }}>🪙 {sobreSeleccionado.precio.toLocaleString()}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>puntos</span>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={cancelarSobre}
                    style={{
                      padding: '0.6rem 1.5rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarCompra}
                    disabled={comprando}
                    style={{
                      padding: '0.6rem 1.75rem', borderRadius: 10, border: 'none',
                      background: comprando ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${sobreSeleccionado.color}, ${sobreSeleccionado.colorSecundario})`,
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: comprando ? 'default' : 'pointer',
                      boxShadow: comprando ? 'none' : `0 4px 20px ${sobreSeleccionado.color}60`,
                      transition: 'opacity 0.2s',
                      opacity: comprando ? 0.6 : 1,
                    }}
                  >
                    {comprando ? 'Abriendo...' : '✨ Abrir sobre'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de resultado — flip de cartas */}
      {resultado && itemAbierto && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: 860 }}>
            <h2 className="font-title" style={{ color: '#fff', textAlign: 'center', marginBottom: '0.2rem', fontSize: 'clamp(1.2rem,4vw,1.8rem)' }}>
              ¡{itemAbierto.nombre} abierto!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: '0.78rem', marginBottom: '1.5rem' }}>
              {flippedCards.every(Boolean)
                ? `${resultado.filter(r => r.esNueva).length} cartas nuevas · ${resultado.filter(r => !r.esNueva).length} duplicadas`
                : 'Hacé clic en cada carta para revelarla'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {resultado.map((r, i) => {
                const rar = rareza(r.carta.rareza)
                const isFlipped = flippedCards[i] ?? false
                const dorsoImg = DORSO_MAP[itemAbierto.tipo]

                return (
                  <div
                    key={i}
                    onClick={(e) => {
                      if (!isFlipped) {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        flipCarta(i)
                        setTimeout(() => {
                          setCartaAmpliadaOrigin(rect)
                          setCartaAmpliada(r)
                          setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })
                          setCartaAnimState('flying-in')
                        }, 150)
                      } else {
                        abrirCarta(e, r)
                      }
                    }}
                    style={{
                      width: 'clamp(130px, 15vw, 160px)', flexShrink: 0,
                      aspectRatio: '3/4',
                      perspective: '800px',
                      cursor: isFlipped ? 'default' : 'pointer',
                      animation: `cartaEntrada 0.5s ease both`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    <div className={`card-flip-inner${isFlipped ? ' flipped' : ''}`}>

                      {/* Dorso */}
                      <div className="card-face card-face-back">
                        {dorsoImg ? (
                          <img src={dorsoImg} alt="dorso" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: `linear-gradient(135deg, ${itemAbierto.color}cc, ${itemAbierto.colorSecundario})`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 6,
                          }}>
                            <span style={{ fontSize: '2rem' }}>📚</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>LibroRank</span>
                          </div>
                        )}
                        {/* hint de click */}
                        {!isFlipped && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.55rem', fontWeight: 700 }}>TAP</span>
                          </div>
                        )}
                      </div>

                      {/* Frente */}
                      <div
                        className="card-face card-face-front"
                        style={{
                          border: `2px solid ${rar.color}`,
                          boxShadow: r.esNueva ? `0 0 20px 4px ${rar.color}80, 0 0 0 2px gold` : `0 4px 16px rgba(0,0,0,0.5)`,
                          animation: r.esNueva && isFlipped ? `brilloNueva 1.5s ease infinite` : 'none',
                        }}
                      >
                        <img
                          src={r.carta.imagen} alt={r.carta.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).src = '/img/card-placeholder.png' }}
                        />
                        <div style={{ position: 'absolute', top: 5, left: 5, background: rar.color, borderRadius: 4, padding: '1px 5px', fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
                          {rar.letra}
                        </div>
                        {r.esNueva && (
                          <div style={{ position: 'absolute', top: 5, right: 5, background: 'gold', borderRadius: 4, padding: '1px 5px', fontSize: '0.55rem', fontWeight: 900, color: '#000' }}>
                            NEW
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nombre (solo visible cuando está dada vuelta) */}
                    <p style={{ color: isFlipped ? '#fff' : 'transparent', fontSize: '0.65rem', textAlign: 'center', marginTop: 5, fontWeight: 600, lineHeight: 1.3, transition: 'color 0.3s' }}>
                      {r.carta.nombre}
                    </p>
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', gap: 10, justifyContent: 'center' }}>
              {!flippedCards.every(Boolean) && (
                <button
                  onClick={flipTodas}
                  style={{ padding: '0.55rem 1.5rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Dar vuelta todas
                </button>
              )}
              {flippedCards.every(Boolean) && (
                <button
                  onClick={cerrarResultado}
                  style={{ padding: '0.6rem 2rem', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Carta ampliada — mismo sistema que colección */}
      {cartaAmpliada && cartaAmpliadaOrigin && cartaAnimState && (() => {
        const LG_W = 300
        const cx = cartaAmpliadaOrigin.left + cartaAmpliadaOrigin.width / 2
        const cy = cartaAmpliadaOrigin.top + cartaAmpliadaOrigin.height / 2
        const dx = cx - window.innerWidth / 2
        const dy = cy - window.innerHeight / 2
        const sc = cartaAmpliadaOrigin.width / LG_W
        const arrived = cartaAnimState === 'arrived'
        const arrivedTransform = tilt.active
          ? `perspective(900px) translate(-50%, -50%) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : `translate(-50%, -50%)`

        return (
          <>
            <div
              onClick={cerrarCartaAmpliada}
              style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(10,8,5,0.92)',
                backdropFilter: 'blur(6px)',
                opacity: arrived ? 1 : 0,
                transition: 'opacity 0.35s ease',
                pointerEvents: arrived ? 'auto' : 'none',
              }}
            />

            <div
              onAnimationEnd={handleCartaAnimEnd}
              onMouseMove={arrived ? handleCardMove : undefined}
              onMouseLeave={arrived ? handleCardLeave : undefined}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                zIndex: 10001,
                transformStyle: 'preserve-3d',
                ['--dx' as string]: `${dx}px`,
                ['--dy' as string]: `${dy}px`,
                ['--sc' as string]: sc,
                animation: cartaAnimState === 'flying-in'
                  ? 'carta-vuela-in 1.3s cubic-bezier(0.22,1,0.36,1) forwards'
                  : cartaAnimState === 'flying-out'
                  ? 'carta-vuela-out 1.0s ease-in forwards'
                  : 'none',
                transform: arrived ? arrivedTransform : undefined,
                transition: arrived
                  ? (tilt.active ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out')
                  : 'none',
              } as React.CSSProperties}
            >
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'relative' }}>
                <CartaPersonaje carta={cartaAmpliada.carta} obtenida size="lg" />

                {/* Holo foil — comun/raro */}
                {arrived && (cartaAmpliada.carta.rareza === 'comun' || cartaAmpliada.carta.rareza === 'raro') && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10, pointerEvents: 'none', zIndex: 9,
                    background: `linear-gradient(${tilt.mx * 1.8}deg,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8},100%,65%,0.45) 0%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 60},100%,65%,0.45) 16%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 120},100%,65%,0.45) 33%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 180},100%,65%,0.45) 50%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 240},100%,65%,0.45) 66%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 300},100%,65%,0.45) 83%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 360},100%,65%,0.45) 100%)`,
                    mixBlendMode: 'color-dodge',
                    opacity: tilt.active ? 0.55 : 0,
                    transition: 'opacity 0.4s',
                  }} />
                )}

                {/* Glare */}
                {arrived && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10, pointerEvents: 'none', zIndex: 10,
                    background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 40%, transparent 65%)`,
                    opacity: tilt.active ? 1 : 0,
                    transition: 'opacity 0.3s',
                    mixBlendMode: 'overlay',
                  }} />
                )}

                {cartaAmpliada.esNueva && arrived && (
                  <div style={{ position: 'absolute', top: -10, right: -10, background: 'gold', color: '#000', fontWeight: 900, fontSize: '0.65rem', borderRadius: 6, padding: '3px 8px', zIndex: 11 }}>
                    ✨ NUEVA
                  </div>
                )}

                <button
                  onClick={cerrarCartaAmpliada}
                  style={{
                    position: 'absolute', top: -14, right: -14,
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: arrived ? 1 : 0, transition: 'opacity 0.3s', zIndex: 11,
                  }}
                >×</button>
              </div>
            </div>
          </>
        )
      })()}
    </>
  )
}
