'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Duelo, StatsGlobales, StatsRival } from '@/lib/dao/dueloDAO'
import type { Carta } from '@/lib/cartas'
import type { MisionConProgreso } from '@/lib/dao/misionDAO'
import type { RetoAmigo } from '@/lib/dao/retoDAO'
import type { BingoCasilla } from '@/lib/dao/bingoDAO'
import type { Libro } from '@/lib/dao/libroDAO'
import type { EstadoLigaArena, UsuarioLigaArena } from '@/lib/dao/ligaArenaDAO'
import type { LigaArena } from '@/lib/ligasArena'
import { getLigaArena, getLigaArenaSiguiente } from '@/lib/ligasArena'
import ArenaClient from './ArenaClient'
import MisionesClient from '@/app/misiones/MisionesClient'
import RetosClient from '@/app/retos/RetosClient'
import BingoClient from '@/app/bingo/BingoClient'

type Tab = 'arena' | 'misiones' | 'retos' | 'bingo'

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'arena',    label: 'Arena',    emoji: '⚔️' },
  { key: 'misiones', label: 'Misiones', emoji: '🎯' },
  { key: 'retos',    label: 'Retos',    emoji: '🤝' },
  { key: 'bingo',    label: 'Bingo',    emoji: '🎲' },
]

interface Props {
  tabInicial: Tab
  usuarioId: number
  salaInicial: Duelo[]
  dueloActivoInicial: Duelo | null
  historialInicial: Duelo[]
  misCartas: Carta[]
  cartasMap: Record<string, Carta>
  statsIniciales: StatsGlobales
  statsPorRivalIniciales: StatsRival[]
  misiones: MisionConProgreso[]
  puntos: number
  retos: RetoAmigo[]
  bingo: BingoCasilla[]
  misLibros: Libro[]
  estadoLiga: EstadoLigaArena
  rankingLiga: UsuarioLigaArena[]
  todasLasLigas: LigaArena[]
}

// ── Sidebar de liga (sticky) ─────────────────────────────────────────────────

