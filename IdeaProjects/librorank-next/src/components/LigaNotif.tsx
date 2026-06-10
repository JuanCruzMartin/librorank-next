'use client'

import { useEffect, useState } from 'react'
import { getLiga } from '@/lib/ligas'

interface Props {
  puntos: number
}

export default function LigaNotif({ puntos }: Props) {
  const [notif, setNotif] = useState<{ nombre: string; emoji: string; color: string } | null>(null)

  useEffect(() => {
    const KEY = 'lr_liga_pts'
    try {
      const anterior = Number(localStorage.getItem(KEY) ?? 0)
      localStorage.setItem(KEY, String(puntos))

      if (anterior > 0 && puntos > anterior) {
        const ligaAntes = getLiga(anterior)
        const ligaAhora = getLiga(puntos)
        if (ligaAhora.key !== ligaAntes.key) {
          setNotif({ nombre: ligaAhora.nombre, emoji: ligaAhora.emoji, color: ligaAhora.color })
        }
      }
    } catch {
      // localStorage no disponible (SSR / modo privado extremo)
    }
  }, [puntos])

  if (!notif) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 20, zIndex: 9999,
        background: '#0f0e0c',
        border: `2px solid ${notif.color}`,
        borderRadius: 18,
        padding: '1.1rem 1.5rem',
        boxShadow: `0 8px 40px ${notif.color}55`,
        display: 'flex', alignItems: 'center', gap: '1rem',
        maxWidth: 320,
        animation: 'slideInRight 0.4s cubic-bezier(.17,.67,.35,1.2)',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>{notif.emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: notif.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
          ¡Subiste de liga!
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
          Liga {notif.nombre}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          Seguís subiendo. ¡Eso es! 🚀
        </div>
      </div>
      <button
        onClick={() => setNotif(null)}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
          fontSize: '1rem', padding: '0.25rem', lineHeight: 1,
          alignSelf: 'flex-start',
        }}
      >
        ✕
      </button>
    </div>
  )
}
