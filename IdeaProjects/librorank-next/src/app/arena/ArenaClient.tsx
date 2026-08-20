'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Duelo } from '@/lib/dao/dueloDAO'
import type { Carta } from '@/lib/cartas'

const RAREZA_COLOR: Record<string, string> = {
  comun: '#9e9e9e', raro: '#3498db', epico: '#9b59b6',
  legendario: '#d4af37', mitico: '#e74c3c',
}

interface Props {
  usuarioId: number
  salaInicial: Duelo[]
  dueloActivoInicial: Duelo | null
  historialInicial: Duelo[]
  misCartas: Carta[]
  cartasMap: Record<string, Carta>
}

interface PreguntaData {
  texto: string
  opciones: string[]
  respuesta?: number
}

export default function ArenaClient({ usuarioId, salaInicial, dueloActivoInicial, historialInicial, misCartas, cartasMap }: Props) {
  const [sala, setSala] = useState<Duelo[]>(salaInicial)
  const [dueloActivo, setDueloActivo] = useState<Duelo | null>(dueloActivoInicial)
  const [historial, setHistorial] = useState<Duelo[]>(historialInicial)
  const [pregunta, setPregunta] = useState<PreguntaData | null>(null)
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null)
  const [esperandoRival, setEsperandoRival] = useState(false)
  const [resultado, setResultado] = useState<{ gane: boolean; empate: boolean; cartaGanada?: string } | null>(null)
  const [cartaSeleccionada, setCartaSeleccionada] = useState<string | null>(null)
  const [modal, setModal] = useState<'crear' | 'unirse' | null>(null)
  const [dueloParaUnirse, setDueloParaUnirse] = useState<Duelo | null>(null)
  const [cargando, setCargando] = useState(false)
  const [timer, setTimer] = useState<number>(60)
  const [respondioEarly, setRespondioEarly] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const esRetador = dueloActivo?.retador_id === usuarioId
  const yaRespondio = dueloActivo
    ? (esRetador ? dueloActivo.respuesta_retador !== null : dueloActivo.respuesta_rival !== null)
    : false

  // Polling del duelo activo
  const pollDuelo = useCallback(async () => {
    if (!dueloActivo) return
    const res = await fetch(`/api/duelos/${dueloActivo.id}`)
    if (!res.ok) return
    const data = await res.json()
    const d: Duelo = data.duelo

    setDueloActivo(d)

    if (d.estado === 'en_curso' && data.pregunta && !pregunta) {
      setPregunta(data.pregunta)
      iniciarTimer()
    }

    if (d.estado === 'terminado') {
      clearPolling()
      clearTimer()
      const gane = d.ganador_id === usuarioId
      const empate = d.ganador_id === null
      const cartaGanada = gane
        ? (esRetador ? d.carta_rival : d.carta_retador) ?? undefined
        : undefined
      setResultado({ gane, empate, cartaGanada })
      setHistorial(prev => [d, ...prev].slice(0, 5))
    }

    if (d.estado === 'expirado') {
      clearPolling()
      clearTimer()
      setDueloActivo(null)
      refrescarSala()
    }
  }, [dueloActivo, pregunta, usuarioId, esRetador])

  function clearPolling() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  function clearTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  function iniciarTimer() {
    setTimer(60)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearTimer(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (dueloActivo && dueloActivo.estado !== 'terminado') {
      clearPolling()
      pollRef.current = setInterval(pollDuelo, 2000)
      // Cargar pregunta si ya está en curso
      if (dueloActivo.estado === 'en_curso') {
        fetch(`/api/duelos/${dueloActivo.id}`).then(r => r.json()).then(data => {
          if (data.pregunta) { setPregunta(data.pregunta); iniciarTimer() }
        })
      }
    }
    return () => { clearPolling(); clearTimer() }
  }, [dueloActivo?.id])

  async function refrescarSala() {
    const res = await fetch('/api/duelos')
    if (!res.ok) return
    const data = await res.json()
    setSala(data.sala)
  }

  async function crearDesafio() {
    if (!cartaSeleccionada || cargando) return
    setCargando(true)
    const res = await fetch('/api/duelos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'crear', cartaId: cartaSeleccionada }),
    })
    const data = await res.json()
    if (data.ok) {
      setModal(null)
      setCartaSeleccionada(null)
      const res2 = await fetch('/api/duelos')
      const d2 = await res2.json()
      setDueloActivo(d2.activo)
      setEsperandoRival(true)
    }
    setCargando(false)
  }

  async function unirseAlDuelo() {
    if (!cartaSeleccionada || !dueloParaUnirse || cargando) return
    setCargando(true)
    const res = await fetch(`/api/duelos/${dueloParaUnirse.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'unirse', cartaId: cartaSeleccionada }),
    })
    const data = await res.json()
    if (data.ok) {
      setModal(null)
      setCartaSeleccionada(null)
      setDueloParaUnirse(null)
      const res2 = await fetch(`/api/duelos/${dueloParaUnirse.id}`)
      const d2 = await res2.json()
      setDueloActivo(d2.duelo)
      if (d2.pregunta) { setPregunta(d2.pregunta); iniciarTimer() }
    }
    setCargando(false)
  }

  async function enviarRespuesta(opcionIdx: number) {
    if (!dueloActivo || respuestaSeleccionada !== null || cargando) return
    setRespuestaSeleccionada(opcionIdx)
    setRespondioEarly(true)
    clearTimer()

    const res = await fetch(`/api/duelos/${dueloActivo.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'responder', respuesta: opcionIdx }),
    })
    const data = await res.json()

    if (data.dueloTerminado) {
      clearPolling()
      const d: Duelo = data.duelo
      setDueloActivo(d)
      const gane = d.ganador_id === usuarioId
      const empate = d.ganador_id === null
      const cartaGanada = gane
        ? (esRetador ? d.carta_rival : d.carta_retador) ?? undefined
        : undefined
      setResultado({ gane, empate, cartaGanada })
      setHistorial(prev => [d, ...prev].slice(0, 5))
      if (data.pregunta) setPregunta(p => ({ ...p!, respuesta: data.respuestaCorrecta }))
    }
  }

  async function cancelarDesafio() {
    if (!dueloActivo) return
    await fetch('/api/duelos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cancelar', dueloId: dueloActivo.id }),
    })
    setDueloActivo(null)
    setEsperandoRival(false)
    refrescarSala()
  }

  function reiniciar() {
    setDueloActivo(null)
    setResultado(null)
    setPregunta(null)
    setRespuestaSeleccionada(null)
    setEsperandoRival(false)
    setRespondioEarly(false)
    setTimer(60)
    refrescarSala()
  }

  function colorOpcion(idx: number) {
    if (respuestaSeleccionada === null) return 'rgba(255,255,255,0.06)'
    if (pregunta?.respuesta !== undefined) {
      if (idx === pregunta.respuesta) return 'rgba(39,174,96,0.25)'
      if (idx === respuestaSeleccionada && idx !== pregunta.respuesta) return 'rgba(231,76,60,0.25)'
    }
    if (idx === respuestaSeleccionada) return 'rgba(212,175,55,0.2)'
    return 'rgba(255,255,255,0.04)'
  }

  function borderOpcion(idx: number) {
    if (respuestaSeleccionada === null) return idx === respuestaSeleccionada ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.1)'
    if (pregunta?.respuesta !== undefined) {
      if (idx === pregunta.respuesta) return '2px solid #27ae60'
      if (idx === respuestaSeleccionada) return '2px solid #e74c3c'
    }
    return '1px solid rgba(255,255,255,0.08)'
  }

  function MiniCarta({ cartaId, size = 'sm' }: { cartaId: string; size?: 'sm' | 'md' }) {
    const c = cartasMap[cartaId]
    if (!c) return <div style={{ width: size === 'md' ? 80 : 52, height: size === 'md' ? 110 : 72, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
    const color = RAREZA_COLOR[c.rareza]
    const w = size === 'md' ? 80 : 52
    const h = size === 'md' ? 110 : 72
    return (
      <div style={{ width: w, height: h, borderRadius: 8, border: `2px solid ${color}`, overflow: 'hidden', background: '#111', flexShrink: 0, position: 'relative' }}>
        <img src={c.imagen} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${c.posicionX}% ${c.posicionY}%` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.85))', padding: '2px 4px' }}>
          <div style={{ fontSize: size === 'md' ? '0.6rem' : '0.48rem', color: '#fff', fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>{c.nombre}</div>
          <div style={{ fontSize: '0.42rem', color, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.rareza}</div>
        </div>
      </div>
    )
  }

  // ── RESULTADO ──
  if (resultado && dueloActivo) {
    return (
      <div className="text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
          {resultado.empate ? '🤝' : resultado.gane ? '🏆' : '💀'}
        </div>
        <h2 className="font-title" style={{ color: resultado.empate ? '#d4af37' : resultado.gane ? '#27ae60' : '#e74c3c', marginBottom: '0.5rem' }}>
          {resultado.empate ? '¡Empate!' : resultado.gane ? '¡Ganaste!' : '¡Perdiste!'}
        </h2>
        {resultado.empate && <p className="text-muted">Los dos fallaron — las cartas vuelven a sus dueños.</p>}
        {resultado.gane && resultado.cartaGanada && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Te llevás la carta de tu rival:</p>
            <div className="d-flex justify-content-center mt-2 mb-3">
              <MiniCarta cartaId={resultado.cartaGanada} size="md" />
            </div>
          </div>
        )}
        {!resultado.gane && !resultado.empate && (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Tu rival se llevó tu carta.</p>
        )}

        {/* Mostrar respuesta correcta si no la vimos */}
        {pregunta && pregunta.respuesta !== undefined && (
          <div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 700, marginBottom: 4 }}>✓ Respuesta correcta</div>
            <div style={{ fontSize: '0.85rem', color: '#fff' }}>{pregunta.opciones[pregunta.respuesta]}</div>
          </div>
        )}

        <button onClick={reiniciar} className="btn--brand" style={{ marginTop: '0.5rem' }}>
          Volver a la Arena
        </button>
      </div>
    )
  }

  // ── DUELO EN CURSO ──
  if (dueloActivo?.estado === 'en_curso' && pregunta) {
    const rival = esRetador
      ? { nombre: dueloActivo.rival_nombre, avatar: dueloActivo.rival_avatar, carta: dueloActivo.carta_rival }
      : { nombre: dueloActivo.retador_nombre, avatar: dueloActivo.retador_avatar, carta: dueloActivo.carta_retador }
    const miCarta = esRetador ? dueloActivo.carta_retador : dueloActivo.carta_rival

    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Cabecera: yo vs rival */}
        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Tu apuesta</div>
            {miCarta && <MiniCarta cartaId={miCarta} size="md" />}
          </div>
          <div className="text-center">
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d4af37' }}>⚔️</div>
            {!yaRespondio && (
              <div style={{
                fontSize: '1.2rem', fontWeight: 900,
                color: timer <= 10 ? '#e74c3c' : '#fff',
                background: timer <= 10 ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.05)',
                borderRadius: 8, padding: '2px 12px', marginTop: 4,
                transition: 'all 0.3s',
              }}>
                {timer}s
              </div>
            )}
          </div>
          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Apuesta rival</div>
            {rival.carta && <MiniCarta cartaId={rival.carta} size="md" />}
          </div>
        </div>

        {/* Pregunta */}
        <div className="card p-4 mb-3">
          <div style={{ fontSize: '0.65rem', color: '#d4af37', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            ⚔️ Pregunta literaria
          </div>
          <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, lineHeight: 1.5, marginBottom: '1.25rem' }}>
            {pregunta.texto}
          </p>

          <div className="d-flex flex-column gap-2">
            {pregunta.opciones.map((op, i) => (
              <button
                key={i}
                onClick={() => enviarRespuesta(i)}
                disabled={respuestaSeleccionada !== null || timer === 0}
                style={{
                  padding: '0.7rem 1rem', borderRadius: 10, border: borderOpcion(i),
                  background: colorOpcion(i), color: '#fff', textAlign: 'left',
                  fontSize: '0.88rem', cursor: respuestaSeleccionada !== null ? 'default' : 'pointer',
                  transition: 'all 0.15s', fontWeight: respuestaSeleccionada === i ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', minWidth: 18 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {op}
                {respuestaSeleccionada !== null && pregunta.respuesta !== undefined && i === pregunta.respuesta && (
                  <span style={{ marginLeft: 'auto', color: '#27ae60' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {respondioEarly && respuestaSeleccionada !== null && resultado === null && (
            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              Esperando que tu rival responda...
            </div>
          )}

          {timer === 0 && respuestaSeleccionada === null && (
            <div style={{ marginTop: '1rem', textAlign: 'center', color: '#e74c3c', fontSize: '0.85rem', fontWeight: 700 }}>
              ⏰ Tiempo agotado
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-muted small">vs <strong style={{ color: '#fff' }}>{rival.nombre}</strong></p>
        </div>
      </div>
    )
  }

  // ── ESPERANDO RIVAL ──
  if (dueloActivo?.estado === 'esperando') {
    return (
      <div className="text-center" style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚔️</div>
        <h3 className="font-title" style={{ color: '#d4af37', marginBottom: '0.5rem' }}>Desafío publicado</h3>
        <p className="text-muted mb-3">Esperando que alguien acepte tu duelo...</p>
        <div className="d-flex justify-content-center mb-4">
          <MiniCarta cartaId={dueloActivo.carta_retador} size="md" />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
          <span>Tu carta en juego:</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>{cartasMap[dueloActivo.carta_retador]?.nombre}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: '1.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>En vivo en la Arena</span>
        </div>
        <br />
        <button onClick={cancelarDesafio} style={{ background: 'none', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, color: '#e74c3c', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
          Cancelar desafío
        </button>
        <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    )
  }

  // ── SALA PRINCIPAL ──
  return (
    <div>
      <div className="text-center mb-5">
        <h1 className="font-title display-5" style={{ color: '#fff' }}>⚔️ Arena de Duelos</h1>
        <p className="text-muted">Apostá una carta de tu colección y desafiá a cualquier lector</p>
      </div>

      <div className="row g-4">
        {/* Columna izquierda: sala */}
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="font-title mb-0" style={{ color: '#fff' }}>Desafíos disponibles</h5>
            <button onClick={refrescarSala} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ↻ Actualizar
            </button>
          </div>

          {sala.length === 0 ? (
            <div className="card p-5 text-center">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏟️</div>
              <p className="text-muted">La arena está vacía. ¡Sé el primero en desafiar!</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sala.map(d => {
                const carta = cartasMap[d.carta_retador]
                const color = carta ? RAREZA_COLOR[carta.rareza] : '#9e9e9e'
                return (
                  <div key={d.id} className="card p-3" style={{ border: `1px solid ${color}30` }}>
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar retador */}
                      <div style={{ flexShrink: 0 }}>
                        {d.retador_avatar ? (
                          <img src={d.retador_avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,175,55,0.3)' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#d4af37' }}>
                            {d.retador_nombre[0]}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{d.retador_nombre}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>@{d.retador_username} · desafía con:</div>
                        {carta && (
                          <div style={{ fontSize: '0.75rem', color, fontWeight: 700, marginTop: 2 }}>
                            {carta.simbolo} {carta.nombre} <span style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>({carta.rareza})</span>
                          </div>
                        )}
                      </div>

                      {/* Carta preview */}
                      <MiniCarta cartaId={d.carta_retador} size="sm" />

                      {/* Botón */}
                      <button
                        onClick={() => { setDueloParaUnirse(d); setModal('unirse') }}
                        style={{
                          flexShrink: 0, padding: '0.5rem 1rem', borderRadius: 8, border: `1px solid ${color}`,
                          background: `${color}15`, color, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                        }}
                      >
                        Aceptar ⚔️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Columna derecha: acciones + historial */}
        <div className="col-lg-4">
          <button
            onClick={() => setModal('crear')}
            style={{
              width: '100%', padding: '1rem', borderRadius: 12,
              background: 'linear-gradient(135deg, #7d3c98, #9b59b6)',
              border: 'none', color: '#fff', fontWeight: 800,
              fontSize: '1rem', cursor: 'pointer', marginBottom: '1.5rem',
              boxShadow: '0 4px 20px rgba(155,89,182,0.35)',
            }}
          >
            ⚔️ Crear desafío
          </button>

          {/* Historial */}
          {historial.length > 0 && (
            <div>
              <h6 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
                Mis últimos duelos
              </h6>
              <div className="d-flex flex-column gap-2">
                {historial.map(d => {
                  const gane = d.ganador_id === usuarioId
                  const empate = d.ganador_id === null
                  const esRet = d.retador_id === usuarioId
                  const rivalNombre = esRet ? d.rival_nombre : d.retador_nombre
                  return (
                    <div key={d.id} style={{
                      padding: '0.6rem 0.85rem', borderRadius: 10, fontSize: '0.78rem',
                      background: empate ? 'rgba(212,175,55,0.06)' : gane ? 'rgba(39,174,96,0.06)' : 'rgba(231,76,60,0.06)',
                      border: `1px solid ${empate ? 'rgba(212,175,55,0.2)' : gane ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>vs {rivalNombre ?? '?'}</span>
                      <span style={{ fontWeight: 700, color: empate ? '#d4af37' : gane ? '#27ae60' : '#e74c3c' }}>
                        {empate ? '🤝 Empate' : gane ? '🏆 Ganaste' : '💀 Perdiste'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal selector de carta */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => { setModal(null); setCartaSeleccionada(null) }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1a1a2e', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: '1.5rem', maxWidth: 560, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <h5 className="font-title mb-1" style={{ color: '#d4af37' }}>
              {modal === 'crear' ? '⚔️ Elegí tu carta de apuesta' : `⚔️ Aceptar duelo de ${dueloParaUnirse?.retador_nombre}`}
            </h5>
            {modal === 'unirse' && dueloParaUnirse && (
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Ellos apuestan:</span>
                <MiniCarta cartaId={dueloParaUnirse.carta_retador} size="sm" />
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>{cartasMap[dueloParaUnirse.carta_retador]?.nombre}</span>
              </div>
            )}
            <p className="text-muted small mb-3">Si perdés, tu rival se lleva esta carta. Elegí con cuidado.</p>

            {misCartas.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>
                No tenés cartas en tu colección todavía.
              </p>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem', padding: '0.25rem' }}>
                  {misCartas.map(c => {
                    const color = RAREZA_COLOR[c.rareza]
                    const sel = cartaSeleccionada === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCartaSeleccionada(c.id)}
                        style={{
                          border: sel ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.08)',
                          borderRadius: 10, padding: 4, background: sel ? `${color}18` : 'transparent',
                          cursor: 'pointer', transform: sel ? 'scale(1.05)' : 'none',
                          transition: 'all 0.15s', boxShadow: sel ? `0 0 12px ${color}50` : 'none',
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 7, overflow: 'hidden', position: 'relative', background: '#111' }}>
                          <img src={c.imagen} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${c.posicionX}% ${c.posicionY}%` }} />
                        </div>
                        <div style={{ fontSize: '0.58rem', color: sel ? '#fff' : 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: sel ? 700 : 400, lineHeight: 1.2 }}>
                          {c.nombre}
                        </div>
                        <div style={{ fontSize: '0.52rem', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.rareza}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              <button onClick={() => { setModal(null); setCartaSeleccionada(null) }} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={modal === 'crear' ? crearDesafio : unirseAlDuelo}
                disabled={!cartaSeleccionada || cargando}
                style={{
                  flex: 2, padding: '0.6rem', borderRadius: 8, border: 'none',
                  background: cartaSeleccionada ? 'linear-gradient(135deg, #7d3c98, #9b59b6)' : 'rgba(255,255,255,0.05)',
                  color: cartaSeleccionada ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700, cursor: cartaSeleccionada ? 'pointer' : 'default',
                }}
              >
                {cargando ? 'Confirmando...' : modal === 'crear' ? '⚔️ Publicar desafío' : '⚔️ ¡Aceptar duelo!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
