'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatCircleDots } from '@phosphor-icons/react'

export default function ChatFab() {
  const [noLeidos, setNoLeidos] = useState(0)
  const pathname = usePathname()

  async function fetchNoLeidos() {
    try {
      const res = await fetch('/api/chat?tipo=noLeidos')
      if (!res.ok) return
      const data = await res.json()
      setNoLeidos(data.count ?? 0)
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    fetchNoLeidos()
    const interval = setInterval(fetchNoLeidos, 15_000)
    return () => clearInterval(interval)
  }, [])

  // En la página de chat no mostrar el FAB
  if (pathname.startsWith('/chat')) return null

  return (
    <>
      <style>{`
        @keyframes chat-pulso {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,152,219,0.7), 0 4px 24px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(52,152,219,0), 0 4px 24px rgba(0,0,0,0.5); }
        }
        .chat-fab-btn {
          animation: chat-pulso 2.2s ease-in-out infinite;
        }
        .chat-fab-btn:hover {
          animation: none;
          box-shadow: 0 0 0 3px rgba(52,152,219,0.8), 0 8px 32px rgba(0,0,0,0.6) !important;
          transform: scale(1.06);
        }
      `}</style>

      <Link
        href="/chat"
        className="chat-fab-btn"
        onClick={() => setNoLeidos(0)}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          zIndex: 9998,
          background: 'linear-gradient(135deg, #1a5276, #2980b9)',
          border: 'none',
          borderRadius: 50,
          padding: '0.7rem 1.2rem',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          transition: 'transform 0.2s',
        }}
      >
        <ChatCircleDots size={20} weight="duotone" />
        {noLeidos > 0 ? (
          <span style={{
            background: '#e74c3c', color: '#fff', borderRadius: '50%',
            width: 20, height: 20, fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {noLeidos > 9 ? '9+' : noLeidos}
          </span>
        ) : (
          <span>Mensajes</span>
        )}
      </Link>
    </>
  )
}