function SidebarLiga({ estado, ranking, todasLasLigas, usuarioId }: {
  estado: EstadoLigaArena
  ranking: UsuarioLigaArena[]
  todasLasLigas: LigaArena[]
  usuarioId: number
}) {
  const liga = getLigaArena(estado.liga)
  const siguiente = getLigaArenaSiguiente(estado.liga)
  const [ligaVista, setLigaVista] = useState(estado.liga)
  const ligaV = getLigaArena(ligaVista)

  const progreso = siguiente && liga.puntosMeta
    ? Math.min(100, Math.round((estado.puntos_arena / liga.puntosMeta) * 100))
    : 100

  const TOTAL_SERIE = 3

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      position: 'sticky', top: 60, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 75px)', overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: `${liga.color}40 transparent`,
    }}>
      <div style={{
        background: `linear-gradient(160deg, ${liga.colorBg} 0%, rgba(0,0,0,0.4) 100%)`,
        border: `1px solid ${liga.border}`,
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Cabecera: liga actual */}
        <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: `1px solid ${liga.border}40` }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', margin: '0 0 0.35rem', textTransform: 'uppercase', letterSpacing: 1 }}>Tu liga</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{liga.emoji}</span>
            <span style={{ color: liga.color, fontWeight: 800, fontSize: '1.2rem' }}>{liga.nombre}</span>
          </div>

          {/* Progreso o serie */}
          {!estado.en_promocion ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 4 }}>
                <span style={{ color: liga.color, fontWeight: 700 }}>{estado.puntos_arena} pts</span>
                {siguiente && liga.puntosMeta
                  ? <span style={{ color: 'rgba(255,255,255,0.35)' }}>meta {liga.puntosMeta}</span>
                  : <span style={{ color: liga.color }}>👑 Máx</span>
                }
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', width: `${progreso}%`,
                  background: `linear-gradient(90deg, ${liga.color}80, ${liga.color})`,
                  borderRadius: 99, transition: 'width 0.6s ease',
                }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.6rem', margin: 0 }}>
                {siguiente ? '+10 victoria · -10 derrota' : 'Puntos acumulados'}
              </p>
            </>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${siguiente?.border ?? liga.border}`, borderRadius: 10, padding: '0.6rem 0.75rem' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem', margin: '0 0 0.5rem' }}>
                ⚔️ Serie → {siguiente?.emoji} {siguiente?.nombre}
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[...Array(TOTAL_SERIE)].map((_, i) => {
                  const jugado = i < estado.duelos_promocion
                  const victoria = jugado && i < estado.victorias_promocion
                  const derrota = jugado && !victoria
                  return (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                      background: victoria ? 'rgba(39,174,96,0.25)' : derrota ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.06)',
                      border: victoria ? '2px solid #27ae60' : derrota ? '2px solid #e74c3c' : '2px solid rgba(255,255,255,0.15)',
                    }}>
                      {victoria ? '✓' : derrota ? '✗' : '?'}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selector de liga */}
        <div style={{ padding: '0.75rem 1rem 0.5rem', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Ranking por liga</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {todasLasLigas.map(l => (
              <button
                key={l.key}
                onClick={() => setLigaVista(l.key)}
                title={l.nombre}
                style={{
                  padding: '0.2rem 0.55rem', borderRadius: 20, cursor: 'pointer',
                  border: ligaVista === l.key ? `1px solid ${l.border}` : '1px solid rgba(255,255,255,0.08)',
                  background: ligaVista === l.key ? l.colorBg : 'rgba(255,255,255,0.03)',
                  color: ligaVista === l.key ? l.color : 'rgba(255,255,255,0.35)',
                  fontWeight: ligaVista === l.key ? 700 : 500,
                  fontSize: '0.72rem',
                  transition: 'all 0.15s',
                }}
              >
                {l.emoji} {l.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de ranking */}
        <div style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
          {ranking.filter(u => u.liga_arena === ligaVista).length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem 0', margin: 0 }}>
              Sin jugadores aún
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ranking
                .filter(u => u.liga_arena === ligaVista)
                .sort((a, b) => b.puntos_arena - a.puntos_arena)
                .slice(0, 10)
                .map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: u.id === usuarioId ? `${ligaV.colorBg}` : 'rgba(255,255,255,0.02)',
                    border: u.id === usuarioId ? `1px solid ${ligaV.border}` : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, padding: '0.35rem 0.5rem',
                  }}>
                    <span style={{
                      color: i === 0 ? '#d4af37' : i === 1 ? '#b0b8c1' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.25)',
                      fontWeight: 700, fontSize: '0.68rem', width: 16, textAlign: 'center', flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: `${ligaV.color}25`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.62rem', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : '👤'}
                    </div>
                    <span style={{
                      color: u.id === usuarioId ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontWeight: u.id === usuarioId ? 700 : 400,
                      fontSize: '0.72rem', flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {u.nombre}{u.id === usuarioId ? ' 👈' : ''}
                    </span>
                    <span style={{ color: ligaV.color, fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                      {u.puntos_arena}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ArenaConTabs({
  tabInicial,
  usuarioId, salaInicial, dueloActivoInicial, historialInicial, misCartas, cartasMap, statsIniciales, statsPorRivalIniciales,
  misiones, puntos, retos, bingo, misLibros,
  estadoLiga, rankingLiga, todasLasLigas,
}: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial)
  const router = useRouter()
  const pathname = usePathname()

  function cambiarTab(t: Tab) {
    setTab(t)
    const url = t === 'arena' ? pathname : `${pathname}?tab=${t}`
    router.replace(url, { scroll: false })
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '1rem 1.25rem', justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(20,10,40,0.95) 0%, rgba(10,5,25,0.9) 100%)',
        borderBottom: '2px solid rgba(124,58,237,0.35)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(124,58,237,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)',
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => cambiarTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              borderRadius: 12,
              border: tab === t.key ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: '0.88rem',
              background: tab === t.key
                ? 'linear-gradient(135deg, rgba(124,58,237,0.45) 0%, rgba(99,46,196,0.35) 100%)'
                : 'rgba(255,255,255,0.04)',
              color: tab === t.key ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
              boxShadow: tab === t.key ? '0 0 18px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
              transition: 'all 0.18s',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Arena: sidebar + contenido ── */}
      {tab === 'arena' && (
        <div style={{
          display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
          maxWidth: 1200, margin: '0 auto', padding: '1rem 1rem 1.5rem',
        }}>
          {/* Sidebar liga — oculta en mobile */}
          <div className="liga-sidebar-wrapper" style={{ flexShrink: 0 }}>
            <SidebarLiga
              estado={estadoLiga}
              ranking={rankingLiga}
              todasLasLigas={todasLasLigas}
              usuarioId={usuarioId}
            />
          </div>

          {/* Contenido arena */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ArenaClient
              usuarioId={usuarioId}
              salaInicial={salaInicial}
              dueloActivoInicial={dueloActivoInicial}
              historialInicial={historialInicial}
              misCartas={misCartas}
              cartasMap={cartasMap}
              statsIniciales={statsIniciales}
              statsPorRivalIniciales={statsPorRivalIniciales}
            />
          </div>
        </div>
      )}

      {tab === 'misiones' && (
        <div className="container py-5">
          <MisionesClient misionesIniciales={misiones} puntos={puntos} />
        </div>
      )}
      {tab === 'retos' && (
        <div className="container py-5">
          <RetosClient retos={retos} misLibros={misLibros} usuarioId={usuarioId} />
        </div>
      )}
      {tab === 'bingo' && (
        <div className="container py-5">
          <BingoClient bingo={bingo} misLibros={misLibros} />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .liga-sidebar-wrapper {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
