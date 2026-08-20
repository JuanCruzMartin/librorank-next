'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { Mensaje, Conversacion } from '@/lib/dao/mensajeDAO'

interface Amigo {
  id: number
  nombre: string
  username: string
  avatar_url: string | null
}

interface Props {
  usuarioId: number
  amigos: Amigo[]
  conversacionesIniciales: Conversacion[]
  conIdInicial: number | null
}

export default function ChatClient({ usuarioId, amigos, conversacionesIniciales, conIdInicial }: Props) {
  const [convos, setConvos] = useState<Conversacion[]>(conversacionesIniciales)
  const [conActivo, setConActivo] = useState<number | null>(conIdInicial)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mobileVista, setMobileVista] = useState<'lista' | 'chat'>('lista')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const contactoActivo = conActivo
    ? (convos.find(c => c.usuario_id === conActivo) ?? amigos.find(a => a.id === conActivo) as Amigo | undefined)
    : null

  const amigosFiltrados = amigos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.username.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Lista combinada: convos existentes + amigos sin conversa, filtrada por búsqueda
  const listaContacts: Array<{ id: number; nombre: string; username: string; avatar_url: string | null; ultimo?: string; no_leidos?: number }> = [
    ...convos.filter(c =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.username.toLowerCase().includes(busqueda.toLowerCase())
    ).map(c => ({ id: c.usuario_id, nombre: c.nombre, username: c.username, avatar_url: c.avatar_url, ultimo: c.ultimo_mensaje, no_leidos: c.no_leidos })),
    ...amigosFiltrados.filter(a => !convos.some(c => c.usuario_id === a.id))
      .map(a => ({ id: a.id, nombre: a.nombre, username: a.username, avatar_url: a.avatar_url, ultimo: undefined, no_leidos: 0 })),
  ]

  const cargarMensajes = useCallback(async (conId: number) => {
    setCargando(true)
    try {
      const res = await fetch(`/api/chat?tipo=mensajes&con=${conId}`)
      const data = await res.json()
      const msgs: Mensaje[] = data.mensajes || []
      setMensajes(msgs)
      if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id
    } finally {
      setCargando(false)
    }
  }, [])

  const pollNuevos = useCallback(async () => {
    if (!conActivo) return
    const res = await fetch(`/api/chat?tipo=mensajes&con=${conActivo}&desdeId=${lastIdRef.current}`)
    const data = await res.json()
    const nuevos: Mensaje[] = data.mensajes || []
    if (nuevos.length > 0) {
      setMensajes(prev => [...prev, ...nuevos])
      lastIdRef.current = nuevos[nuevos.length - 1].id
      // Actualizar convos
      setConvos(prev => {
        const existe = prev.find(c => c.usuario_id === conActivo)
        const ultimo = nuevos[nuevos.length - 1]
        if (existe) {
          return prev.map(c => c.usuario_id === conActivo ? { ...c, ultimo_mensaje: ultimo.texto, ultimo_at: ultimo.created_at } : c)
        }
        return prev
      })
    }
  }, [conActivo])

  useEffect(() => {
    if (!conActivo) return
    lastIdRef.current = 0
    cargarMensajes(conActivo)
  }, [conActivo, cargarMensajes])

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Polling cada 3s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (conActivo) {
      pollRef.current = setInterval(pollNuevos, 3000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [conActivo, pollNuevos])

  function abrirConversacion(id: number) {
    setConActivo(id)
    setMobileVista('chat')
    // Marcar como leído en la lista
    setConvos(prev => prev.map(c => c.usuario_id === id ? { ...c, no_leidos: 0 } : c))
  }

  async function enviar() {
    if (!conActivo || !texto.trim() || enviando) return
    const textoEnviar = texto.trim()
    setTexto('')
    setEnviando(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paraId: conActivo, texto: textoEnviar }),
      })
      const data = await res.json()
      if (data.ok) {
        // Recarga completa para evitar duplicados con el optimistic
        await cargarMensajes(conActivo)
        setConvos(prev => {
          const existe = prev.find(c => c.usuario_id === conActivo)
          if (!existe) {
            const amigo = amigos.find(a => a.id === conActivo)
            if (amigo) {
              return [{ usuario_id: amigo.id, username: amigo.username, nombre: amigo.nombre, avatar_url: amigo.avatar_url, ultimo_mensaje: textoEnviar, ultimo_at: new Date().toISOString(), no_leidos: 0 }, ...prev]
            }
          }
          return prev.map(c => c.usuario_id === conActivo ? { ...c, ultimo_mensaje: textoEnviar, ultimo_at: new Date().toISOString() } : c)
        })
      }
    } finally {
      setEnviando(false)
    }
  }

  function formatHora(ts: string) {
    const d = new Date(ts)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatFecha(ts: string) {
    const d = new Date(ts)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  // Agrupar mensajes por fecha
  const mensajesConFecha: Array<Mensaje | { tipo: 'separador'; fecha: string }> = []
  let ultimaFecha = ''
  for (const m of mensajes) {
    const f = formatFecha(m.created_at)
    if (f !== ultimaFecha) {
      mensajesConFecha.push({ tipo: 'separador', fecha: f })
      ultimaFecha = f
    }
    mensajesConFecha.push(m)
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 300, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg-card)',
        display: 'flex', flexDirection: 'column',
        ...(mobileVista === 'chat' ? { display: 'none' } : {}),
      }}
        className="chat-sidebar"
      >
        {/* Header sidebar */}
        <div style={{ padding: '1.25rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-title" style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.75rem' }}>💬 Mensajes</h2>
          <input
            type="text"
            placeholder="Buscar amigo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '0.45rem 0.75rem', borderRadius: 8, fontSize: '0.82rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', outline: 'none',
            }}
          />
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {listaContacts.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              Seguí a alguien para chatear
            </div>
          )}
          {listaContacts.map(c => (
            <button
              key={c.id}
              onClick={() => abrirConversacion(c.id)}
              style={{
                width: '100%', display: 'flex', gap: '0.75rem', alignItems: 'center',
                padding: '0.85rem 1rem', border: 'none', textAlign: 'left',
                background: conActivo === c.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                borderLeft: conActivo === c.id ? '3px solid #d4af37' : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.nombre} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#d4af37', fontWeight: 700 }}>
                    {c.nombre[0].toUpperCase()}
                  </div>
                )}
                {(c.no_leidos ?? 0) > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#e74c3c', fontSize: '0.6rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.no_leidos}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: conActivo === c.id ? '#d4af37' : '#fff', marginBottom: 2 }}>{c.nombre}</div>
                {c.ultimo ? (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ultimo}</div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Empezá la conversación</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL CHAT ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        ...(mobileVista === 'lista' ? { display: 'none' } : {}),
      }}
        className="chat-panel"
      >
        {!conActivo ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
            <p style={{ fontSize: '1rem' }}>Seleccioná un amigo para chatear</p>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-card)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setMobileVista('lista')}
                className="chat-back-btn"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem 0 0', display: 'none' }}
              >
                ←
              </button>
              {contactoActivo?.avatar_url ? (
                <img src={contactoActivo.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontWeight: 700 }}>
                  {contactoActivo?.nombre?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{contactoActivo?.nombre}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>@{contactoActivo?.username}</div>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {cargando && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '2rem' }}>Cargando...</div>
              )}
              {!cargando && mensajes.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
                  Mandá el primer mensaje
                </div>
              )}
              {mensajesConFecha.map((item, i) => {
                if ('tipo' in item) {
                  return (
                    <div key={`sep-${i}`} style={{ textAlign: 'center', margin: '0.75rem 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: 99 }}>{item.fecha}</span>
                    </div>
                  )
                }
                const m = item as Mensaje
                const esMio = m.de_usuario_id === usuarioId
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start', marginBottom: '0.15rem' }}>
                    <div style={{
                      maxWidth: '72%',
                      padding: '0.55rem 0.9rem',
                      borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: esMio
                        ? 'linear-gradient(135deg, #b8860b, #d4af37)'
                        : 'rgba(255,255,255,0.07)',
                      color: esMio ? '#000' : '#fff',
                      fontSize: '0.88rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}>
                      <div>{m.texto}</div>
                      <div style={{ fontSize: '0.62rem', marginTop: 3, opacity: 0.55, textAlign: 'right' }}>
                        {formatHora(m.created_at)}
                        {esMio && <span style={{ marginLeft: 4 }}>{m.leido ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
                }}
                placeholder="Escribí un mensaje..."
                rows={1}
                style={{
                  flex: 1, padding: '0.65rem 0.9rem', borderRadius: 12, fontSize: '0.88rem',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', outline: 'none', resize: 'none', maxHeight: 120,
                  lineHeight: 1.4, fontFamily: 'inherit',
                }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={enviar}
                disabled={!texto.trim() || enviando}
                style={{
                  width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: texto.trim() ? 'linear-gradient(135deg, #b8860b, #d4af37)' : 'rgba(255,255,255,0.08)',
                  color: texto.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontSize: '1.1rem', cursor: texto.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {enviando ? '⟳' : '↑'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .chat-sidebar { display: flex !important; width: 100% !important; }
          .chat-panel { display: flex !important; width: 100% !important; }
          .chat-back-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .chat-sidebar { display: flex !important; }
          .chat-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
