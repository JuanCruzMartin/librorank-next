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

function PanelLiga({ estado, ranking, todasLasLigas, usuarioId }: {
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
    <div style={{
      background: `linear-gradient(135deg, ${liga.colorBg} 0%, rgba(0,0,0,0.3) 100%)`,
      border: `1px solid ${liga.border}`,
      borderRadius: 18, padding: '1.5rem', marginBottom: '2rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{liga.emoji}</span>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Tu liga</p>
              <h3 style={{ color: liga.color, fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>{liga.nombre}</h3>
            </div>
          </div>
        </div>

        {/* Puntos + progreso */}
        {!estado.en_promocion && (
          <div style={{ minWidth: 200, flex: 1, maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 4 }}>
              <span style={{ color: liga.color, fontWeight: 700 }}>{estado.puntos_arena} pts</span>
              {siguiente && liga.puntosMeta
                ? <span style={{ color: 'rgba(255,255,255,0.4)' }}>Meta: {liga.puntosMeta} pts</span>
                : <span style={{ color: liga.color }}>👑 Máxima liga</span>
              }
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progreso}%`,
                background: `linear-gradient(90deg, ${liga.color}99, ${liga.color})`,
                borderRadius: 99, transition: 'width 0.6s ease',
              }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: 4 }}>
              {siguiente ? `+10 por victoria, -10 por derrota — llegá a ${liga.puntosMeta} para entrar en serie` : 'Los puntos se acumulan sin límite'}
            </p>
          </div>
        )}
      </div>

      {/* Serie de promoción */}
      {estado.en_promocion && (
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${siguiente?.border ?? liga.border}`,
          borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
            ⚔️ Serie de promoción — subís a {siguiente?.emoji} {siguiente?.nombre}
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[...Array(TOTAL_SERIE)].map((_, i) => {
              const jugado = i < estado.duelos_promocion
              const victoria = jugado && i < estado.victorias_promocion
              const derrota = jugado && i >= estado.victorias_promocion
              return (
                <div key={i} style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                  background: victoria ? 'rgba(39,174,96,0.25)' : derrota ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.06)',
                  border: victoria ? '2px solid #27ae60' : derrota ? '2px solid #e74c3c' : '2px solid rgba(255,255,255,0.15)',
                }}>
                  {victoria ? '✓' : derrota ? '✗' : '?'}
                </div>
              )
            })}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: 0 }}>
              Necesitás {3 - estado.victorias_promocion > 0 ? `ganar ${3 - estado.victorias_promocion} más` : '¡listo para subir!'}
            </p>
          </div>
        </div>
      )}

      {/* Selector de ligas + ranking */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {todasLasLigas.map(l => (
            <button
              key={l.key}
              onClick={() => setLigaVista(l.key)}
              style={{
                padding: '0.3rem 0.85rem', borderRadius: 20, cursor: 'pointer',
                border: ligaVista === l.key ? `1px solid ${l.border}` : '1px solid rgba(255,255,255,0.1)',
                background: ligaVista === l.key ? l.colorBg : 'rgba(255,255,255,0.04)',
                color: ligaVista === l.key ? l.color : 'rgba(255,255,255,0.4)',
                fontWeight: ligaVista === l.key ? 700 : 500, fontSize: '0.78rem',
                transition: 'all 0.15s',
              }}
            >
              {l.emoji} {l.nombre}
            </button>
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', margin: '0 0 0.75rem' }}>
          Top jugadores en {ligaV.emoji} {ligaV.nombre}
        </p>

        {ranking.filter(u => u.liga_arena === ligaVista).length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
            Aún no hay jugadores en esta liga
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ranking
              .filter(u => u.liga_arena === ligaVista)
              .sort((a, b) => b.puntos_arena - a.puntos_arena)
              .slice(0, 10)
              .map((u, i) => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: u.id === usuarioId ? `${ligaV.colorBg}` : 'rgba(255,255,255,0.03)',
                  border: u.id === usuarioId ? `1px solid ${ligaV.border}` : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '0.5rem 0.75rem',
                }}>
                  <span style={{ color: i < 3 ? ['#d4af37','#b0b8c1','#cd7f32'][i] : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.8rem', width: 20, textAlign: 'center' }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ligaV.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', overflow: 'hidden', flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '👤'}
                  </div>
                  <span style={{ color: u.id === usuarioId ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: u.id === usuarioId ? 700 : 500, fontSize: '0.82rem', flex: 1 }}>
                    {u.nombre} {u.id === usuarioId && '(vos)'}
                  </span>
                  <span style={{ color: ligaV.color, fontWeight: 700, fontSize: '0.82rem' }}>
                    {u.puntos_arena} pts
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

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

      {/* Contenido */}
      {tab === 'arena' && (
        <div className="container py-4">
          <PanelLiga
            estado={estadoLiga}
            ranking={rankingLiga}
            todasLasLigas={todasLasLigas}
            usuarioId={usuarioId}
          />
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
    </div>
  )
}
