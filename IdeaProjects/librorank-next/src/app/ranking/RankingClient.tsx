'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getNivelLector } from '@/lib/nivelUtils'
import { LIGAS, getLiga } from '@/lib/ligas'

// Re-export para compatibilidad con código existente
export { LIGAS }
export const getLigaActual = getLiga

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

interface UsuarioSemanal {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  puntos: number
  libros_semana: number
  es_yo: boolean
  es_amigo: boolean
}

interface UsuarioLigaSemanal {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
  puntos: number
  libros_semana: number
  es_yo: boolean
  es_amigo: boolean
  nivel: { emoji: string; titulo: string; nivel: number }
}

interface Props {
  ranking: UsuarioRanking[]
  rankingSemanal: UsuarioSemanal[]
  ligaSemanal: UsuarioLigaSemanal[]
  ligaActualKey: string
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

// Calcula horas hasta el próximo lunes (reset semanal)
function horasParaReset(): string {
  const ahora = new Date()
  const lunes = new Date(ahora)
  const diasHastaLunes = (8 - ahora.getDay()) % 7 || 7
  lunes.setDate(ahora.getDate() + diasHastaLunes)
  lunes.setHours(0, 0, 0, 0)
  const diffMs = lunes.getTime() - ahora.getTime()
  const horas = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  if (horas >= 24) return `${Math.floor(horas / 24)}d ${horas % 24}h`
  return `${horas}h ${mins}m`
}

export default function RankingClient({ ranking, rankingSemanal, ligaSemanal, ligaActualKey, usuarioId, puntosUsuario }: Props) {
  const ligaActual = getLigaActual(puntosUsuario)
  const ligaSiguiente = LIGAS[LIGAS.indexOf(ligaActual) + 1] ?? null

  const [ligaTab, setLigaTab] = useState<string>('ligasemanal')

  const esGeneral      = ligaTab === 'general'
  const esLibros       = ligaTab === 'libros'
  const esSemanal      = ligaTab === 'semanal'
  const esLigaSemanal  = ligaTab === 'ligasemanal'
  const ligaSeleccionada = LIGAS.find(l => l.key === ligaTab)

  // Usuarios a mostrar según tab
  const usuariosLiga = esGeneral
    ? [...ranking].sort((a, b) => b.puntos - a.puntos)
    : esLibros
      ? [...ranking].sort((a, b) => b.total_leidos - a.total_leidos)
      : esSemanal
        ? rankingSemanal
        : ranking
            .filter(u => ligaSeleccionada && u.puntos >= ligaSeleccionada.min && u.puntos <= ligaSeleccionada.max)
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>

          {/* Tab Liga Semanal ⚔️ */}
          <button
            onClick={() => setLigaTab('ligasemanal')}
            style={{
              background: esLigaSemanal ? `${ligaActual.colorBg}` : 'rgba(255,255,255,0.04)',
              border: esLigaSemanal ? `2px solid ${ligaActual.border}` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '0.45rem 1.1rem',
              fontSize: '0.82rem', fontWeight: 700,
              color: esLigaSemanal ? ligaActual.color : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            ⚔️ Liga Semanal
            <span style={{
              background: 'rgba(255,100,0,0.15)', color: '#ff6400',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 800,
            }}>
              NUEVO
            </span>
          </button>

          {/* Tab General */}
          <button
            onClick={() => setLigaTab('general')}
            style={{
              background: esGeneral ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
              border: esGeneral ? '2px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '0.45rem 1.1rem',
              fontSize: '0.82rem', fontWeight: 700,
              color: esGeneral ? '#d4af37' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            🌍 General
            <span style={{
              background: esGeneral ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)',
              color: esGeneral ? '#d4af37' : 'rgba(255,255,255,0.4)',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem',
            }}>
              {ranking.length}
            </span>
          </button>

          {/* Tab Libros leídos */}
          <button
            onClick={() => setLigaTab('libros')}
            style={{
              background: esLibros ? 'rgba(74,158,122,0.15)' : 'rgba(255,255,255,0.04)',
              border: esLibros ? '2px solid rgba(74,158,122,0.5)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '0.45rem 1.1rem',
              fontSize: '0.82rem', fontWeight: 700,
              color: esLibros ? '#4a9e7a' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            📚 Libros leídos
            <span style={{
              background: esLibros ? 'rgba(74,158,122,0.3)' : 'rgba(255,255,255,0.08)',
              color: esLibros ? '#4a9e7a' : 'rgba(255,255,255,0.4)',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem',
            }}>
              {ranking.length}
            </span>
          </button>

          {/* Tab Esta semana */}
          <button
            onClick={() => setLigaTab('semanal')}
            style={{
              background: esSemanal ? 'rgba(233,30,140,0.12)' : 'rgba(255,255,255,0.04)',
              border: esSemanal ? '2px solid rgba(233,30,140,0.45)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '0.45rem 1.1rem',
              fontSize: '0.82rem', fontWeight: 700,
              color: esSemanal ? '#e91e8c' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            🔥 Esta semana
            <span style={{
              background: esSemanal ? 'rgba(233,30,140,0.25)' : 'rgba(255,255,255,0.08)',
              color: esSemanal ? '#e91e8c' : 'rgba(255,255,255,0.4)',
              borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem',
            }}>
              {rankingSemanal.length}
            </span>
          </button>

          {/* Tabs de ligas */}
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

        {/* Descripción del tab activo */}
        {!esLigaSemanal && (
        <div style={{
          background: esGeneral ? 'rgba(212,175,55,0.06)' : esSemanal ? 'rgba(233,30,140,0.06)' : ligaSeleccionada?.colorBg,
          border: `1px solid ${esGeneral ? 'rgba(212,175,55,0.2)' : esSemanal ? 'rgba(233,30,140,0.25)' : ligaSeleccionada?.border}`,
          borderRadius: 12, padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.8rem' }}>
            {esGeneral ? '🌍' : esLibros ? '📚' : esSemanal ? '🔥' : ligaSeleccionada?.emoji}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: esGeneral ? '#d4af37' : esLibros ? '#4a9e7a' : esSemanal ? '#e91e8c' : ligaSeleccionada?.color, fontSize: '0.9rem' }}>
              {esGeneral ? 'Ranking General — Por puntos' : esLibros ? 'Ranking — Por libros leídos' : esSemanal ? 'Ranking Semanal — Últimos 7 días' : `Liga ${ligaSeleccionada?.nombre}`}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
              {esGeneral || esLibros
                ? `Todos los lectores · ${ranking.length} en total`
                : esSemanal
                  ? `${rankingSemanal.length} lectores activos · reinicia el lunes`
                  : ligaSeleccionada?.max === Infinity
                    ? `${ligaSeleccionada?.min}+ puntos · ${usuariosLiga.length} lectores`
                    : `${ligaSeleccionada?.min}–${ligaSeleccionada?.max} puntos · ${usuariosLiga.length} lectores`
              }
            </div>
          </div>
          {esSemanal && (
            <div style={{
              background: 'rgba(233,30,140,0.12)',
              border: '1px solid rgba(233,30,140,0.3)',
              borderRadius: 8, padding: '0.35rem 0.75rem',
              fontSize: '0.68rem', fontWeight: 700, color: '#e91e8c',
              textAlign: 'center', flexShrink: 0,
            }}>
              🏆 Top 3 gana<br />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>100 · 50 · 25 pts</span>
            </div>
          )}
        </div>
        )}

        {/* ── Liga Semanal ─────────────────────────────────────────────── */}
        {esLigaSemanal && (() => {
          const miPosicion = ligaSemanal.findIndex(u => u.id === usuarioId) + 1
          const totalEnLiga = ligaSemanal.length
          const zonaAscenso = 3
          const zonaDescenso = Math.max(totalEnLiga - 3, zonaAscenso + 1)
          const activosEstaSemana = ligaSemanal.filter(u => u.libros_semana > 0).length

          return (
            <div>
              {/* Banner de estado de la liga */}
              <div style={{
                background: `linear-gradient(135deg, ${ligaActual.colorBg}, rgba(0,0,0,0.3))`,
                border: `1px solid ${ligaActual.border}`,
                borderRadius: 16, padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{ligaActual.emoji}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: ligaActual.color }}>
                    Liga {ligaActual.nombre} — Semana actual
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                    {totalEnLiga} lectores en tu liga · {activosEstaSemana} activos esta semana
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: miPosicion > 0 ? ligaActual.color : 'rgba(255,255,255,0.3)' }}>
                      {miPosicion > 0 ? `#${miPosicion}` : '—'}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>tu posición</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff6b35' }}>
                      {horasParaReset()}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>para el reset</div>
                  </div>
                </div>
              </div>

              {/* Leyenda de zonas */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(76,209,55,0.5)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Top 3 — zona de ascenso</span>
                </div>
                {ligaSiguiente && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(231,76,60,0.5)', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Últimos 3 — zona de descenso</span>
                  </div>
                )}
              </div>

              {ligaSemanal.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{ligaActual.emoji}</div>
                  <p className="text-muted">Nadie en tu liga leyó esta semana aún. ¡Sé el primero!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {ligaSemanal.map((u, i) => {
                    const pos = i + 1
                    const esYo = u.id === usuarioId
                    const enZonaAscenso = pos <= zonaAscenso && u.libros_semana > 0
                    const enZonaDescenso = ligaSiguiente && pos > zonaDescenso && totalEnLiga > 6
                    const borderColor = enZonaAscenso
                      ? 'rgba(76,209,55,0.4)'
                      : enZonaDescenso
                        ? 'rgba(231,76,60,0.3)'
                        : esYo
                          ? ligaActual.border
                          : 'rgba(255,255,255,0.05)'
                    const bgColor = enZonaAscenso
                      ? 'rgba(76,209,55,0.05)'
                      : enZonaDescenso
                        ? 'rgba(231,76,60,0.04)'
                        : esYo
                          ? `${ligaActual.color}10`
                          : 'var(--bg-card)'

                    return (
                      <div key={u.id} style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 12, padding: '0.75rem 1.25rem',
                        display: 'flex', alignItems: 'center', gap: '0.9rem',
                        transition: 'transform 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                      >
                        {/* Posición + indicador de zona */}
                        <div style={{ width: 34, textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                          {enZonaAscenso && pos <= 3 ? (
                            <Medal pos={pos} />
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: enZonaDescenso ? '#e74c3c' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>#{pos}</span>
                          )}
                          {enZonaAscenso && (
                            <div style={{ position: 'absolute', top: -2, right: -4, fontSize: '0.55rem', color: '#4cd137' }}>▲</div>
                          )}
                          {enZonaDescenso && (
                            <div style={{ position: 'absolute', top: -2, right: -4, fontSize: '0.55rem', color: '#e74c3c' }}>▼</div>
                          )}
                        </div>

                        {/* Avatar */}
                        <img
                          src={u.avatar_url || '/img/personajes/personaje_1.png'}
                          alt={u.username}
                          style={{
                            width: 38, height: 38, borderRadius: '50%',
                            objectFit: 'cover', flexShrink: 0,
                            border: `2px solid ${esYo ? ligaActual.color : enZonaAscenso ? 'rgba(76,209,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            opacity: u.libros_semana === 0 ? 0.5 : 1,
                          }}
                        />

                        {/* Nombre */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <Link href={`/perfil/${u.username}`} style={{ fontWeight: 700, color: u.libros_semana === 0 ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: 'none', fontSize: '0.88rem' }}>
                              @{u.username}
                            </Link>
                            {esYo && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: `${ligaActual.color}25`, color: ligaActual.color, borderRadius: 20, padding: '1px 7px', border: `1px solid ${ligaActual.border}` }}>
                                Vos
                              </span>
                            )}
                            {u.es_amigo && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(39,174,96,0.15)', color: '#27ae60', borderRadius: 20, padding: '1px 7px', border: '1px solid rgba(39,174,96,0.3)' }}>
                                amigo
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {u.nivel.emoji} {u.nivel.titulo}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: u.libros_semana > 0 ? '#4cd137' : 'rgba(255,255,255,0.2)' }}>
                              {u.libros_semana > 0 ? `📚 ${u.libros_semana}` : '—'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>esta semana</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: `${ligaActual.color}99`, fontSize: '0.82rem' }}>
                              ⭐ {u.puntos}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>pts totales</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Tabla Semanal ─────────────────────────────────────────────── */}
        {esSemanal && (
          rankingSemanal.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔥</div>
              <p className="text-muted">Nadie marcó libros esta semana aún. ¡Sé el primero!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankingSemanal.map((u, i) => {
                const pos = i + 1
                const esYo = u.id === usuarioId
                const medalColor = pos === 1 ? '#d4af37' : pos === 2 ? '#b0b8c1' : pos === 3 ? '#cd7f32' : 'rgba(255,255,255,0.1)'
                return (
                  <div
                    key={u.id}
                    style={{
                      background: esYo
                        ? 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(233,30,140,0.04))'
                        : pos <= 3 ? 'rgba(255,255,255,0.04)' : 'var(--bg-card)',
                      border: esYo
                        ? '1px solid rgba(233,30,140,0.35)'
                        : pos <= 3 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 12, padding: '0.85rem 1.25rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  >
                    <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                      <Medal pos={pos} />
                    </div>
                    <img
                      src={u.avatar_url || '/img/personajes/personaje_1.png'}
                      alt={u.username}
                      style={{
                        width: 38, height: 38, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0,
                        border: `2px solid ${esYo ? '#e91e8c' : medalColor}`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/perfil/${u.username}`}
                          style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}
                        >
                          @{u.username}
                        </Link>
                        {esYo && (
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 700, background: 'rgba(233,30,140,0.2)',
                            color: '#e91e8c', borderRadius: 20, padding: '1px 7px',
                            border: '1px solid rgba(233,30,140,0.3)',
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
                        {getNivelLector(u.puntos).emoji} {getNivelLector(u.puntos).titulo}
                        <span style={{ marginLeft: 6, color: getLigaActual(u.puntos).color, opacity: 0.8, fontWeight: 700, fontSize: '0.6rem' }}>
                          · {getLigaActual(u.puntos).emoji} {getLigaActual(u.puntos).nombre}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#e91e8c', fontSize: '1.1rem' }}>
                          📚 {u.libros_semana}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>esta semana</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'rgba(212,175,55,0.55)', fontSize: '0.85rem' }}>
                          ⭐ {u.puntos}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>puntos</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── Tabla Normal (general / libros / ligas) ───────────────────── */}
        {!esSemanal && (
          usuariosLiga.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{ligaSeleccionada?.emoji ?? '🏆'}</div>
              <p className="text-muted">Todavía no hay lectores en esta liga.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(usuariosLiga as UsuarioRanking[]).map((u, i) => {
                const pos = i + 1
                const nivelInfo = getNivelLector(u.puntos)
                const esYo = u.id === usuarioId
                return (
                  <div
                    key={u.id}
                    style={{
                      background: esYo
                        ? `linear-gradient(135deg, ${(ligaSeleccionada ?? ligaActual).color}12, ${(ligaSeleccionada ?? ligaActual).color}06)`
                        : pos <= 3 ? 'rgba(255,255,255,0.04)' : 'var(--bg-card)',
                      border: esYo
                        ? `1px solid ${(ligaSeleccionada ?? ligaActual).border}`
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
                        border: esYo ? `2px solid ${(ligaSeleccionada ?? ligaActual).color}` : '1px solid rgba(255,255,255,0.1)',
                      }}
                    />

                    {/* Nombre */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/perfil/${u.username}`}
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
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{nivelInfo.emoji} {nivelInfo.titulo}</span>
                        {esGeneral && (
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700,
                            color: getLigaActual(u.puntos).color,
                            opacity: 0.8,
                          }}>
                            · {getLigaActual(u.puntos).emoji} {getLigaActual(u.puntos).nombre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats — orden cambia según tab */}
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: esLibros ? '#4a9e7a' : '#fff', fontSize: esLibros ? '1rem' : '0.9rem' }}>
                          📚 {u.total_leidos}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>leídos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: esLibros ? 600 : 800, color: esLibros ? 'rgba(212,175,55,0.6)' : '#d4af37', fontSize: '0.9rem' }}>
                          ⭐ {u.puntos}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>puntos</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
