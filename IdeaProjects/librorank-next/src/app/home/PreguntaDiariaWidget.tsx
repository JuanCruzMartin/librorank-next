'use client'

import { useState, useEffect } from 'react'

interface Estado {
  texto: string
  opciones: string[]
  respondida: boolean
  correcta: boolean | null
  respuestaCorrecta: number | null
}

export default function PreguntaDiariaWidget() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [resultado, setResultado] = useState<{ correcta: boolean; tiradaGanada: boolean } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetch('/api/pregunta-diaria')
      .then(r => r.json())
      .then(data => { setEstado(data); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  async function responder() {
    if (seleccionada === null || enviando) return
    setEnviando(true)
    const res = await fetch('/api/pregunta-diaria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opcionElegida: seleccionada }),
    })
    const data = await res.json()
    setResultado(data)
    setEstado(prev => prev ? {
      ...prev,
      respondida: true,
      correcta: data.correcta,
      respuestaCorrecta: data.respuestaCorrecta,
    } : prev)
    setEnviando(false)
  }

  if (cargando) return null
  if (!estado) return null

  const mostrarResultado = estado.respondida
  const yaCorrecto = estado.respondida && estado.correcta

  function colorOpcion(i: number): React.CSSProperties {
    if (!mostrarResultado) {
      return seleccionada === i
        ? { background: 'rgba(212,175,55,0.18)', border: '1.5px solid var(--accent-gold)', color: '#fff' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }
    }
    if (i === (estado?.respuestaCorrecta ?? -1)) {
      return { background: 'rgba(39,174,96,0.18)', border: '1.5px solid #27ae60', color: '#2ecc71' }
    }
    if (i === seleccionada && i !== (estado?.respuestaCorrecta ?? -1)) {
      return { background: 'rgba(231,76,60,0.15)', border: '1.5px solid #e74c3c', color: '#e74c3c' }
    }
    return { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }
  }

  return (
    <div className="card p-4 mt-3" style={{ borderLeft: '3px solid #9b59b6', background: 'rgba(155,89,182,0.06)' }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <span style={{ fontSize: '1.1rem' }}>📚</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9b59b6' }}>
          Pregunta literaria del día
        </span>
      </div>

      <p className="text-white mb-3" style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5 }}>
        {estado.texto}
      </p>

      <div className="d-flex flex-column gap-2 mb-3">
        {estado.opciones.map((op, i) => (
          <button
            key={i}
            disabled={mostrarResultado}
            onClick={() => !mostrarResultado && setSeleccionada(i)}
            style={{
              ...colorOpcion(i),
              padding: '0.5rem 0.85rem',
              borderRadius: 8,
              cursor: mostrarResultado ? 'default' : 'pointer',
              textAlign: 'left',
              fontSize: '0.82rem',
              fontWeight: 500,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            {op}
            {mostrarResultado && i === estado.respuestaCorrecta && <span style={{ marginLeft: 'auto' }}>✓</span>}
            {mostrarResultado && i === seleccionada && i !== estado.respuestaCorrecta && <span style={{ marginLeft: 'auto' }}>✗</span>}
          </button>
        ))}
      </div>

      {!mostrarResultado && (
        <button
          onClick={responder}
          disabled={seleccionada === null || enviando}
          className="btn-gold w-100"
          style={{ fontSize: '0.85rem', opacity: seleccionada === null ? 0.4 : 1 }}
        >
          {enviando ? 'Enviando...' : 'Confirmar respuesta'}
        </button>
      )}

      {mostrarResultado && (
        <div style={{
          padding: '0.6rem 0.85rem',
          borderRadius: 8,
          background: yaCorrecto ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
          border: `1px solid ${yaCorrecto ? '#27ae60' : '#e74c3c'}`,
          fontSize: '0.82rem',
          color: yaCorrecto ? '#2ecc71' : '#e74c3c',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {yaCorrecto
            ? (resultado ? '¡Correcto! Ganaste 1 tirada de cartas 🃏' : '¡Correcto! (ya respondida hoy)')
            : `Incorrecto. La respuesta era "${estado.opciones[estado.respuestaCorrecta ?? 0]}"`
          }
        </div>
      )}
    </div>
  )
}
