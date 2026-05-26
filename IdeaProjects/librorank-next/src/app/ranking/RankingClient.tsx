'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getNivelLector } from '@/lib/dao/usuarioDAO'

// ── Definición de ligas ──────────────────────────────────────────────────────

export const LIGAS = [
  { key: 'bronce',   nombre: 'Bronce',   emoji: '🥉', color: '#cd7f32', colorBg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.35)',  min: 0,    max: 299   },
  { key: 'plata',    nombre: 'Plata',    emoji: '🥈', color: '#b0b8c1', colorBg: 'rgba(176,184,193,0.12)', border: 'rgba(176,184,193,0.35)', min: 300,  max: 799   },
  { key: 'oro',      nombre: 'Oro',      emoji: '🥇', color: '#d4af37', colorBg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.35)',  min: 800,  max: 1999  },
  { key: 'diamante', nombre: 'Diamante', emoji: '💎', color: '#7ecfff', colorBg: 'rgba(126,207,255,0.12)', border: 'rgba(126,207,255,0.35)', min: 2000, max: Infinity },
]

export function getLigaActual(puntos: number) {
  for (let i = LIGAS.length - 1; i >= 0; i--) {
    if (puntos >= LIGAS[i].min) return LIGAS[i]
  }
  return LIGAS[0]
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UsuarioRanking {
  id: number
  nombre: string
  username: string
  puntos: number
  total_leidos: number
  avatar_url: string | null
  es_amigo: boolean
  es_yo: boolean
}

interface Props {
  ranking: UsuarioRanking[]
  usuarioId: number
  puntosUsuario: number
}

// ── Medallas top 3 ───────────────────────────────────────────────────────────

function Medal({ pos }: { pos: number }) {
  if (pos === 1) return <span style={{ fontSize: '1.1rem' }}>🥇</span>
  if (pos === 2) return <span style={{ fontSize: '1.1rem' }}>🥈</span>
  if (pos === 3) return <span style={{ fontSize: '1.1rem' }}>🥉</span>
  return <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>#{pos}</span>
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function RankingClient({ ranking, usuarioId, puntosUsuario }: Props) {
  const ligaActual = getLigaActual(puntosUsuario)
  const ligaSiguiente = LIGAS[LIGAS.indexOf(ligaActual) + 1] ?? null

  const [ligaTab, setLigaTab] = useState(ligaActual.key)

  const ligaSeleccionada = LIGAS.find(l => l.key === ligaTab)!

  // Filtrar usuarios de la liga seleccionada
  const usuariosLiga = ranking
    .filter(u => u.puntos >= ligaSeleccionada.min && u.puntos <= ligaSeleccionada.max)
    .sort((a, b) => b.puntos - a.puntos)

  // Posición del usuario en su propia liga
  const posEnLiga = ranking
    .filter(u => u.puntos >= ligaActual.min && u.puntos <= ligaActual.max)
    .sort((a, b) => b.puntos - a.puntos)
    .findIndex(u => u.id === usuarioId) + 1

  const puntasFaltanSubir = ligaSiguiente ? ligaSiguiente.min - puntosUsuario : 0
  const progresoLiga = ligaSiguiente
    ? Math.min(100, Math.round(((puntosUsuario - ligaActual.min) / (ligaSiguiente.min - ligaActual.min)) * 100))
    : 100

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: `linear-gradient(135deg, #0a0a0a 0%, #111 60%, ${ligaActual.color}08 100%)`,
        borderBottom: `2px solid ${ligaActual.border}`,
        padding: '3.5rem 0 3rem',
      }}>
        <div className="container">
          <div className="row align-items-center g-4">

            {/* Info liga del usuario */}
            <div className="col-md-6 text-center text-md-start">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                background: ligaActual.colorBg,
                border: `1px solid ${ligaActual.border}`,
                borderRadius: 12, padding: '0.4rem 1rem',
                fontSize: '0.8rem', fontWeight: 700,
                color: ligaActual.color, marginBottom: '0.75rem',
              }}>
                {ligaActual.emoji} Liga {ligaActual.nombre}
                {posEnLiga > 0 && <span style={{ opacity: 0.7 }}>· #{posEnLiga} en tu liga</span>}
              </div>
              <h1 className="font-title display-5 mb-2" style={{ color: '#fff' }}>
                🏆 Ranking Global
              </h1>
              <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
                Competí con lectores de todo LibroRank. Subí de liga acumulando puntos.
              </p>

              {/* Barra de progreso hacia siguiente liga */}
              {ligaSiguiente && (
                <div style={{ maxWidth: 380 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem' }}>
                    <span style={{ color: ligaActual.color, fontWeight: 700 }}>
                      {ligaActual.emoji} {ligaActual.nombre}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Faltan <strong style={{ color: '#fff' }}>{puntasFaltanSubir} pts</strong> para {ligaSiguiente.emoji} {ligaSiguiente.nombre}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${progresoLiga}%`,
                      background: `linear-gradient(90deg, ${ligaActual.color}aa, ${ligaActual.color})`,
                      borderRadius: 99, transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
                    <span>{ligaActual.min} pts</span>
                    <span>{ligaSiguiente.min} pts</span>
                  </div>
                </div>
              )}
              {!ligaSiguiente && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(126,207,255,0.1)', border: '1px solid rgba(126,207,255,0.3)',
                  borderRadius: 10, padding: '0.4rem 1rem',
                  fontSize: '0.78rem', fontWeight: 700, color: '#7ecfff',
                }}>
                  💎 Liga máxima alcanzada
                </div>
              )}
            </div>

            {/* Tus stats rápidos */}
            <div className="col-md-6">
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                maxWidth: 360, marginLeft: 'auto',
              }}>
                {[
                  { label: 'Tus puntos', value: `⭐ ${puntosUsuario}`, color: '#d4af37' },
                  { label: 'Tu liga', value: `${ligaActual.emoji} ${ligaActual.nombre}`, color: ligaActual.color },
                  { label: 'Posición global', value: `#${ranking.findIndex(u => u.id === usuarioId) + 1 || '—'}`, color: '#fff' },
                  { label: 'En tu liga', value: posEnLiga > 0 ? `#${posEnLiga}` : '—', color: '#fff' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '0.85rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="container py-5">

        {/* Tabs de ligas */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {LIGAS.map(liga => {
            const activa = liga.key === ligaTab
            const countLiga = ranking.filter(u => u.puntos >= liga.min && u.puntos <= liga.max).length
            return (
              <button
                key={liga.key}
                onClick={() => setLigaTab(liga.key)}
                style={{
                  background: activa ? liga.colorBg : 'rgba(255,255,255,0.04)',
                  border: activa ? `2px solid ${liga.border}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '0.45rem 1.1rem',
                  fontSize: '0.82rem', fontWeight: 700,
                  color: activa ? liga.color : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {liga.emoji} {liga.nombre}
                <span style={{
                  background: activa ? liga.border : 'rgba(255,255,255,0.08)',
                  color: activa ? liga.color : 'rgba(255,255,255,0.4)',
                  borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem',
                }}>
                  {countLiga}
                </span>
              </button>
            )
          })}
        </div>

        {/* Descripción de la liga seleccionada */}
        <div style={{
          background: ligaSeleccionada.colorBg,
          border: `1px solid ${ligaSeleccionada.border}`,
          borderRadius: 12, padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.8rem' }}>{ligaSeleccionada.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, color: ligaSeleccionada.color, fontSize: '0.9rem' }}>
              Liga {ligaSeleccionada.nombre}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
              {ligaSeleccionada.max === Infinity
                ? `${ligaSeleccionada.min}+ puntos · ${usuariosLiga.length} lectores`
                : `${ligaSeleccionada.min}–${ligaSeleccionada.max} puntos · ${usuariosLiga.length} lectores`
              }
            </div>
          </div>
        </div>

        {/* Tabla de la liga */}
        {usuariosLiga.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{ligaSeleccionada.emoji}</div>
            <p className="text-muted">Todavía no hay lectores en esta liga.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {usuariosLiga.map((u, i) => {
              const pos = i + 1
              const nivelInfo = getNivelLector(u.puntos)
              const esYo = u.id === usuarioId
              return (
                <div
                  key={u.id}
                  style={{
                    background: esYo
                      ? `linear-gradient(135deg, ${ligaSeleccionada.color}12, ${ligaSeleccionada.color}06)`
                      : pos <= 3 ? 'rgba(255,255,255,0.04)' : 'var(--bg-card)',
                    border: esYo
                      ? `1px solid ${ligaSeleccionada.border}`
                      : pos <= 3 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '0.85rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                >
                  {/* Posición */}
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    <Medal pos={pos} />
                  </div>

                  {/* Avatar */}
                  <img
                    src={u.avatar_url || '/img/personajes/personaje_1.png'}
                    alt={u.username}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      objectFit: 'cover', flexShrink: 0,
                      border: esYo ? `2px solid ${ligaSeleccionada.color}` : '1px solid rgba(255,255,255,0.1)',
                    }}
                  />

                  {/* Nombre */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/perfil?id=${u.id}`}
                        style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}
                      >
                        @{u.username}
                      </Link>
                      {esYo && (
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, background: 'rgba(212,175,55,0.2)',
                          color: '#d4af37', borderRadius: 20, padding: '1px 7px',
                          border: '1px solid rgba(212,175,55,0.3)',
                        }}>
                          Vos
                        </span>
                      )}
                      {u.es_amigo && (
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, background: 'rgba(39,174,96,0.15)',
                          color: '#27ae60', borderRadius: 20, padding: '1px 7px',
                          border: '1px solid rgba(39,174,96,0.3)',
                        }}>
                          amigo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {nivelInfo.emoji} {nivelInfo.titulo}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.95rem' }}>⭐ {u.puntos}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>puntos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{u.total_leidos}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>leídos</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
