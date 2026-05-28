'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  mensaje: string
  puntos: number
  onClose: () => void
}

export default function Toast({ mensaje, puntos, onClose }: ToastProps) {
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSaliendo(true), 2800)
    const t2 = setTimeout(() => onClose(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '1.5rem',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, #1a1614, #25211e)',
        border: '1px solid rgba(212,175,55,0.5)',
        borderRadius: 16,
        padding: '1rem 1.25rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)',
        minWidth: 260,
        maxWidth: 340,
        animation: saliendo ? 'toastOut 0.5s ease forwards' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      {/* Puntos */}
      <div style={{
        background: 'rgba(212,175,55,0.15)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 12,
        padding: '0.5rem 0.75rem',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>
          +{puntos}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(212,175,55,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          pts
        </div>
      </div>

      {/* Mensaje */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          {mensaje}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          Seguí así 🔥
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={() => { setSaliendo(true); setTimeout(onClose, 500) }}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0,
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(120%) scale(0.8); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)    scale(1);   }
          to   { opacity: 0; transform: translateX(120%) scale(0.8); }
        }
        @media (max-width: 480px) {
          /* En mobile se muestra abajo centrado */
        }
      `}</style>
    </div>
  )
}
