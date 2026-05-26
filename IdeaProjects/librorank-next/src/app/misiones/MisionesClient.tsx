'use client'

import { useState } from 'react'
import type { MisionConProgreso, TipoMision } from '@/lib/dao/misionDAO'
import BannerExplicativo from '@/components/BannerExplicativo'

interface Props {
  misionesIniciales: MisionConProgreso[]
  puntos: number
}

const TABS: { key: TipoMision | 'todas'; label: string; emoji: string }[] = [
  { key: 'todas',      label: 'Todas',      emoji: '🗂️' },
  { key: 'mensual',    label: 'Mensuales',   emoji: '📅' },
  { key: 'semanal',    label: 'Semanales',   emoji: '⚡' },
  { key: 'permanente', label: 'Permanentes', emoji: '🏆' },
]

export default function MisionesClient({ misionesIniciales, puntos: puntosIni }: Props) {
  const [misiones, setMisiones] = useState(misionesIniciales)
  const [puntos, setPuntos] = useState(puntosIni)
  const [tab, setTab] = useState<TipoMision | 'todas'>('todas')
  const [reclamando, setReclamando] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null)

  const misionesFiltradas = tab === 'todas' ? misiones : misiones.filter(m => m.tipo === tab)
  const completadasSinReclamar = misiones.filter(m => m.completada && !m.reclamada).length
  const totalCompletadas = misiones.filter(m => m.completada).length

  function mostrarToast(msg: string, tipo: 'ok' | 'err') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  async function reclamar(mision: MisionConProgreso) {
    if (reclamando || mision.reclamada || !mision.completada) return
    setReclamando(mision.key)
    try {
      const res = await fetch('/api/misiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ misionKey: mision.key }),
      })
      const json = await res.json()
      if (json.ok) {
        setMisiones(prev => prev.map(m => m.key === mision.key ? { ...m, reclamada: true } : m))
        setPuntos(p => p + (json.puntos ?? 0))
        mostrarToast(`¡+${json.puntos} pts! ${mision.nombre} completada 🎉`, 'ok')
      } else {
        mostrarToast(json.error || 'No se pudo reclamar', 'err')
      }
    } catch {
      mostrarToast('Error de conexión', 'err')
    } finally {
      setReclamando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 60%, #0a1208 100%)',
        borderBottom: '2px solid rgba(212,175,55,0.2)',
        padding: '3.5rem 0 3rem',
      }}>
        <div className="container text-center">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', lineHeight: 1 }}>🎯</div>
          <h1 className="font-title display-5 mb-2" style={{ color: '#fff' }}>Misiones</h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
            Completá misiones, ganás puntos y subís de nivel más rápido.
          </p>

          {/* Stats del hero */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 12,
              padding: '0.75rem 1.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d4af37' }}>⭐ {puntos}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Puntos totales</div>
            </div>
            <div style={{
              background: 'rgba(39,174,96,0.1)',
              border: '1px solid rgba(39,174,96,0.3)',
              borderRadius: 12,
              padding: '0.75rem 1.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#27ae60' }}>✅ {totalCompletadas}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Completadas</div>
            </div>
            {completadasSinReclamar > 0 && (
              <div style={{
                background: 'rgba(255,165,0,0.15)',
                border: '1px solid rgba(255,165,0,0.4)',
                borderRadius: 12,
                padding: '0.75rem 1.5rem',
                textAlign: 'center',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffa500' }}>🎁 {completadasSinReclamar}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Sin reclamar</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="container py-5">

        <BannerExplicativo
          icon="🎯"
          titulo="¿Cómo funcionan las misiones?"
          descripcion="Completá objetivos de lectura y reclamá tus recompensas"
          pasos={[
            { icon: '📅', texto: 'Mensuales y semanales se renuevan cada período' },
            { icon: '🏆', texto: 'Las permanentes son logros únicos para siempre' },
            { icon: '🎁', texto: 'Cuando completás una, hacé clic en Reclamar' },
            { icon: '⭐', texto: 'Cada misión suma puntos para subir de nivel' },
          ]}
          color="#27ae60"
        />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key
                  ? 'linear-gradient(135deg, #d4af37, #f1c40f)'
                  : 'rgba(255,255,255,0.05)',
                border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '0.4rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: tab === t.key ? '#000' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Grid de misiones */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {misionesFiltradas.map(m => {
            const pct = Math.round((m.progreso / m.meta) * 100)
            const esReclamando = reclamando === m.key

            return (
              <div
                key={m.key}
                style={{
                  background: m.reclamada
                    ? 'rgba(39,174,96,0.06)'
                    : m.completada
                      ? `linear-gradient(135deg, ${m.color}10, ${m.color}05)`
                      : 'var(--bg-card)',
                  border: m.reclamada
                    ? '1px solid rgba(39,174,96,0.25)'
                    : m.completada
                      ? `1px solid ${m.color}50`
                      : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  if (!m.reclamada) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${m.color}20`
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                {/* Brillo si completada y no reclamada */}
                {m.completada && !m.reclamada && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 80, height: 80,
                    background: `radial-gradient(circle at top right, ${m.color}20, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Header de la misión */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    fontSize: '2rem', lineHeight: 1,
                    filter: m.reclamada ? 'grayscale(0.3)' : 'none',
                  }}>
                    {m.reclamada ? '✅' : m.icono}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.88rem', fontWeight: 700,
                      color: m.reclamada ? 'rgba(255,255,255,0.5)' : '#fff',
                      marginBottom: '0.15rem',
                    }}>
                      {m.nombre}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                      {m.descripcion}
                    </div>
                  </div>
                  {/* Badge tipo */}
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.5px', padding: '2px 7px',
                    borderRadius: 20, flexShrink: 0,
                    background: m.tipo === 'mensual'
                      ? 'rgba(41,128,185,0.2)' : m.tipo === 'semanal'
                        ? 'rgba(22,160,133,0.2)' : 'rgba(212,175,55,0.15)',
                    color: m.tipo === 'mensual'
                      ? '#5dade2' : m.tipo === 'semanal'
                        ? '#1abc9c' : '#d4af37',
                    border: `1px solid ${m.tipo === 'mensual'
                      ? 'rgba(41,128,185,0.3)' : m.tipo === 'semanal'
                        ? 'rgba(22,160,133,0.3)' : 'rgba(212,175,55,0.25)'}`,
                  }}>
                    {m.tipo === 'mensual' ? '📅 Mes' : m.tipo === 'semanal' ? '⚡ Sem.' : '🏆 Perm.'}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      Progreso
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: m.completada ? m.color : 'rgba(255,255,255,0.5)' }}>
                      {m.progreso} / {m.meta}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: m.reclamada
                        ? 'rgba(39,174,96,0.5)'
                        : `linear-gradient(90deg, ${m.color}aa, ${m.color})`,
                      borderRadius: 99,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {/* Footer: puntos + botón */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: 'rgba(212,175,55,0.8)',
                  }}>
                    ⭐ +{m.puntos} pts
                  </span>

                  {m.reclamada ? (
                    <span style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 700 }}>
                      ✓ Reclamada
                    </span>
                  ) : m.completada ? (
                    <button
                      onClick={() => reclamar(m)}
                      disabled={esReclamando}
                      style={{
                        background: esReclamando
                          ? 'rgba(212,175,55,0.3)'
                          : 'linear-gradient(135deg, #d4af37, #f1c40f)',
                        border: 'none', borderRadius: 8,
                        padding: '0.4rem 1rem',
                        fontSize: '0.75rem', fontWeight: 800,
                        color: '#000', cursor: esReclamando ? 'default' : 'pointer',
                        transition: 'opacity 0.15s',
                        animation: esReclamando ? 'none' : 'pulse 1.5s ease-in-out infinite',
                      }}
                    >
                      {esReclamando ? '...' : '🎁 Reclamar'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                      {pct}% completado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: toast.tipo === 'ok' ? '#27ae60' : '#e74c3c',
          color: '#fff', borderRadius: 12,
          padding: '0.85rem 1.5rem',
          fontSize: '0.88rem', fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 9999,
          animation: 'slideInUp 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
