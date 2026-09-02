'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const LS_KEY = 'lr_sugerencia_enviada'

export default function BannerSugerenciasFlotante() {
  const [visible, setVisible] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [pos, setPos] = useState({ x: -1, y: -1 }) // -1 = posición default (bottom-right)
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // No iniciar drag si click en input/button
    if ((e.target as HTMLElement).closest('input,button')) return
    e.preventDefault()
    const rect = bannerRef.current!.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const cerrar = (permanente = false) => {
    setVisible(false)
    if (permanente) localStorage.setItem(LS_KEY, '1')
  }

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await fetch('/api/sugerencias-cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugerencia: texto }),
      })
      setEnviado(true)
      localStorage.setItem(LS_KEY, '1')
      setTimeout(() => cerrar(false), 2500)
    } finally {
      setEnviando(false)
    }
  }

  if (!visible) return null

  const posStyle = pos.x >= 0
    ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : { bottom: 24, right: 24 }

  return (
    <div
      ref={bannerRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed', zIndex: 8000,
        ...posStyle,
        width: 320, borderRadius: 14,
        background: 'linear-gradient(135deg, #1e1040 0%, #0f172a 100%)',
        border: '1px solid rgba(139,92,246,0.4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15)',
        padding: '1rem 1rem 0.9rem',
        animation: dragging ? 'none' : 'sugerencia-slide-in 0.4s cubic-bezier(0.22,1,0.36,1)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: dragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <style>{`
        @keyframes sugerencia-slide-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>📚</span>
          <div>
            <p style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
              ¡Ayudanos a crecer!
            </p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', margin: 0, lineHeight: 1.3 }}>
              ¿Qué libro querés que tenga<br />su colección de cartas?
            </p>
          </div>
        </div>
        <button onClick={() => cerrar(true)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0, marginLeft: 6,
        }}>✕</button>
      </div>

      {!enviado ? (
        <>
          <input
            type="text"
            placeholder="Ej: El Hobbit, 1984, Dune..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            maxLength={120}
            autoFocus
            style={{
              width: '100%', padding: '0.45rem 0.75rem', borderRadius: 8, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.35)',
              color: '#fff', fontSize: '0.82rem', outline: 'none', marginBottom: '0.5rem',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={enviar}
              disabled={!texto.trim() || enviando}
              style={{
                flex: 1, padding: '0.45rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: texto.trim() ? '#7c3aed' : 'rgba(124,58,237,0.3)',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              {enviando ? '...' : '✉️ Enviar sugerencia'}
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', marginTop: '0.45rem', textAlign: 'center' }}>
            Tu sugerencia le llega directo al equipo 🎴
          </p>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <p style={{ color: '#86efac', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>¡Gracias por sugerirlo! 🎉</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 4 }}>Lo tendremos en cuenta para la próxima colección.</p>
        </div>
      )}
    </div>
  )
}
