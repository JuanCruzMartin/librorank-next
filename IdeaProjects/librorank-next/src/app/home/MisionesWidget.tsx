'use client'

import { useState } from 'react'
import type { MisionConProgreso } from '@/lib/dao/misionDAO'

interface Props {
  misionesIniciales: MisionConProgreso[]
}

const TAB_LABELS: Record<string, string> = {
  mensual: 'Mes',
  semanal: 'Semana',
  permanente: 'Logros',
}

export default function MisionesWidget({ misionesIniciales }: Props) {
  const [misiones, setMisiones] = useState(misionesIniciales)
  const [tab, setTab] = useState<'mensual' | 'semanal' | 'permanente'>('semanal')
  const [reclamando, setReclamando] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const visibles = misiones.filter(m => m.tipo === tab)

  async function reclamar(m: MisionConProgreso) {
    if (reclamando || m.reclamada || !m.completada) return
    setReclamando(m.key)
    try {
      const res = await fetch('/api/misiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ misionKey: m.key }),
      })
      const data = await res.json()
      if (data.ok) {
        setMisiones(prev => prev.map(x => x.key === m.key ? { ...x, reclamada: true } : x))
        setToast(`+${data.puntos} puntos — ${m.nombre}`)
        setTimeout(() => setToast(null), 3000)
      }
    } finally {
      setReclamando(null)
    }
  }

  return (
    <div className="card p-3 mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="h6 mb-0 fw-bold text-white">🎯 Misiones</h3>
        <div className="d-flex gap-1">
          {(['semanal', 'mensual', 'permanente'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '2px 10px',
                fontSize: '0.7rem',
                borderRadius: 99,
                border: tab === t ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.12)',
                background: tab === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: tab === t ? '#d4af37' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontWeight: tab === t ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Missions list */}
      <div className="d-flex flex-column gap-2">
        {visibles.map(m => {
          const pct = Math.round((m.progreso / m.meta) * 100)
          const pendiente = m.completada && !m.reclamada

          return (
            <div
              key={m.key}
              style={{
                background: m.reclamada
                  ? 'rgba(255,255,255,0.03)'
                  : pendiente
                    ? 'rgba(212,175,55,0.06)'
                    : 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '10px 12px',
                border: pendiente
                  ? '1px solid rgba(212,175,55,0.35)'
                  : '1px solid rgba(255,255,255,0.06)',
                opacity: m.reclamada ? 0.55 : 1,
              }}
            >
              <div className="d-flex align-items-start gap-2">
                <span style={{ fontSize: '1.3rem', lineHeight: 1.2, flexShrink: 0 }}>{m.icono}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-center gap-1">
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: m.reclamada ? 'rgba(255,255,255,0.4)' : '#fff',
                    }}>
                      {m.nombre}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      color: m.reclamada ? 'rgba(255,255,255,0.3)' : '#d4af37',
                      flexShrink: 0,
                    }}>
                      {m.reclamada ? '✓ cobrado' : `+${m.puntos} pts`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    {m.descripcion}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      flex: 1, height: 5,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 99, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: m.reclamada
                          ? 'rgba(255,255,255,0.2)'
                          : `linear-gradient(90deg, ${m.color}aa, ${m.color})`,
                        borderRadius: 99,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {m.progreso}/{m.meta}
                    </span>
                  </div>

                  {/* Claim button */}
                  {pendiente && (
                    <button
                      onClick={() => reclamar(m)}
                      disabled={reclamando === m.key}
                      style={{
                        marginTop: 8,
                        padding: '3px 12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: 99,
                        border: 'none',
                        background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                        color: '#1a1614',
                        cursor: 'pointer',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {reclamando === m.key ? '...' : '🎁 Reclamar recompensa'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
          background: 'linear-gradient(135deg, #b8860b, #d4af37)',
          color: '#1a1614', padding: '10px 18px', borderRadius: 99,
          fontWeight: 700, fontSize: '0.85rem',
          boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
          animation: 'slideIn 0.3s ease',
        }}>
          🎯 {toast}
        </div>
      )}
    </div>
  )
}
