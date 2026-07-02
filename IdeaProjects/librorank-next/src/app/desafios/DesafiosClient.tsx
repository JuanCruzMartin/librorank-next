'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MisionConProgreso } from '@/lib/dao/misionDAO'
import type { RetoAmigo } from '@/lib/dao/retoDAO'
import type { BingoCasilla } from '@/lib/dao/bingoDAO'
import type { Libro } from '@/lib/dao/libroDAO'
import MisionesClient from '@/app/misiones/MisionesClient'
import RetosClient from '@/app/retos/RetosClient'
import BingoClient from '@/app/bingo/BingoClient'

type Tab = 'misiones' | 'retos' | 'bingo'

const TABS: { key: Tab; label: string; emoji: string; descripcion: string }[] = [
  { key: 'misiones', label: 'Misiones',  emoji: '🎯', descripcion: 'Desafíos diarios, semanales y permanentes' },
  { key: 'retos',    label: 'Retos',     emoji: '⚔️', descripcion: 'Competí con tus amigos' },
  { key: 'bingo',    label: 'Bingo',     emoji: '🎲', descripcion: 'Completá el tablero lector' },
]

interface Props {
  tabInicial: Tab
  misiones: MisionConProgreso[]
  puntos: number
  retos: RetoAmigo[]
  bingo: BingoCasilla[]
  misLibros: Libro[]
  usuarioId: number
}

export default function DesafiosClient({ tabInicial, misiones, puntos, retos, bingo, misLibros, usuarioId }: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial)
  const router = useRouter()

  function cambiarTab(t: Tab) {
    setTab(t)
    router.replace(`/desafios?tab=${t}`, { scroll: false })
  }

  return (
    <div className="container py-5">

      <div className="text-center mb-5">
        <h1 className="font-title display-5 mb-2">⚔️ Desafíos</h1>
        <p className="text-muted">Misiones, retos y bingo lector — todo en un lugar.</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-3 justify-content-center mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => cambiarTab(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
              padding: '0.9rem 1.8rem',
              borderRadius: 16,
              border: tab === t.key ? '2px solid #d4af37' : '2px solid rgba(255,255,255,0.08)',
              background: tab === t.key ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
              color: tab === t.key ? '#d4af37' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 140,
            }}
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{t.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.label}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.65, textAlign: 'center' }}>{t.descripcion}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'misiones' && (
        <MisionesClient misionesIniciales={misiones} puntos={puntos} />
      )}
      {tab === 'retos' && (
        <RetosClient retos={retos} misLibros={misLibros} usuarioId={usuarioId} />
      )}
      {tab === 'bingo' && (
        <BingoClient bingo={bingo} misLibros={misLibros} />
      )}
    </div>
  )
}
