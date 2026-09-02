'use client'

import { useState } from 'react'

export default function BannerSugerencias() {
  const [abierto, setAbierto] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  if (!abierto) return null

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
      setTexto('')
      setTimeout(() => setAbierto(false), 2500)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.12) 100%)',
      borderBottom: '1px solid rgba(139,92,246,0.25)',
      padding: '0.75rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
      position: 'relative', flexShrink: 0,
    }}>
      <span style={{ fontSize: '1.1rem' }}>📚</span>
      <span style={{
        fontWeight: 700, fontSize: '0.82rem', color: '#c4b5fd', letterSpacing: 0.3, flexShrink: 0,
        textTransform: 'uppercase',
      }}>
        ¿Qué libro querés que tenga su colección de cartas?
      </span>

      {!enviado ? (
        <>
          <input
            type="text"
            placeholder="Escribí tu sugerencia..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            maxLength={120}
            style={{
              flex: 1, minWidth: 180, padding: '0.35rem 0.7rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#fff', fontSize: '0.82rem', outline: 'none',
            }}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando}
            style={{
              padding: '0.35rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: texto.trim() ? '#7c3aed' : 'rgba(124,58,237,0.3)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </>
      ) : (
        <span style={{ color: '#86efac', fontSize: '0.82rem', fontWeight: 600 }}>
          ✓ ¡Gracias por tu sugerencia!
        </span>
      )}

      <button
        onClick={() => setAbierto(false)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: '2px 6px',
        }}
      >✕</button>
    </div>
  )
}
