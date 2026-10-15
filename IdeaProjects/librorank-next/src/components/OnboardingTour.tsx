'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'lr_onboarding_v1'

const PASOS = [
  {
    emoji: '👋',
    titulo: '¡Bienvenido/a a LibroRanking!',
    descripcion: 'Tu biblioteca personal, gamificada al máximo. Te mostramos en 3 pasos cómo sacarle el jugo.',
    color: '#d4af37',
  },
  {
    emoji: '📚',
    titulo: 'Tu Biblioteca',
    descripcion: 'Agregá los libros que leíste, estás leyendo o querés leer. Cada libro que marcás como leído te suma puntos y sube en el ranking.',
    color: '#4a9e7a',
  },
  {
    emoji: '🎯',
    titulo: 'Misiones y Arena',
    descripcion: 'Completá misiones semanales y mensuales para ganar puntos extra. Con los puntos canjeás sobres de cartas coleccionables de tus libros favoritos.',
    color: '#9b59b6',
  },
  {
    emoji: '🏆',
    titulo: 'Ranking Global',
    descripcion: 'Competí con lectores de toda la comunidad. Subí de liga, ganás duelos y tu posición sube con cada libro que terminás.',
    color: '#e74c3c',
  },
]

export default function OnboardingTour() {
  const [paso, setPaso] = useState(0)
  const [visible, setVisible] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_KEY)) setVisible(true)
    } catch {}
  }, [])

  if (!visible) return null

  function cerrar() {
    setSaliendo(true)
    setTimeout(() => {
      setVisible(false)
      try { localStorage.setItem(LS_KEY, '1') } catch {}
    }, 300)
  }

  function siguiente() {
    if (paso < PASOS.length - 1) setPaso(p => p + 1)
    else cerrar()
  }

  const actual = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  return (
    <>
      <style>{`
        @keyframes tour-in {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tour-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.95); }
        }
        .tour-card {
          animation: ${saliendo ? 'tour-out 0.3s ease forwards' : 'tour-in 0.35s cubic-bezier(0.22,1,0.36,1)'};
        }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}>
        {/* Card */}
        <div className="tour-card" style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(145deg, #1a1614, #111',
          background: '#1a1614',
          border: `1px solid ${actual.color}55`,
          borderRadius: 20,
          padding: '2rem 1.75rem 1.5rem',
          boxShadow: `0 0 0 1px ${actual.color}22, 0 24px 60px rgba(0,0,0,0.8)`,
          position: 'relative',
        }}>
          {/* Barra de color top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 4, borderRadius: '20px 20px 0 0',
            background: `linear-gradient(90deg, ${actual.color}88, ${actual.color})`,
          }} />

          {/* Saltar */}
          <button
            onClick={cerrar}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600,
              letterSpacing: '0.3px', padding: '4px 8px',
            }}
          >
            Saltar
          </button>

          {/* Emoji */}
          <div style={{
            fontSize: '3.5rem', textAlign: 'center',
            marginBottom: '1.25rem', lineHeight: 1,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          }}>
            {actual.emoji}
          </div>

          {/* Título */}
          <h2 style={{
            color: '#fff', fontWeight: 800,
            fontSize: '1.15rem', textAlign: 'center',
            marginBottom: '0.75rem', lineHeight: 1.3,
          }}>
            {actual.titulo}
          </h2>

          {/* Descripción */}
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.88rem', textAlign: 'center',
            lineHeight: 1.65, marginBottom: '1.75rem',
          }}>
            {actual.descripcion}
          </p>

          {/* Dots de progreso */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1.25rem' }}>
            {PASOS.map((_, i) => (
              <div key={i} style={{
                width: i === paso ? 22 : 8, height: 8,
                borderRadius: 99,
                background: i === paso ? actual.color : 'rgba(255,255,255,0.15)',
                transition: 'all 0.25s ease',
              }} />
            ))}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={siguiente}
            style={{
              width: '100%', padding: '0.7rem',
              borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${actual.color}cc, ${actual.color})`,
              color: '#000', fontWeight: 800,
              fontSize: '0.9rem', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {esUltimo ? '¡Empezar! 🚀' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </>
  )
}
