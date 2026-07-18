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
  const [abierto, setAbierto] = useState(false)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [resultado, setResultado] = useState<{ correcta: boolean } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    fetch('/api/pregunta-diaria')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEstado(data) })
      .catch(() => {})
  }, [])

  // No mostrar si no hay sesión, ya respondió hoy o está oculto manualmente
  if (!estado || oculto) return null
  if (estado.respondida && !abierto) return null

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
    // Ocultar tras 3.5s
    setTimeout(() => setOculto(true), 3500)
  }

  function colorOpcion(i: number): React.CSSProperties {
    if (!estado!.respondida) {
      return seleccionada === i
        ? { background: 'rgba(212,175,55,0.2)', border: '1.5px solid #d4af37', color: '#fff' }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }
    }
    const rc = estado!.respuestaCorrecta ?? -1
    if (i === rc) return { background: 'rgba(39,174,96,0.2)', border: '1.5px solid #27ae60', color: '#2ecc71' }
    if (i === seleccionada && i !== rc) return { background: 'rgba(231,76,60,0.15)', border: '1.5px solid #e74c3c', color: '#e74c3c' }
    return { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
  }

  return (
    <>
      <style>{`
        @keyframes pulso {
          0%, 100% { box-shadow: 0 0 0 0 rgba(155,89,182,0.7), 0 4px 24px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(155,89,182,0), 0 4px 24px rgba(0,0,0,0.5); }
        }
        .pregunta-flotante-btn {
          animation: pulso 2s ease-in-out infinite;
        }
        .pregunta-flotante-btn:hover {
          animation: none;
          box-shadow: 0 0 0 3px rgba(155,89,182,0.8), 0 8px 32px rgba(0,0,0,0.6) !important;
          transform: translateY(-2px);
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}>
        {/* Card expandida */}
        {abierto && (
          <div style={{
            width: 320,
            background: 'linear-gradient(145deg, #1a0d2e, #130920)',
            border: '1px solid rgba(155,89,182,0.4)',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(155,89,182,0.2)',
          }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.1rem' }}>📚</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b07fe8' }}>
                  Pregunta del día
                </span>
              </div>
              <button
                onClick={() => setAbierto(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Pregunta */}
            <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.55, marginBottom: '1rem' }}>
              {estado!.texto}
            </p>

            {/* Opciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
              {estado!.opciones.map((op, i) => (
                <button
                  key={i}
                  disabled={estado!.respondida}
                  onClick={() => !estado!.respondida && setSeleccionada(i)}
                  style={{
                    ...colorOpcion(i),
                    padding: '0.45rem 0.75rem',
                    borderRadius: 8,
                    cursor: estado!.respondida ? 'default' : 'pointer',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{op}</span>
                  {estado!.respondida && i === (estado!.respuestaCorrecta ?? -1) && <span>✓</span>}
                  {estado!.respondida && i === seleccionada && i !== (estado!.respuestaCorrecta ?? -1) && <span>✗</span>}
                </button>
              ))}
            </div>

            {/* Botón confirmar */}
            {!estado!.respondida && (
              <button
                onClick={responder}
                disabled={seleccionada === null || enviando}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: 8,
                  border: 'none',
                  background: seleccionada === null ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: seleccionada === null ? 'rgba(255,255,255,0.3)' : '#000',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: seleccionada === null ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {enviando ? 'Enviando...' : 'Confirmar respuesta'}
              </button>
            )}

            {/* Resultado */}
            {resultado && (
              <div style={{
                marginTop: 10,
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                background: resultado.correcta ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.12)',
                border: `1px solid ${resultado.correcta ? '#27ae60' : '#e74c3c'}`,
                color: resultado.correcta ? '#2ecc71' : '#e74c3c',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
              }}>
                {resultado.correcta
                  ? '¡Correcto! +1 tirada de cartas 🃏'
                  : `Incorrecto. Era: "${estado!.opciones[estado!.respuestaCorrecta ?? 0]}"`
                }
              </div>
            )}
          </div>
        )}

        {/* Botón flotante */}
        <button
          className="pregunta-flotante-btn"
          onClick={() => setAbierto(v => !v)}
          style={{
            background: 'linear-gradient(135deg, #6c3483, #9b59b6)',
            border: 'none',
            borderRadius: abierto ? 12 : 50,
            padding: abierto ? '0.6rem 1.1rem' : '0.7rem 1.2rem',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📚</span>
          {abierto ? 'Cerrar' : 'Pregunta del día'}
        </button>
      </div>
    </>
  )
}
