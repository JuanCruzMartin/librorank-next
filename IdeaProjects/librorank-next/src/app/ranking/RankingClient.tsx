'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getNivelLector } from '@/lib/nivelUtils'
import { getLiga } from '@/lib/ligas'

export const getLigaActual = getLiga

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UsuarioRanking {
  id: number
  nombre: string
  username: string
  puntos: number
  total_leidos: number
  total_paginas: number
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

interface AutorRanking {
  autor: string
  lectores: number
  total_lecturas: number
}

interface Props {
  ranking: UsuarioRanking[]
  rankingSemanal: UsuarioSemanal[]
  rankingAutores: AutorRanking[]
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

type TabKey = 'paginas' | 'libros' | 'semanal' | 'autores'

const TABS: { key: TabKey; label: string; emoji: string; color: string }[] = [
  { key: 'paginas',  label: 'Páginas leídas', emoji: '📄', color: '#3498db' },
  { key: 'libros',   label: 'Libros leídos',  emoji: '📚', color: '#4a9e7a' },
  { key: 'semanal',  label: 'Esta semana',     emoji: '🔥', color: '#e91e8c' },
  { key: 'autores',  label: 'Escritores',      emoji: '✍️', color: '#9b59b6' },
]

export default function RankingClient({ ranking, rankingSemanal, rankingAutores, usuarioId, puntosUsuario }: Props) {
  const ligaActual = getLigaActual(puntosUsuario)

  const [tab, setTab] = useState<TabKey>('paginas')

  const esPaginas  = tab === 'paginas'
  const esLibros   = tab === 'libros'
  const esSemanal  = tab === 'semanal'
  const esAutores  = tab === 'autores'

  const usuariosOrdenados = esPaginas
    ? [...ranking].sort((a, b) => b.total_paginas - a.total_paginas)
    : esLibros
      ? [...ranking].sort((a, b) => b.total_leidos - a.total_leidos)
      : ranking

  const tabInfo = TABS.find(t => t.key === tab)!

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
                color: ligaActual.color, marginBottom: '1rem',
              }}>
                {ligaActual.emoji} Tu liga: {ligaActual.nombre}
              </div>

              <h1 className="font-title display-5 mb-2" style={{ color: '#fff' }}>
                🏆 Ranking Global
              </h1>
              <p className="text-muted" style={{ fontSize: '1rem' }}>
                Competí con lectores de toda la comunidad. Leé más, subí de liga.
              </p>
            </div>

            {/* Tus stats rápidos */}
            <div className="col-md-6">
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                maxWidth: 360, marginLeft: 'auto',
              }}>
                {[
                  { label: 'Tu liga',           value: `${ligaActual.emoji} ${ligaActual.nombre}`, color: ligaActual.color },
                  { label: 'Total lectores',    value: `👥 ${ranking.length}`,                  color: '#fff' },
                  { label: 'Páginas leídas',    value: `📄 ${(ranking.find(u => u.id === usuarioId)?.total_paginas ?? 0).toLocaleString('es-AR')}`, color: '#3498db' },
                  { label: 'Libros leídos',     value: `📚 ${ranking.find(u => u.id === usuarioId)?.total_leidos ?? 0}`, color: '#4a9e7a' },
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
          {TABS.map(t => {
            const activa = t.key === tab
            const count = t.key === 'semanal' ? rankingSemanal.length : t.key === 'autores' ? rankingAutores.length : ranking.length
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: activa ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                  border: activa ? `2px solid ${t.color}80` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '0.45rem 1.1rem',
                  fontSize: '0.82rem', fontWeight: 700,
                  color: activa ? t.color : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {t.emoji} {t.label}
                <span style={{
                  background: activa ? `${t.color}33` : 'rgba(255,255,255,0.08)',
                  color: activa ? t.color : 'rgba(255,255,255,0.4)',
                  borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Descripción del tab */}
        {!esAutores && (
          <div style={{
            background: `${tabInfo.color}0f`,
            border: `1px solid ${tabInfo.color}33`,
            borderRadius: 12, padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{tabInfo.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: tabInfo.color, fontSize: '0.9rem' }}>
                {esPaginas ? 'Ranking — Por páginas leídas' : esLibros ? 'Ranking — Por libros leídos' : 'Ranking Semanal — Últimos 7 días'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                {esSemanal ? `${rankingSemanal.length} lectores activos · reinicia el lunes` : `${ranking.length} lectores en total`}
              </div>
            </div>
            {esSemanal && (
              <div style={{
                background: 'rgba(233,30,140,0.12)', border: '1px solid rgba(233,30,140,0.3)',
                borderRadius: 8, padding: '0.35rem 0.75rem',
                fontSize: '0.68rem', fontWeight: 700, color: '#e91e8c',
                textAlign: 'center', flexShrink: 0,
              }}>
                ⏰ {horasParaReset()} para reset
              </div>
            )}
          </div>
        )}

        {/* ── Escritores ── */}
        {esAutores && (
          <div>
            <div style={{ background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', borderRadius: 12, padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>✍️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#9b59b6', fontSize: '0.9rem' }}>Escritores más leídos</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Los autores con más lectores únicos en la comunidad</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankingAutores.map((a, i) => (
                <div key={a.autor} style={{
                  background: i === 0 ? 'rgba(212,175,55,0.06)' : i === 1 ? 'rgba(192,192,192,0.05)' : i === 2 ? 'rgba(205,127,50,0.05)' : 'rgba(255,255,255,0.02)',
                  border: i === 0 ? '1px solid rgba(212,175,55,0.2)' : i === 1 ? '1px solid rgba(192,192,192,0.15)' : i === 2 ? '1px solid rgba(205,127,50,0.15)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12, padding: '0.75rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}><Medal pos={i + 1} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.autor}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9b59b6' }}>{a.lectores}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>lectores</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{a.total_lecturas}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>lecturas</div>
                    </div>
                  </div>
                </div>
              ))}
              {rankingAutores.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '3rem 0' }}>Todavía no hay datos suficientes.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Ranking Semanal ── */}
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
                  <div key={u.id} style={{
                    background: esYo ? 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(233,30,140,0.04))' : pos <= 3 ? 'rgba(255,255,255,0.04)' : 'var(--bg-card)',
                    border: esYo ? '1px solid rgba(233,30,140,0.35)' : pos <= 3 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '0.65rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    transition: 'transform 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  >
                    <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}><Medal pos={pos} /></div>
                    <img src={u.avatar_url || '/default-avatar.svg'} alt={u.username} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${esYo ? '#e91e8c' : medalColor}` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <Link href={`/perfil/${u.username}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</Link>
                        {esYo && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(233,30,140,0.2)', color: '#e91e8c', borderRadius: 20, padding: '1px 6px', border: '1px solid rgba(233,30,140,0.3)', flexShrink: 0 }}>Vos</span>}
                        {u.es_amigo && <span className="ranking-amigo-badge" style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(39,174,96,0.15)', color: '#27ae60', borderRadius: 20, padding: '1px 6px', border: '1px solid rgba(39,174,96,0.3)', flexShrink: 0 }}>amigo</span>}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                        {getNivelLector(u.puntos).emoji} {getNivelLector(u.puntos).titulo}
                      </div>
                    </div>
                    <div className="ranking-row-stats" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#e91e8c', fontSize: '1rem' }}>📚 {u.libros_semana}</div>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>semana</div>
                      </div>
                      <div className="ranking-pts-col" style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'rgba(212,175,55,0.55)', fontSize: '0.82rem' }}>⭐ {u.puntos}</div>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>pts</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── Tabla General / Páginas / Libros ── */}
        {!esSemanal && !esAutores && (
          usuariosOrdenados.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <p className="text-muted">Todavía no hay lectores.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {usuariosOrdenados.map((u, i) => {
                const pos = i + 1
                const nivelInfo = getNivelLector(u.puntos)
                const esYo = u.id === usuarioId
                return (
                  <div key={u.id} style={{
                    background: esYo
                      ? `linear-gradient(135deg, ${ligaActual.color}12, ${ligaActual.color}06)`
                      : pos <= 3 ? 'rgba(255,255,255,0.04)' : 'var(--bg-card)',
                    border: esYo ? `1px solid ${ligaActual.border}` : pos <= 3 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '0.65rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    transition: 'transform 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  >
                    <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}><Medal pos={pos} /></div>
                    <img src={u.avatar_url || '/default-avatar.svg'} alt={u.username} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: esYo ? `2px solid ${ligaActual.color}` : '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <Link href={`/perfil/${u.username}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</Link>
                        {esYo && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(212,175,55,0.2)', color: '#d4af37', borderRadius: 20, padding: '1px 6px', border: '1px solid rgba(212,175,55,0.3)', flexShrink: 0 }}>Vos</span>}
                        {u.es_amigo && <span className="ranking-amigo-badge" style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(39,174,96,0.15)', color: '#27ae60', borderRadius: 20, padding: '1px 6px', border: '1px solid rgba(39,174,96,0.3)', flexShrink: 0 }}>amigo</span>}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: 1, display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <span>{nivelInfo.emoji} {nivelInfo.titulo}</span>
                      </div>
                    </div>
                    <div className="ranking-row-stats" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                      {esPaginas && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, color: '#3498db', fontSize: '0.9rem' }}>📄 {u.total_paginas?.toLocaleString('es-AR') ?? 0}</div>
                          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>páginas</div>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: esLibros ? '#4a9e7a' : 'rgba(255,255,255,0.5)', fontSize: esPaginas ? '0.78rem' : '0.9rem' }}>📚 {u.total_leidos}</div>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>leídos</div>
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
