'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Duelo, StatsGlobales, StatsRival } from '@/lib/dao/dueloDAO'
import type { Carta } from '@/lib/cartas'
import type { MisionConProgreso } from '@/lib/dao/misionDAO'
import type { RetoAmigo } from '@/lib/dao/retoDAO'
import type { BingoCasilla } from '@/lib/dao/bingoDAO'
import type { Libro } from '@/lib/dao/libroDAO'
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
  // Arena
  usuarioId: number
  salaInicial: Duelo[]
  dueloActivoInicial: Duelo | null
  historialInicial: Duelo[]
  misCartas: Carta[]
  cartasMap: Record<string, Carta>
  statsIniciales: StatsGlobales
  statsPorRivalIniciales: StatsRival[]
  // Desafíos
  misiones: MisionConProgreso[]
  puntos: number
  retos: RetoAmigo[]
  bingo: BingoCasilla[]
  misLibros: Libro[]
}

export default function ArenaConTabs({
  tabInicial,
  usuarioId, salaInicial, dueloActivoInicial, historialInicial, misCartas, cartasMap, statsIniciales, statsPorRivalIniciales,
  misiones, puntos, retos, bingo, misLibros,
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
        <div className="container py-5">
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
