'use client'

import { useEffect, useState } from 'react'
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
  const [fase, setFase] = useState<'fondo' | 'cuenta' | 'carta'>('carta')
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [bannerDiario, setBannerDiario] = useState(false)
  const [proximaDiaria, setProximaDiaria] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState('')

  const totalObtenidas = new Set(coleccion).size

  // Tirada diaria: verificar al montar
  useEffect(() => {
    fetch('/api/cartas/tirada-diaria', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.otorgada) {
          setTiradas(t => t + 1)
          setBannerDiario(true)
          setTimeout(() => setBannerDiario(false), 4000)
        }
        setProximaDiaria(new Date(data.proxima))
      })
      .catch(() => {})
  }, [])

  // Countdown hasta la próxima tirada diaria
  useEffect(() => {
    if (!proximaDiaria) return
    function actualizar() {
      const diff = proximaDiaria!.getTime() - Date.now()
      if (diff <= 0) { setCountdown(''); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
    }
    actualizar()
    const id = setInterval(actualizar, 1000)
    return () => clearInterval(id)
  }, [proximaDiaria])

  // Si la carta tiene fondo temático (Épico+), mostramos el fondo a pantalla completa
  // y una cuenta regresiva antes de que aparezca la carta
  useEffect(() => {
    if (!reveal) return
    const esAlta = reveal.carta.rareza === 'epico' || reveal.carta.rareza === 'legendario' || reveal.carta.rareza === 'mitico'
    if (esAlta && reveal.carta.fondo) {
      setFase('fondo')
      const t = setTimeout(() => { setFase('cuenta'); setCuenta(3) }, 900)
      return () => clearTimeout(t)
    }
    setFase('carta')
  }, [reveal?.carta.id])

  useEffect(() => {
    if (fase !== 'cuenta' || cuenta === null) return
    if (cuenta <= 0) { setFase('carta'); return }
    const t = setTimeout(() => setCuenta(c => (c !== null ? c - 1 : null)), 800)
    return () => clearTimeout(t)
  }, [fase, cuenta])

  // Comunes y raras se revelan solas — no hace falta tocarlas
  useEffect(() => {
    if (fase === 'carta' && reveal && !reveal.revelada && (reveal.carta.rareza === 'comun' || reveal.carta.rareza === 'raro')) {
      const t = setTimeout(() => setReveal(r => (r ? { ...r, revelada: true } : r)), 550)
      return () => clearTimeout(t)
    }
  }, [reveal, fase])

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

      {/* Banner tirada diaria */}
      {bannerDiario && (
        <div style={{
          background: 'linear-gradient(90deg, #a8821f22, #d4af3744, #a8821f22)',
          border: '1px solid rgba(212,175,55,0.5)',
          borderRadius: 12,
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'banner-diario 4s ease forwards',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🎴</span>
          <div>
            <p style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.9rem', marginBottom: 2 }}>
              ¡Tirada diaria desbloqueada!
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
              Volvé mañana para conseguir otra gratis
            </p>
          </div>
        </div>
      )}

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
          {tiradas <= 0 && countdown && (
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right', maxWidth: 180 }}>
              🕐 Gratis en {countdown}
            </p>
          )}
          {tiradas <= 0 && !countdown && (
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
            position: 'fixed', inset: 0,
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
          onClick={() => reveal.revelada && setReveal(null)}
        >
          {(() => {
            const esEspecial = reveal.carta.rareza === 'legendario' || reveal.carta.rareza === 'mitico'
            const esAlta = esEspecial || reveal.carta.rareza === 'epico'
            const fanfarria = reveal.revelada && esEspecial
            const colorAmbiente = reveal.revelada ? reveal.carta.color : '#d4af37'
            return (
          <>
            {/* Imagen de fondo temática a pantalla completa — solo Épico+ */}
            {esAlta && reveal.carta.fondo && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `url(${reveal.carta.fondo})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: fase === 'carta' ? 'blur(2px) brightness(0.4) saturate(1.2)' : 'brightness(0.75) saturate(1.15)',
                transform: fase === 'carta' ? 'scale(1.08)' : 'scale(1)',
                opacity: fase === 'fondo' ? 0 : 1,
                animation: fase === 'fondo' ? 'fondo-aparecer 0.9s ease forwards' : undefined,
                transition: 'filter 0.8s ease, transform 0.8s ease',
              }} />
            )}

            {/* Cuenta regresiva 3-2-1 */}
            {fase === 'cuenta' && cuenta !== null && cuenta > 0 && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span
                  key={cuenta}
                  style={{
                    fontFamily: 'Georgia, serif', fontWeight: 900,
                    fontSize: '7rem', color: colorAmbiente,
                    textShadow: `0 0 30px ${colorAmbiente}, 0 0 60px ${colorAmbiente}aa`,
                    animation: 'cuenta-pop 0.8s cubic-bezier(0.2,0.8,0.3,1)',
                  }}
                >
                  {cuenta}
                </span>
              </div>
            )}
            {/* Fondo atmosférico: vignette + polvo + rayos de luz */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: `radial-gradient(circle at 50% 45%, ${colorAmbiente}22 0%, ${esAlta && reveal.carta.fondo ? `${colorAmbiente}05` : '#0a0806'} 55%, #050403 100%)`,
              transition: 'background 0.6s ease',
            }} />
            <div
              className="rayos-luz"
              style={{
                position: 'absolute', inset: '-25%', zIndex: 1,
                background: `conic-gradient(from 0deg, transparent 0deg, ${colorAmbiente}1a 8deg, transparent 16deg, transparent 40deg, ${colorAmbiente}1a 48deg, transparent 56deg, transparent 90deg, ${colorAmbiente}1a 98deg, transparent 106deg, transparent 140deg, ${colorAmbiente}1a 148deg, transparent 156deg, transparent 190deg, ${colorAmbiente}1a 198deg, transparent 206deg, transparent 230deg, ${colorAmbiente}1a 238deg, transparent 246deg, transparent 280deg, ${colorAmbiente}1a 288deg, transparent 296deg, transparent 320deg, ${colorAmbiente}1a 328deg, transparent 336deg)`,
                opacity: reveal.revelada ? 0.9 : 0.5,
                transition: 'opacity 0.5s ease',
              }}
            />
            <div className="polvo-flotante" style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.5 }} />
          {fase === 'carta' && (
          <div
            onClick={e => e.stopPropagation()}
            className={fanfarria ? 'modal-shake' : undefined}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', position: 'relative',
              zIndex: 2, animation: 'fade-in-bg 0.4s ease',
            }}
          >
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase',
              color: !reveal.revelada ? 'rgba(255,255,255,0.4)' : reveal.esNueva ? '#4cd137' : 'rgba(255,255,255,0.3)',
              minHeight: '1em',
            }}>
              {!reveal.revelada
                ? esAlta ? '✨ Algo especial está brillando...' : ''
                : reveal.esNueva ? '✨ ¡Carta nueva!' : '🔁 Duplicada'}
            </p>

            {/* Texto fanfarria para Legendario/Mítico */}
            {fanfarria && (
              <div style={{
                position: 'absolute', top: '38%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20, pointerEvents: 'none',
                fontFamily: 'Georgia, serif', fontWeight: 900,
                fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: 2,
                color: reveal.carta.color,
                textShadow: `0 0 20px ${reveal.carta.color}, 0 0 40px ${reveal.carta.color}aa`,
                animation: 'fanfarria-text 1.6s ease-out forwards',
                whiteSpace: 'nowrap',
              }}>
                {reveal.carta.rareza === 'mitico' ? '¡MÍTICO!' : '¡LEGENDARIO!'}
              </div>
            )}

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
                  <CartaDorso size="lg" glowColor={esAlta ? reveal.carta.color : undefined} pulsar={esAlta} />
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
          )}
          </>
            )
          })()}
        </div>
      )}

      {/* Modal ampliar carta */}
      {ampliada && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: ampliada.fondo ? undefined : 'rgba(10,8,5,0.82)',
            backdropFilter: ampliada.fondo ? undefined : 'blur(3px)',
            zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fade-in-bg 0.2s ease',
            overflow: 'hidden',
          }}
          onClick={() => setAmpliada(null)}
        >
          {ampliada.fondo && (
            <>
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `url(${ampliada.fondo})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(2px) brightness(0.4) saturate(1.2)',
                transform: 'scale(1.08)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: `radial-gradient(circle at 50% 45%, ${ampliada.color}15 0%, transparent 55%, rgba(0,0,0,0.55) 100%)`,
              }} />
            </>
          )}
          <div
            onClick={e => e.stopPropagation()}
            style={{ animation: 'zoom-in-carta 0.3s cubic-bezier(0.22,1,0.36,1)', position: 'relative', zIndex: 1 }}
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
        @keyframes fanfarria-text {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          25%  { transform: translate(-50%, -50%) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes modal-shake {
          0%, 100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(7px); }
          45%      { transform: translateX(-5px); }
          60%      { transform: translateX(4px); }
          75%      { transform: translateX(-2px); }
        }
        @keyframes fondo-aparecer {
          from { opacity: 0; transform: scale(1.15); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cuenta-pop {
          0%   { opacity: 0; transform: scale(0.3); }
          30%  { opacity: 1; transform: scale(1.25); }
          50%  { transform: scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: scale(0.85); }
        }
        .modal-shake { animation: modal-shake 0.5s ease-out; }
        .rayos-luz {
          animation: girar-rayos 22s linear infinite;
        }
        @keyframes girar-rayos {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .polvo-flotante {
          background-image:
            radial-gradient(1.5px 1.5px at 10% 20%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 25% 65%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1.5px 1.5px at 40% 35%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 55% 80%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1.5px 1.5px at 70% 15%, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1.5px 1.5px at 95% 75%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 15% 90%, rgba(255,255,255,0.3), transparent);
          background-repeat: no-repeat;
          animation: flotar-polvo 9s ease-in-out infinite;
        }
        @keyframes flotar-polvo {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(-14px); opacity: 0.7; }
        }
        @keyframes banner-diario {
          0%   { opacity: 0; transform: translateY(-8px); }
          10%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
