'use client'

import { useEffect, useState } from 'react'
import { CARTAS, RAREZAS, rarezaVisual, getProbabilidadCarta, type Carta, type Rareza } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'
import CartaDorso from '@/components/CartaDorso'
import type { TipoCofre, Cofre } from '@/lib/dao/cofreDAO'

interface Props {
  coleccion: string[]
  cantidades: Record<string, number>
  tiradas: number
}

const ORDEN_RAREZA = ['comun', 'epico', 'legendario'] as const

const EMOJI_RAREZA: Record<string, string> = {
  comun: '🥉', epico: '💜', legendario: '⭐',
}

type Vista = 'rareza' | 'coleccion'

const COLECCIONES_DEF = [
  { id: 'hp',         nombre: 'Harry Potter',            dorso: '/dorso-hp.png',         emoji: '⚡', color: '#c8102e' },
  { id: 'sda',        nombre: 'El Señor de los Anillos', dorso: '/dorso-sda.png',        emoji: '💍', color: '#a8821f' },
  { id: 'got',        nombre: 'Game of Thrones',         dorso: '/dorso-got.png',        emoji: '🐉', color: '#8b0000' },
  { id: 'principito', nombre: 'El Principito',           dorso: '/dorso-principito.png', emoji: '⭐', color: '#f4d03f' },
  { id: 'clasica',    nombre: 'Literatura Clásica',      dorso: '',                      emoji: '📖', color: '#d4af37' },
]

function getColeccionId(carta: Carta): string {
  if (!carta.dorso) return 'clasica'
  if (carta.dorso === '/dorso-hp.png') return 'hp'
  if (carta.dorso === '/dorso-sda.png') return 'sda'
  if (carta.dorso === '/dorso-got.png') return 'got'
  if (carta.dorso === '/dorso-principito.png') return 'principito'
  return 'clasica'
}

const COFRE_CONFIG: Record<TipoCofre, { emoji: string; label: string; desc: string; color: string; glow: string }> = {
  comun: { emoji: '📦', label: 'Cofre Común',  desc: 'Cualquier rareza',          color: '#7d8a6e', glow: 'rgba(125,138,110,0.4)' },
  raro:  { emoji: '💎', label: 'Cofre Raro',   desc: 'Raro o superior garantizado', color: '#3d6b94', glow: 'rgba(61,107,148,0.5)' },
  epico: { emoji: '✨', label: 'Cofre Épico',  desc: 'Épico o superior garantizado', color: '#6b3d8e', glow: 'rgba(107,61,142,0.6)' },
}

