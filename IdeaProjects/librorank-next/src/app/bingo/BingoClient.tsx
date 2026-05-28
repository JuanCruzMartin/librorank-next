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

  // Modal marcar
  const [seleccionada, setSeleccionada] = useState<BingoCasilla | null>(null)
  const [libroSeleccionado, setLibroSeleccionado] = useState('')
  const [nota, setNota] = useState('')
  const [marcando, setMarcando] = useState(false)

  // Modal detalle (casilla ya completada)
  const [detalle, setDetalle] = useState<BingoCasilla | null>(null)

  const completadas = bingo.filter(c => c.completado).length
  const totalCasillas = bingo.length
  const pct = totalCasillas > 0 ? Math.round((completadas / totalCasillas) * 100) : 0

  async function marcarCasilla() {
    if (!seleccionada || !libroSeleccionado || marcando) return
    setMarcando(true)
    try {
      const libroObj = misLibros.find(l => l.id === Number(libroSeleccionado))
      const res = await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retoId: seleccionada.id, libroId: libroSeleccionado, nota: nota || null }),
      })
      if (res.ok) {
        setBingo(prev => prev.map(c =>
          c.id === seleccionada.id ? {
            ...c,
            completado: true,
            libro_id: Number(libroSeleccionado),
            nota: nota || null,
            libro_titulo: libroObj?.titulo ?? null,
            libro_autor: libroObj?.autor ?? null,
            libro_estrellas: libroObj?.estrellas ?? null,
            libro_resena: libroObj?.resena ?? null,
            libro_portada: libroObj?.portada_url ?? null,
          } : c
        ))
        setSeleccionada(null)
        setLibroSeleccionado('')
        setNota('')
      }
    } finally {
      setMarcando(false)
    }
  }

  const grid: (BingoCasilla | undefined)[] = Array(25).fill(undefined)
  bingo.forEach(c => { grid[c.posicion] = c })

  // Calcular progreso de cada línea (filas, columnas, diagonales)
  const completadasSet = new Set(bingo.filter(c => c.completado).map(c => c.posicion))
  const lineas = [
    // 5 filas
    [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
    // 5 columnas
    [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
    // 2 diagonales
    [0,6,12,18,24], [4,8,12,16,20],
  ]
  const lineasCompletas = lineas.filter(l => l.every(p => completadasSet.has(p))).length
  // Líneas más cercanas a completarse (orden descendente por casillas completadas)
  const proximaLinea = lineas
    .map(l => ({ count: l.filter(p => completadasSet.has(p)).length, total: 5 }))
    .sort((a, b) => b.count - a.count)[0]

  return (
    <div className="container py-5">

      {/* ── Hero: ¿Qué es el Bingo? ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(243,156,18,0.08), rgba(243,156,18,0.02))',
        border: '1px solid rgba(243,156,18,0.2)',
        borderRadius: 18,
        padding: '1.75rem',
        marginBottom: '2rem',
      }}>
        <div className="d-flex align-items-start gap-4 flex-wrap">
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 className="font-title mb-1" style={{ fontSize: '1.8rem' }}>🎲 Bingo Literario</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              Un tablero de <strong style={{ color: '#fff' }}>25 casillas</strong>, cada una con una categoría de libro
              (un clásico, un libro de más de 500 páginas, una novela gráfica...).
              Cuando leés un libro que cumple esa categoría, <strong style={{ color: '#f39c12' }}>lo marcás y ganás puntos</strong>.
              Completá filas y columnas para bonos extra — y si completás todo el tablero, desbloqueás el logro <strong style={{ color: '#f39c12' }}>BINGO MASTER</strong> 👑
            </p>

            {/* Progreso bar */}
            <div className="d-flex align-items-center gap-3">
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
                  borderRadius: 99, transition: 'width 0.5s',
                }} />
              </div>
              <span style={{ fontWeight: 700, color: '#d4af37', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                {completadas}/{totalCasillas} ({pct}%)
              </span>
            </div>
            {proximaLinea && proximaLinea.count < 5 && (
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem' }}>
                Mejor línea en progreso: {proximaLinea.count}/5 casillas completadas
              </p>
            )}
          </div>

          {/* Premios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 200 }}>
            {[
              { icon: '✅', label: 'Casilla completada', pts: '+10 pts', color: '#4cd137' },
              { icon: '🔥', label: 'Línea completa (fila/col)', pts: '+30 pts', color: '#f39c12' },
              { icon: '👑', label: 'Tablero completo', pts: '+100 pts + logro', color: '#d4af37' },
            ].map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '0.5rem 0.75rem',
                border: `1px solid ${p.color}25`,
              }}>
                <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                <span style={{ flex: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{p.label}</span>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: p.color, whiteSpace: 'nowrap' }}>{p.pts}</span>
              </div>
            ))}
            {lineasCompletas > 0 && (
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#d4af37', marginTop: '0.25rem' }}>
                🎉 {lineasCompletas} línea{lineasCompletas !== 1 ? 's' : ''} completada{lineasCompletas !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
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
          if (!casilla) return (
            <div key={i} style={{
              aspectRatio: '1', minHeight: 90,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
            }} />
          )

          const done = casilla.completado

          return (
            <button
              key={casilla.id}
              onClick={() => done ? setDetalle(casilla) : setSeleccionada(casilla)}
              style={{
                aspectRatio: '1', minHeight: 90,
                background: done ? 'rgba(212,175,55,0.1)' : 'var(--bg-card)',
                border: done ? '2px solid var(--accent-gold)' : '1px solid rgba(212,175,55,0.2)',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem', padding: '0.5rem',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              className={done ? 'bingo-done' : 'bingo-hover'}
            >
              {/* Icono */}
              <i
                className={done ? 'bi bi-check-square-fill' : 'bi bi-square'}
                style={{
                  fontSize: '1.3rem',
                  color: done ? 'var(--accent-gold)' : 'rgba(212,175,55,0.35)',
                  lineHeight: 1, flexShrink: 0,
                }}
              />

              {/* Texto del reto */}
              <span style={{
                fontSize: '0.58rem', lineHeight: 1.2,
                color: done ? 'var(--accent-gold)' : 'var(--text-muted)',
                textAlign: 'center', fontWeight: done ? 700 : 400,
                maxWidth: '95%',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {casilla.titulo_reto}
              </span>

              {/* Mini nombre del libro si está completada */}
              {done && casilla.libro_titulo && (
                <span style={{
                  fontSize: '0.5rem', lineHeight: 1.2,
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center', maxWidth: '95%',
                  display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  borderTop: '1px solid rgba(212,175,55,0.2)',
                  paddingTop: '0.2rem', marginTop: '0.1rem', width: '100%',
                }}>
                  📖 {casilla.libro_titulo}
                </span>
              )}

              {/* Hint "ver detalle" al hover en casillas completadas */}
              {done && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(212,175,55,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  fontSize: '0.6rem', color: '#d4af37', fontWeight: 700,
                }}
                  className="bingo-done-hover"
                >
                  👁 Ver libro
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Modal: completar casilla ── */}
      {seleccionada && (
        <div className="modal-overlay" onClick={() => { setSeleccionada(null); setLibroSeleccionado(''); setNota('') }}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>
                ✅ Completar casilla
              </h5>
              <button onClick={() => { setSeleccionada(null); setLibroSeleccionado(''); setNota('') }} className="btn-close btn-close-white" />
            </div>

            {/* Descripción de la casilla */}
            <div className="mb-4 p-3 rounded" style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.4)' }}>
              <p className="text-white mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{seleccionada.titulo_reto}</p>
            </div>

            {/* Seleccionar libro */}
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📚 ¿Con qué libro completaste esta casilla?
              </label>
              <select
                className="form-select"
                value={libroSeleccionado}
                onChange={e => setLibroSeleccionado(e.target.value)}
              >
                <option value="">— Seleccioná un libro leído —</option>
                {misLibros.filter(l => l.estado === 'LEIDO').map(l => (
                  <option key={l.id} value={l.id}>
                    {l.titulo}{l.autor ? ` — ${l.autor}` : ''}
                  </option>
                ))}
              </select>
              {misLibros.filter(l => l.estado === 'LEIDO').length === 0 && (
                <p className="text-muted small mt-2">No tenés libros marcados como Leído todavía.</p>
              )}
            </div>

            {/* Opinión opcional */}
            <div className="mb-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💬 Tu opinión (opcional)
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="¿Qué te pareció? ¿Cumplió bien con esta casilla?"
                value={nota}
                onChange={e => setNota(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={marcarCasilla}
                disabled={!libroSeleccionado || marcando}
                className="btn-gold flex-fill"
              >
                {marcando ? 'Guardando...' : '✓ Marcar como completada'}
              </button>
              <button onClick={() => { setSeleccionada(null); setLibroSeleccionado(''); setNota('') }} className="btn btn-outline-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: detalle casilla completada ── */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>
                ✅ Casilla completada
              </h5>
              <button onClick={() => setDetalle(null)} className="btn-close btn-close-white" />
            </div>

            {/* Descripción de la casilla */}
            <div className="mb-4 p-3 rounded" style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.4)' }}>
              <p className="text-white mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{detalle.titulo_reto}</p>
            </div>

            {/* Info del libro */}
            {detalle.libro_titulo ? (
              <div style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '1rem', marginBottom: '1rem',
              }}>
                {/* Portada */}
                {detalle.libro_portada ? (
                  <img
                    src={detalle.libro_portada.replace('http://', 'https://')}
                    alt={detalle.libro_titulo}
                    style={{ width: 60, height: 88, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 60, height: 88, background: '#2c2724', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    📚
                  </div>
                )}

                {/* Datos del libro */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {detalle.libro_titulo}
                  </div>
                  {detalle.libro_autor && (
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>
                      {detalle.libro_autor}
                    </div>
                  )}
                  {(detalle.libro_estrellas ?? 0) > 0 && (
                    <div style={{ fontSize: '0.85rem', letterSpacing: 2, marginBottom: '0.4rem' }}>
                      {'⭐'.repeat(detalle.libro_estrellas ?? 0)}
                    </div>
                  )}
                  {detalle.libro_resena && (
                    <div style={{
                      fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
                      lineHeight: 1.5, fontStyle: 'italic',
                      borderLeft: '2px solid rgba(212,175,55,0.3)',
                      paddingLeft: '0.6rem',
                    }}>
                      "{detalle.libro_resena}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted small mb-3">No se encontró el libro asociado.</p>
            )}

            {/* Opinión del bingo */}
            {detalle.nota && (
              <div style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 10, padding: '0.85rem',
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                  💬 Tu opinión
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {detalle.nota}
                </p>
              </div>
            )}

            <button onClick={() => setDetalle(null)} className="btn btn-outline-secondary w-100">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bingo-done:hover .bingo-done-hover { opacity: 1 !important; }
        .bingo-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,175,55,0.15); }
      `}</style>
    </div>
  )
}
