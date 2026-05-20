'use client'

import { useState } from 'react'
import type { BingoCasilla } from '@/lib/dao/bingoDAO'
import type { Libro } from '@/lib/dao/libroDAO'

interface Props {
  bingo: BingoCasilla[]
  misLibros: Libro[]
}

export default function BingoClient({ bingo: bingoIni, misLibros }: Props) {
  const [bingo, setBingo] = useState(bingoIni)
  const [seleccionada, setSeleccionada] = useState<BingoCasilla | null>(null)
  const [libroSeleccionado, setLibroSeleccionado] = useState('')

  const completadas = bingo.filter(c => c.completado).length
  const totalCasillas = bingo.length
  const pct = totalCasillas > 0 ? Math.round((completadas / totalCasillas) * 100) : 0

  async function marcarCasilla() {
    if (!seleccionada || !libroSeleccionado) return
    const res = await fetch('/api/bingo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retoId: seleccionada.id, libroId: libroSeleccionado }),
    })
    if (res.ok) {
      setBingo(prev => prev.map(c =>
        c.id === seleccionada.id ? { ...c, completado: true, libro_id: Number(libroSeleccionado) } : c
      ))
      setSeleccionada(null)
      setLibroSeleccionado('')
    }
  }

  const grid: (BingoCasilla | undefined)[] = Array(25).fill(undefined)
  bingo.forEach(c => { grid[c.posicion] = c })

  return (
    <div className="container py-5">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="font-title display-5 mb-1">🎲 Bingo Literario</h1>
          <p className="text-muted">
            Completá desafíos de lectura y gana <strong style={{ color: 'var(--accent-gold)' }}>recompensas épicas</strong>.
          </p>
        </div>

        {/* Progreso global */}
        <div className="card px-4 py-3 text-center" style={{ minWidth: 180 }}>
          <i className="bi bi-info-circle me-1 text-muted" />
          <span className="text-muted small">Haz clic en una casilla para marcar tu progreso</span>
        </div>
      </div>

      {/* Progreso bar */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div className="flex-grow-1" style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
            borderRadius: 99, transition: 'width 0.5s',
          }} />
        </div>
        <span className="fw-bold" style={{ color: 'var(--accent-gold)', whiteSpace: 'nowrap' }}>
          {completadas} / {totalCasillas}
        </span>
      </div>

      {/* ── Grilla 5×5 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        maxWidth: 750,
        margin: '0 auto',
      }}>
        {grid.map((casilla, i) => {
          if (!casilla) {
            return (
              <div key={i} style={{
                aspectRatio: '1',
                minHeight: 90,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
              }} />
            )
          }

          const done = casilla.completado

          return (
            <button
              key={casilla.id}
              onClick={() => !done && setSeleccionada(casilla)}
              disabled={done}
              style={{
                aspectRatio: '1',
                minHeight: 90,
                background: done ? 'rgba(212,175,55,0.12)' : 'var(--bg-card)',
                border: done
                  ? '2px solid var(--accent-gold)'
                  : '1px solid rgba(212,175,55,0.25)',
                borderRadius: 12,
                cursor: done ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.5rem',
                transition: 'all 0.2s',
              }}
              className={done ? '' : 'bingo-hover'}
            >
              {/* Checkbox icon */}
              <i
                className={done ? 'bi bi-check-square-fill' : 'bi bi-square'}
                style={{
                  fontSize: '1.5rem',
                  color: done ? 'var(--accent-gold)' : 'rgba(212,175,55,0.35)',
                  lineHeight: 1,
                }}
              />
              {/* Texto */}
              <span style={{
                fontSize: '0.62rem',
                lineHeight: 1.25,
                color: done ? 'var(--accent-gold)' : 'var(--text-muted)',
                textAlign: 'center',
                fontWeight: done ? 700 : 400,
                maxWidth: '95%',
              }}>
                {casilla.titulo_reto}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Modal: completar casilla ── */}
      {seleccionada && (
        <div className="modal-overlay" onClick={() => { setSeleccionada(null); setLibroSeleccionado('') }}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>
                Completar casilla
              </h5>
              <button
                onClick={() => { setSeleccionada(null); setLibroSeleccionado('') }}
                className="btn-close btn-close-white"
              />
            </div>

            <div className="mb-3 p-3 rounded" style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--accent-gold)' }}>
              <p className="text-white mb-0 small fw-bold">{seleccionada.titulo_reto}</p>
            </div>

            <p className="text-muted small mb-3">
              Seleccioná el libro con el que cumpliste este reto:
            </p>

            <select
              className="form-select mb-4"
              value={libroSeleccionado}
              onChange={e => setLibroSeleccionado(e.target.value)}
            >
              <option value="">— Seleccionar libro —</option>
              {misLibros.filter(l => l.estado === 'LEIDO').map(l => (
                <option key={l.id} value={l.id}>{l.titulo}</option>
              ))}
            </select>

            <div className="d-flex gap-2">
              <button
                onClick={marcarCasilla}
                disabled={!libroSeleccionado}
                className="btn-gold flex-fill"
              >
                ✓ Marcar como completada
              </button>
              <button
                onClick={() => { setSeleccionada(null); setLibroSeleccionado('') }}
                className="btn btn-outline-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