function ComoConseguirSobres() {
  const [abierto, setAbierto] = useState(false)

  const formas = [
    { emoji: '🎁', titulo: 'Sobre diario gratis', desc: '1 sobre gratis cada 24 horas. ¡Entrá todos los días!' },
    { emoji: '⭐', titulo: 'Puntos de lectura', desc: 'Cada 500 puntos acumulados (libros, páginas, reseñas) te dan +1 sobre.' },
    { emoji: '🧠', titulo: 'Pregunta del día', desc: 'Respondé bien la pregunta literaria diaria y ganás +1 sobre.' },
    { emoji: '🛒', titulo: 'Tienda', desc: 'Canjeá tus puntos por sobres o cofrtes especiales en la Tienda.' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAbierto(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px 3px 8px',
          borderRadius: 20,
          background: abierto ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${abierto ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.12)'}`,
          color: abierto ? '#d4af37' : 'rgba(255,255,255,0.5)',
          fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
        }}
      >
        <span style={{
          width: 16, height: 16, borderRadius: '50%',
          background: abierto ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 900, flexShrink: 0,
        }}>?</span>
        ¿Cómo ganar sobres?
      </button>

      {abierto && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setAbierto(false)}
          />
          <div style={{
            position: 'absolute', top: 30, right: 0, zIndex: 999,
            width: 280,
            background: 'linear-gradient(160deg, rgba(20,15,40,0.98), rgba(10,8,25,0.98))',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '0.75rem 1rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.8rem', color: '#d4af37' }}>
                🎴 ¿Cómo conseguir sobres?
              </p>
            </div>
            <div style={{ padding: '0.5rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {formas.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '0.55rem 0.65rem',
                }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{f.emoji}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem', color: '#fff' }}>{f.titulo}</p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ColeccionClient({ coleccion: coleccionInicial, cantidades: cantidadesIniciales, tiradas: tiradasIniciales }: Props) {
  const [coleccion, setColeccion] = useState<string[]>(coleccionInicial)
  const [cantidades, setCantidades] = useState<Record<string, number>>(cantidadesIniciales)
  const [tiradas, setTiradas] = useState(tiradasIniciales)
  const [tirando, setTirando] = useState(false)
  const [reveal, setReveal] = useState<{ carta: Carta; esNueva: boolean; revelada: boolean } | null>(null)
  const [ampliada, setAmpliada] = useState<Carta | null>(null)
  const [cardOrigin, setCardOrigin] = useState<DOMRect | null>(null)
  const [animState, setAnimState] = useState<'flying-in' | 'arrived' | 'flying-out' | null>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false })

  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const mx = (x / rect.width) * 100
    const my = (y / rect.height) * 100
    setTilt({ rx: (50 - my) * 0.25, ry: (mx - 50) * 0.25, mx, my, active: true })
  }
  const handleCardLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })

  const openCarta = (e: React.MouseEvent, carta: Carta) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCardOrigin(rect)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })
    setAmpliada(carta)
    setAnimState('flying-in')
  }

  const closeCarta = () => {
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, active: false })
    setAnimState('flying-out')
  }

  const handleAnimEnd = () => {
    if (animState === 'flying-in') {
      setAnimState('arrived')
    } else if (animState === 'flying-out') {
      setAmpliada(null)
      setCardOrigin(null)
      setAnimState(null)
    }
  }
  const [fase, setFase] = useState<'fondo' | 'cuenta' | 'carta'>('carta')
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [vista, setVista] = useState<Vista>('rareza')
  const [bannerDiario, setBannerDiario] = useState(false)
  const [proximaDiaria, setProximaDiaria] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState('')
  const [cofres, setCofres] = useState<Cofre[]>([])
  const [abriendoCofre, setAbriendoCofre] = useState<number | null>(null)
  const [cofreAbierto, setCofreAbierto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({})

  const CARDS_PER_PAGE = 2

  function prevPage(key: string) {
    setCarouselIdx(p => ({ ...p, [key]: Math.max(0, (p[key] ?? 0) - CARDS_PER_PAGE) }))
  }
  function nextPage(key: string, total: number) {
    setCarouselIdx(p => ({ ...p, [key]: Math.min(total - CARDS_PER_PAGE, (p[key] ?? 0) + CARDS_PER_PAGE) }))
  }

  const totalObtenidas = new Set(coleccion).size

  useEffect(() => {
    fetch('/api/cofres')
      .then(r => r.json())
      .then(d => { if (d.cofres) setCofres(d.cofres) })
      .catch(() => {})
  }, [])

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  useEffect(() => {
    if (!reveal) return
    const esAlta = rarezaVisual(reveal.carta.rareza) === 'epico' || rarezaVisual(reveal.carta.rareza) === 'legendario'
    if (reveal.carta.fondo) {
      setFase('fondo')
      const t = setTimeout(() => {
        if (esAlta) { setFase('cuenta'); setCuenta(3) }
        else { setFase('carta') }
      }, 900)
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

  useEffect(() => {
    if (fase === 'carta' && reveal && !reveal.revelada && rarezaVisual(reveal.carta.rareza) === 'comun') {
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
      if (data.esNueva) {
        setColeccion(c => c.includes(data.carta.id) ? c : [...c, data.carta.id])
        setCantidades(prev => ({ ...prev, [data.carta.id]: Math.min((prev[data.carta.id] ?? 0) + 1, 2) }))
      }
      setReveal({ carta: data.carta, esNueva: data.esNueva, revelada: false })
    } finally {
      setTirando(false)
    }
  }

  async function abrirCofre(cofre: Cofre) {
    if (abriendoCofre) return
    setAbriendoCofre(cofre.id)
    setCofreAbierto(false)
    // Pequeño delay para animar antes de abrir
    await new Promise(r => setTimeout(r, 600))
    try {
      const res = await fetch('/api/cofres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cofreId: cofre.id }),
      })
      if (!res.ok) return
      const data = await res.json()
      setCofreAbierto(true)
      await new Promise(r => setTimeout(r, 400))
      setCofres(cs => cs.filter(c => c.id !== cofre.id))
      if (data.esNueva) {
        setColeccion(c => c.includes(data.carta.id) ? c : [...c, data.carta.id])
        setCantidades(prev => ({ ...prev, [data.carta.id]: Math.min((prev[data.carta.id] ?? 0) + 1, 2) }))
      }
      setReveal({ carta: data.carta, esNueva: data.esNueva, revelada: false })
    } finally {
      setAbriendoCofre(null)
      setCofreAbierto(false)
    }
  }

  function scrollToColeccion(id: string) {
    document.getElementById(`col-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="container py-4" style={{ maxWidth: 1060 }}>

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

      {/* Sección cofres */}
      {cofres.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🎁 Mis Cofres
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
            Hacé clic en un cofre para abrirlo y descubrir tu carta
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {cofres.map(cofre => {
              const cfg = COFRE_CONFIG[cofre.tipo]
              const esteAbriendo = abriendoCofre === cofre.id
              return (
                <button
                  key={cofre.id}
                  onClick={() => abrirCofre(cofre)}
                  disabled={!!abriendoCofre}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '1rem 1.25rem',
                    borderRadius: 14,
                    border: `1.5px solid ${cfg.color}55`,
                    background: esteAbriendo && cofreAbierto
                      ? `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`
                      : `${cfg.color}15`,
                    cursor: abriendoCofre ? 'default' : 'pointer',
                    minWidth: 100,
                    transition: 'all 0.3s ease',
                    transform: esteAbriendo ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: esteAbriendo ? `0 0 24px ${cfg.glow}` : 'none',
                    animation: esteAbriendo && !cofreAbierto ? 'cofre-shake 0.5s ease' : 'none',
                  }}
                >
                  <div style={{
                    width: 76, height: 76,
                    borderRadius: 14,
                    background: `radial-gradient(circle at 40% 35%, ${cfg.color}22, #0d0d1a)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 18px ${cfg.glow}, 0 0 40px ${cfg.glow}`,
                    animation: !esteAbriendo ? `cofre-glow-${cofre.tipo} 2s ease-in-out infinite` : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {esteAbriendo && cofreAbierto ? (
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="4" y="26" width="40" height="18" rx="3" fill={cfg.color} opacity="0.9"/>
                        <rect x="4" y="16" width="40" height="12" rx="3" fill={cfg.color}/>
                        <rect x="18" y="22" width="12" height="8" rx="2" fill="#0d0d1a" opacity="0.6"/>
                        <path d="M24 4 L28 14 L38 14 L30 20 L33 30 L24 24 L15 30 L18 20 L10 14 L20 14 Z" fill="#FFD700" opacity="0.95"/>
                      </svg>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="4" y="26" width="40" height="18" rx="3" fill={cfg.color} opacity="0.85"/>
                        <rect x="4" y="16" width="40" height="12" rx="3" fill={cfg.color}/>
                        <rect x="6" y="18" width="36" height="8" rx="2" fill="#0d0d1a" opacity="0.25"/>
                        <rect x="18" y="22" width="12" height="8" rx="2" fill="#0d0d1a" opacity="0.5"/>
                        <circle cx="24" cy="26" r="3" fill="#FFD700" opacity="0.9"/>
                        <line x1="4" y1="26" x2="44" y2="26" stroke="#0d0d1a" strokeWidth="1.5" opacity="0.4"/>
                        <rect x="8" y="30" width="6" height="10" rx="1" fill="#0d0d1a" opacity="0.15"/>
                        <rect x="34" y="30" width="6" height="10" rx="1" fill="#0d0d1a" opacity="0.15"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    {esteAbriendo ? (cofreAbierto ? '¡Abierto!' : 'Abriendo...') : cfg.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <style suppressHydrationWarning>{`
        @keyframes cofre-shake {
          0%,100% { transform: scale(1.1) rotate(0deg); }
          20%      { transform: scale(1.1) rotate(-6deg); }
          40%      { transform: scale(1.1) rotate(6deg); }
          60%      { transform: scale(1.1) rotate(-4deg); }
          80%      { transform: scale(1.1) rotate(4deg); }
        }
        @keyframes cofre-glow-comun {
          0%,100% { box-shadow: 0 0 12px rgba(125,138,110,0.4), 0 0 28px rgba(125,138,110,0.2); }
          50%     { box-shadow: 0 0 22px rgba(125,138,110,0.7), 0 0 50px rgba(125,138,110,0.35); }
        }
        @keyframes cofre-glow-raro {
          0%,100% { box-shadow: 0 0 14px rgba(61,107,148,0.5), 0 0 32px rgba(61,107,148,0.25); }
          50%     { box-shadow: 0 0 26px rgba(61,107,148,0.85), 0 0 60px rgba(61,107,148,0.45); }
        }
        @keyframes cofre-glow-epico {
          0%,100% { box-shadow: 0 0 16px rgba(107,61,142,0.6), 0 0 40px rgba(107,61,142,0.3); }
          50%     { box-shadow: 0 0 30px rgba(107,61,142,1),   0 0 70px rgba(107,61,142,0.55); }
        }
      `}</style>

      {/* Header álbum */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <div style={{
              fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700,
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 10, padding: '4px 12px',
            }}>
              🎴 {tiradas} sobre{tiradas !== 1 ? 's' : ''}
            </div>
            <ComoConseguirSobres />
          </div>
          <button
            onClick={tirar}
            disabled={tiradas <= 0 || tirando}
            className="btn--brand"
            style={{ opacity: tiradas <= 0 ? 0.4 : 1, fontSize: '0.85rem' }}
          >
            {tirando ? 'Revelando...' : tiradas > 0 ? '✨ Abrir sobre' : 'Sin sobres'}
          </button>
          {tiradas <= 0 && countdown && (
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right', maxWidth: 180 }}>
              🕐 Sobre gratis en {countdown}
            </p>
          )}
          {tiradas <= 0 && !countdown && (
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right', maxWidth: 180 }}>
              1 sobre cada 500 puntos acumulados
            </p>
          )}
        </div>
      </div>

      {/* Toggle vista */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        {(['rareza', 'coleccion'] as Vista[]).map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 20,
              border: `1px solid ${vista === v ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)'}`,
              background: vista === v ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: vista === v ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {v === 'rareza' ? '✨ Por rareza' : '📚 Por colección'}
          </button>
        ))}
      </div>

      {/* Layout flex: sidebar + contenido */}
      <div className="coleccion-layout" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* Sidebar sticky álbumes — siempre visible */}
        <div className="coleccion-sidebar" style={{
          width: 165, flexShrink: 0,
          position: 'sticky', top: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
          padding: '0.75rem 0.5rem',
        }}>
          <p style={{
            fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
            marginBottom: '0.5rem', paddingLeft: '0.4rem',
          }}>
            Álbumes
          </p>
          {COLECCIONES_DEF.map(col => {
            const cartasCol = CARTAS.filter(c => getColeccionId(c) === col.id)
            const obtenidas = cartasCol.filter(c => coleccion.includes(c.id)).length
            const completa = obtenidas === cartasCol.length
            return (
              <button
                key={col.id}
                onClick={() => {
                  if (vista !== 'coleccion') setVista('coleccion')
                  setTimeout(() => scrollToColeccion(col.id), vista !== 'coleccion' ? 50 : 0)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  width: '100%', textAlign: 'left',
                  padding: '0.45rem 0.4rem',
                  borderRadius: 8, border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${col.color}20`; (e.currentTarget as HTMLButtonElement).style.color = col.color }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.72)' }}
              >
                <span style={{ fontSize: '1rem' }}>{col.emoji}</span>
                <span style={{ flex: 1, lineHeight: 1.25 }}>{col.nombre}</span>
                {completa
                  ? <span style={{ fontSize: '0.6rem', color: col.color }}>✓</span>
                  : <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>{obtenidas}/{cartasCol.length}</span>
                }
              </button>
            )
          })}
        </div>

        {/* Contenido principal */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Vista: Por colección */}
          {vista === 'coleccion' && COLECCIONES_DEF.map(col => {
            const cartasCol = CARTAS.filter(c => getColeccionId(c) === col.id)
            const obtenidas = cartasCol.filter(c => coleccion.includes(c.id))
            const faltantes = cartasCol.filter(c => !coleccion.includes(c.id))
            const pct = cartasCol.length > 0 ? (obtenidas.length / cartasCol.length) * 100 : 0
            const completa = faltantes.length === 0

            return (
              <div key={col.id} id={`col-${col.id}`} className="coleccion-seccion" style={{
                marginBottom: '2rem',
                background: 'var(--bg-card)',
                border: `1px solid ${col.color}30`,
                borderRadius: 16,
                scrollMarginTop: '1rem',
              }}>
                <div style={{
                  padding: '1rem 1.25rem',
                  background: `linear-gradient(90deg, ${col.color}18, transparent)`,
                  borderBottom: `1px solid ${col.color}20`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{col.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, color: col.color, fontSize: '0.95rem', marginBottom: 4 }}>
                      {col.nombre}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 140, background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: col.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                        {obtenidas.length}/{cartasCol.length}
                      </span>
                      {completa && (
                        <span style={{ fontSize: '0.65rem', color: col.color, fontWeight: 700, background: `${col.color}20`, padding: '2px 8px', borderRadius: 20 }}>
                          ✓ Completa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="coleccion-seccion-inner" style={{ padding: '0.75rem 0' }}>
                  {isMobile ? (() => {
                    const idx = carouselIdx[col.id] ?? 0
                    const pagina = cartasCol.slice(idx, idx + CARDS_PER_PAGE)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem' }}>
                          <button onClick={() => prevPage(col.id)} disabled={idx === 0} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '1.4rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                            {pagina.map(carta => {
                              const tengo = coleccion.includes(carta.id)
                              const indiceGlobal = CARTAS.findIndex(c => c.id === carta.id) + 1
                              const copias = cantidades[carta.id] ?? 0
                              return (
                                <div key={carta.id} className={`cg-item${tengo ? ' obtenida' : ''}`} onClick={(e) => tengo && openCarta(e, carta)} style={{ cursor: tengo ? 'pointer' : 'default', zoom: 0.82, position: 'relative' }}>
                                  <div className="cg-inner"><CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={indiceGlobal} total={CARTAS.length} /></div>
                                  {copias >= 2 && <span style={{ position: 'absolute', top: 4, right: 4, background: '#7c3aed', color: '#fff', fontSize: '0.6rem', fontWeight: 800, borderRadius: 20, padding: '2px 6px', zIndex: 5, lineHeight: 1 }}>×2</span>}
                                </div>
                              )
                            })}
                          </div>
                          <button onClick={() => nextPage(col.id, cartasCol.length)} disabled={idx + CARDS_PER_PAGE >= cartasCol.length} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '1.4rem', cursor: idx + CARDS_PER_PAGE >= cartasCol.length ? 'not-allowed' : 'pointer', opacity: idx + CARDS_PER_PAGE >= cartasCol.length ? 0.3 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                          {idx + 1}–{Math.min(idx + CARDS_PER_PAGE, cartasCol.length)} de {cartasCol.length}
                        </p>
                      </div>
                    )
                  })() : (
                    <div className="cartas-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: faltantes.length > 0 ? '1rem' : 0, padding: '0 1.25rem' }}>
                      {cartasCol.map(carta => {
                        const tengo = coleccion.includes(carta.id)
                        const indiceGlobal = CARTAS.findIndex(c => c.id === carta.id) + 1
                        const copias = cantidades[carta.id] ?? 0
                        return (
                          <div key={carta.id} className={`cg-item${tengo ? ' obtenida' : ''}`} title={tengo ? `${carta.nombre} — ${carta.obra}` : `${carta.nombre} (no obtenida)`} onClick={(e) => tengo && openCarta(e, carta)} style={{ cursor: tengo ? 'pointer' : 'default', position: 'relative' }}>
                            <div className="cg-inner"><CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={indiceGlobal} total={CARTAS.length} /></div>
                            {copias >= 2 && <span style={{ position: 'absolute', top: 4, right: 4, background: '#7c3aed', color: '#fff', fontSize: '0.6rem', fontWeight: 800, borderRadius: 20, padding: '2px 6px', zIndex: 5, lineHeight: 1 }}>×2</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {faltantes.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', padding: '0.75rem 1.25rem 0' }}>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Te faltan {faltantes.length}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {faltantes.map(c => (
                          <span key={c.id} style={{
                            fontSize: '0.68rem',
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: `${RAREZAS[rarezaVisual(c.rareza)].color}15`,
                            border: `1px solid ${RAREZAS[rarezaVisual(c.rareza)].color}30`,
                            color: RAREZAS[rarezaVisual(c.rareza)].color,
                          }}>
                            {EMOJI_RAREZA[rarezaVisual(c.rareza)]} {c.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Vista: Por rareza */}
          {vista === 'rareza' && ORDEN_RAREZA.map(rareza => {
            const cartasDeRareza = CARTAS.filter(c => rarezaVisual(c.rareza) === rareza)
            const obtenidas = cartasDeRareza.filter(c => coleccion.includes(c.id)).length
            const r = RAREZAS[rareza]

            return (
              <div key={rareza} style={{ marginBottom: '2rem' }}>
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

                {isMobile ? (() => {
                  const idx = carouselIdx[rareza] ?? 0
                  const pagina = cartasDeRareza.slice(idx, idx + CARDS_PER_PAGE)
                  return (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.25rem' }}>
                        <button onClick={() => prevPage(rareza)} disabled={idx === 0} style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${r.color}40`, background: `${r.color}15`, color: '#fff', fontSize: '1.4rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                          {pagina.map(carta => {
                            const tengo = coleccion.includes(carta.id)
                            const indiceGlobal = CARTAS.findIndex(c => c.id === carta.id) + 1
                            const copias = cantidades[carta.id] ?? 0
                            return (
                              <div key={carta.id} className={`cg-item${tengo ? ' obtenida' : ''}`} onClick={(e) => tengo && openCarta(e, carta)} style={{ cursor: tengo ? 'pointer' : 'default', zoom: 0.82, position: 'relative' }}>
                                <div className="cg-inner"><CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={indiceGlobal} total={CARTAS.length} /></div>
                                {copias >= 2 && <span style={{ position: 'absolute', top: 4, right: 4, background: '#7c3aed', color: '#fff', fontSize: '0.6rem', fontWeight: 800, borderRadius: 20, padding: '2px 6px', zIndex: 5, lineHeight: 1 }}>×2</span>}
                              </div>
                            )
                          })}
                        </div>
                        <button onClick={() => nextPage(rareza, cartasDeRareza.length)} disabled={idx + CARDS_PER_PAGE >= cartasDeRareza.length} style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${r.color}40`, background: `${r.color}15`, color: '#fff', fontSize: '1.4rem', cursor: idx + CARDS_PER_PAGE >= cartasDeRareza.length ? 'not-allowed' : 'pointer', opacity: idx + CARDS_PER_PAGE >= cartasDeRareza.length ? 0.3 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                      </div>
                      <p style={{ textAlign: 'center', fontSize: '0.65rem', color: r.color, opacity: 0.5, marginTop: 6 }}>
                        {idx + 1}–{Math.min(idx + CARDS_PER_PAGE, cartasDeRareza.length)} de {cartasDeRareza.length}
                      </p>
                    </div>
                  )
                })() : (
                  <div className="cartas-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                    {cartasDeRareza.map(carta => {
                      const tengo = coleccion.includes(carta.id)
                      const indiceGlobal = CARTAS.findIndex(c => c.id === carta.id) + 1
                      const copias = cantidades[carta.id] ?? 0
                      return (
                        <div key={carta.id} className={`cg-item${tengo ? ' obtenida' : ''}`} title={tengo ? `${carta.nombre} — ${carta.obra}` : `${carta.nombre} (no obtenida)`} onClick={(e) => tengo && openCarta(e, carta)} style={{ cursor: tengo ? 'pointer' : 'default', position: 'relative' }}>
                          <div className="cg-inner"><CartaPersonaje carta={carta} obtenida={tengo} size="sm" numero={indiceGlobal} total={CARTAS.length} /></div>
                          {copias >= 2 && <span style={{ position: 'absolute', top: 4, right: 4, background: '#7c3aed', color: '#fff', fontSize: '0.6rem', fontWeight: 800, borderRadius: 20, padding: '2px 6px', zIndex: 5, lineHeight: 1 }}>×2</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        </div>
      </div>

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
                {reveal.carta.fondo && (
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

                    <div
                      onClick={() => !reveal.revelada && setReveal(r => r ? { ...r, revelada: true } : r)}
                      style={{
                        width: 300, height: 480, perspective: 1200,
                        cursor: reveal.revelada ? 'default' : 'pointer',
                        position: 'relative',
                      }}
                    >
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
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 10, overflow: 'hidden' }}>
                          <CartaDorso size="lg" glowColor={esAlta ? reveal.carta.color : undefined} pulsar={esAlta} imagen={reveal.carta.dorso} />
                        </div>
                        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 10, overflow: 'hidden' }}>
                          <CartaPersonaje carta={reveal.carta} obtenida size="lg" numero={CARTAS.findIndex(c => c.id === reveal.carta.id) + 1} total={CARTAS.length} />
                        </div>
                      </div>
                    </div>

                    {reveal.revelada && (
                      <>
                        {/* Badge de probabilidad */}
                        <div style={{ animation: 'fade-in-bg 0.6s ease' }}>
                          {(() => {
                            const prob = getProbabilidadCarta(reveal.carta)
                            const rareza = rarezaVisual(reveal.carta.rareza)
                            const color = rareza === 'legendario' ? '#f0c040'
                              : rareza === 'epico' ? '#c084fc'
                              : '#94a3b8'
                            return (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 12px', borderRadius: 20,
                                background: `${color}18`,
                                border: `1px solid ${color}44`,
                                fontSize: '0.75rem',
                              }}>
                                <span style={{ color: color, fontWeight: 700 }}>
                                  {prob < 0.1 ? prob.toFixed(2) : prob < 1 ? prob.toFixed(1) : prob.toFixed(1)}%
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>de probabilidad</span>
                              </div>
                            )
                          })()}
                        </div>

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
                              🎴 Otro sobre ({tiradas})
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

      {/* Flying card modal — spin effect */}
      {ampliada && cardOrigin && animState && (() => {
        const LG_W = 300

        // Dorso específico según la serie de la carta
        const dorsoImagen = (() => {
          const id = ampliada.id
          const SDA = new Set(['aragorn','legolas','arwen','galadriel','eowyn','frodo-bolson','gandalf','saruman','sauron','grima','boromir','barbol','theoden','eomer','bilbo-bolson','meriadoc','samsagaz','gimli','faramir'])
          const GOT = new Set(['arya-stark','cersei-lannister','jaime-lannister','sansa-stark','tyrion-lannister','jon-snow','daenerys-targaryen','the-night-king','bran-stark','davos-seaworth','samwell-tarly','theon-greyjoy','ygritte','brienne-de-tarth','jorah-mormont','melisandre','petyr-baelish','sandor-clegane'])
          const HP  = new Set(['ron-weasley','ginny-weasley','neville-longbottom','cho-chang','cedric-diggory','fred-george','luna-lovegood','hermione-granger','draco-malfoy','rubeus-hagrid','sirius-black','severus-snape','bellatrix-lestrange','dobby','harry-potter','albus-dumbledore','lord-voldemort','reliquias-muerte'])
          const PP  = new Set(['el-bebedor','el-vanidoso','el-baobab','el-rey','el-farolero','el-hombre-de-negocios','el-aviador','el-geografo','la-serpiente','el-zorro','la-rosa','el-principito'])
          if (SDA.has(id)) return '/dorso-sda.png'
          if (GOT.has(id)) return '/dorso-got.png'
          if (HP.has(id))  return '/dorso-hp.png'
          if (PP.has(id))  return '/dorso-principito.png'
          return undefined
        })()
        const cx = cardOrigin.left + cardOrigin.width / 2
        const cy = cardOrigin.top + cardOrigin.height / 2
        const dx = cx - window.innerWidth / 2
        const dy = cy - window.innerHeight / 2
        const sc = cardOrigin.width / LG_W

        const arrived = animState === 'arrived'
        const arrivedTransform = tilt.active
          ? `perspective(900px) translate(-50%, -50%) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : `translate(-50%, -50%)`

        return (
          <>
            {/* Backdrop */}
            <div
              onClick={closeCarta}
              style={{
                position: 'fixed', inset: 0, zIndex: 9997,
                background: 'rgba(10,8,5,0.88)',
                backdropFilter: 'blur(4px)',
                opacity: arrived ? 1 : 0,
                transition: 'opacity 0.35s ease',
                pointerEvents: arrived ? 'auto' : 'none',
              }}
            >
              {ampliada.fondo && ampliada.rareza !== 'epico' && (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${ampliada.fondo})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(2px) brightness(0.4) saturate(1.2)',
                    transform: 'scale(1.08)',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(circle at 50% 45%, ${ampliada.color}15 0%, transparent 55%, rgba(0,0,0,0.55) 100%)`,
                  }} />
                </>
              )}
            </div>

            {/* Flying + spinning card */}
            <div
              onAnimationEnd={handleAnimEnd}
              onMouseMove={arrived ? handleCardMove : undefined}
              onMouseLeave={arrived ? handleCardLeave : undefined}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                zIndex: 9998,
                transformStyle: 'preserve-3d',
                ['--dx' as string]: `${dx}px`,
                ['--dy' as string]: `${dy}px`,
                ['--sc' as string]: sc,
                animation: animState === 'flying-in'
                  ? 'carta-vuela-in 1.3s cubic-bezier(0.22,1,0.36,1) forwards'
                  : animState === 'flying-out'
                  ? 'carta-vuela-out 1.0s ease-in forwards'
                  : 'none',
                transform: arrived ? arrivedTransform : undefined,
                transition: arrived
                  ? (tilt.active ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out')
                  : 'none',
              } as React.CSSProperties}
            >
              {/* Cara frontal */}
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'relative' }}>
                <CartaPersonaje carta={ampliada} obtenida size="lg" numero={CARTAS.findIndex(c => c.id === ampliada.id) + 1} total={CARTAS.length} />
                {/* Reverse holo foil — comun/raro */}
                {arrived && (ampliada.rareza === 'comun' || ampliada.rareza === 'raro') && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10, pointerEvents: 'none', zIndex: 9,
                    background: `linear-gradient(
                      ${tilt.mx * 1.8}deg,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8},     100%, 65%, 0.45) 0%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 60}, 100%, 65%, 0.45) 16%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 120},100%, 65%, 0.45) 33%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 180},100%, 65%, 0.45) 50%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 240},100%, 65%, 0.45) 66%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 300},100%, 65%, 0.45) 83%,
                      hsla(${tilt.mx * 3.6 + tilt.my * 1.8 + 360},100%, 65%, 0.45) 100%
                    )`,
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
                <button
                  onClick={closeCarta}
                  style={{
                    position: 'absolute', top: -14, right: -14,
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#1a1a2e', border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: arrived ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                >✕</button>
              </div>

              {/* Cara trasera (dorso) */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}>
                <CartaDorso size="lg" imagen={dorsoImagen} />
              </div>
            </div>
          </>
        )
      })()}

      <style suppressHydrationWarning>{`
        @keyframes carta-vuela-in {
          0%   { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--sc)) rotateY(0deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotateY(360deg); }
        }
        @keyframes carta-vuela-out {
          0%   { transform: translate(-50%, -50%) scale(1) rotateY(0deg); }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--sc)) rotateY(-360deg); }
        }
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
        .cg-item { position: relative; z-index: 1; }
        .cg-item.obtenida:hover { z-index: 10; }
        .cg-inner {
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
          border-radius: 10px;
          will-change: transform;
          position: relative;
        }
        .cg-item.obtenida:hover .cg-inner {
          transform: translateY(-7px) scale(1.05) rotateX(5deg);
          filter: brightness(1.12) saturate(1.1);
          box-shadow: 0 14px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07);
        }
        .cg-item.obtenida:hover .cg-inner::after {
          content: '';
          position: absolute; inset: 0; border-radius: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 50%, rgba(255,255,255,0.04) 100%);
          pointer-events: none;
        }
        .rayos-luz { animation: girar-rayos 22s linear infinite; }
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
