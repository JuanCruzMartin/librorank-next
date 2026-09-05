'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Duelo, StatsGlobales, StatsRival, TipoDuelo } from '@/lib/dao/dueloDAO'
import type { Carta } from '@/lib/cartas'
import { rarezaVisual, RAREZA_VISUAL_COLOR } from '@/lib/cartas'

const RAREZA_COLOR = RAREZA_VISUAL_COLOR

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface Props {
  usuarioId: number
  salaInicial: Duelo[]
  dueloActivoInicial: Duelo | null
  historialInicial: Duelo[]
  misCartas: Carta[]
  cartasMap: Record<string, Carta>
  statsIniciales: StatsGlobales
  statsPorRivalIniciales: StatsRival[]
}

interface PreguntaData {
  texto: string
  opciones: string[]
  respuesta?: number
}

interface ResultadoRonda {
  ronda: number
  ganadorRonda: 'retador' | 'rival' | 'empate'
  respuestaCorrecta: number
  retadorAcerto?: boolean
  rivalAcerto?: boolean
  puntosRetador: number
  puntosRival: number
}

interface ResultadoFinal {
  gane: boolean
  empate: boolean
  tipo: TipoDuelo
  cartaGanada?: string
  monedasGanadas?: number
  puntosRetador: number
  puntosRival: number
}

export default function ArenaClient({ usuarioId, salaInicial, dueloActivoInicial, historialInicial, misCartas, cartasMap, statsIniciales, statsPorRivalIniciales }: Props) {
  const [sala, setSala] = useState<Duelo[]>(salaInicial)
  const [dueloActivo, setDueloActivo] = useState<Duelo | null>(dueloActivoInicial)
  const [historial, setHistorial] = useState<Duelo[]>(historialInicial)
  const [pregunta, setPregunta] = useState<PreguntaData | null>(null)
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null)
  const [esperandoRival, setEsperandoRival] = useState(false)
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null)
  const [cartaSeleccionada, setCartaSeleccionada] = useState<string | null>(null)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDuelo>('estandar')
  const [modal, setModal] = useState<'crear' | 'unirse' | null>(null)
  const [dueloParaUnirse, setDueloParaUnirse] = useState<Duelo | null>(null)
  const [cargando, setCargando] = useState(false)
  const [stats, setStats] = useState<StatsGlobales>(statsIniciales)
  const [statsPorRival, setStatsPorRival] = useState<StatsRival[]>(statsPorRivalIniciales)
  const [timer, setTimer] = useState<number>(25)
  const [respondioEarly, setRespondioEarly] = useState(false)
  const [cuentaRegresiva, setCuentaRegresiva] = useState<number | null>(null)

  // Mejor de 3
  const [rondaActual, setRondaActual] = useState(1)
  const [puntosRetador, setPuntosRetador] = useState(0)
  const [puntosRival, setPuntosRival] = useState(0)
  const [resultadoRonda, setResultadoRonda] = useState<ResultadoRonda | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preguntaRef = useRef<PreguntaData | null>(null)
  const lastSeenRondaRef = useRef(0)
  const overlayActiveRef = useRef(false)
  const mountedRef = useRef(true)
  const dueloIdRef = useRef<number | null>(null)

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const esRetador = dueloActivo?.retador_id === usuarioId

  function clearPolling() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  function clearTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  function iniciarTimer() {
    clearTimer()
    setTimer(25)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearTimer(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function mostrarResultadoRondaYAvanzar(resRonda: ResultadoRonda, dueloId: number) {
    overlayActiveRef.current = true
    clearTimer()
    setResultadoRonda(resRonda)
    setRondaActual(resRonda.ronda + 1)
    setPuntosRetador(resRonda.puntosRetador)
    setPuntosRival(resRonda.puntosRival)

    await new Promise(resolve => setTimeout(resolve, 5000))
    if (!mountedRef.current) return

    setResultadoRonda(null)
    setRespuestaSeleccionada(null)
    setRespondioEarly(false)
    overlayActiveRef.current = false

    try {
      const res = await fetch(`/api/duelos/${dueloId}`)
      if (!res.ok) return
      const data = await res.json()
      if (!mountedRef.current) return
      if (data.preguntaActual) {
        preguntaRef.current = data.preguntaActual
        setPregunta(data.preguntaActual)
      }
    } catch { /* continúa */ }

    if (mountedRef.current) setCuentaRegresiva(3)
  }

  const pollDuelo = useCallback(async () => {
    if (!dueloIdRef.current) return
    const res = await fetch(`/api/duelos/${dueloIdRef.current}`)
    if (!res.ok) return
    const data = await res.json()
    const d: Duelo = data.duelo

    if (!mountedRef.current) return
    setDueloActivo(d)

    if (d.estado === 'en_curso') {
      const nuevoRonda = d.ronda_actual ?? 1
      setPuntosRetador(d.puntos_retador ?? 0)
      setPuntosRival(d.puntos_rival ?? 0)
      setRondaActual(nuevoRonda)

      if (lastSeenRondaRef.current === 0 && data.preguntaActual && !preguntaRef.current) {
        // Primera vez viendo el duelo en curso
        lastSeenRondaRef.current = nuevoRonda
        preguntaRef.current = data.preguntaActual
        setPregunta(data.preguntaActual)
        setCuentaRegresiva(3)
      } else if (nuevoRonda > lastSeenRondaRef.current && lastSeenRondaRef.current > 0 && !overlayActiveRef.current) {
        // Ronda avanzó — mostrar resultado intermedio
        lastSeenRondaRef.current = nuevoRonda
        if (data.resultadoRondaAnterior) {
          mostrarResultadoRondaYAvanzar(data.resultadoRondaAnterior, d.id)
        }
      }
    }

    if (d.estado === 'terminado') {
      clearPolling()
      clearTimer()
      const gane = d.ganador_id === usuarioId
      const empate = d.ganador_id === null
      const tipo: TipoDuelo = d.tipo ?? 'estandar'
      const esRet = d.retador_id === usuarioId
      const cartaGanada = gane && tipo === 'apuesta'
        ? (esRet ? d.carta_rival : d.carta_retador) ?? undefined
        : undefined
      const monedasGanadas = gane && tipo === 'estandar' ? 40 : undefined
      setResultado({ gane, empate, tipo, cartaGanada, monedasGanadas, puntosRetador: d.puntos_retador ?? 0, puntosRival: d.puntos_rival ?? 0 })
      setHistorial(prev => [d, ...prev].slice(0, 5))
    }

    if (d.estado === 'expirado') {
      clearPolling()
      clearTimer()
      setDueloActivo(null)
      refrescarSala()
    }
  }, [usuarioId, esRetador])

  useEffect(() => {
    if (dueloActivo && dueloActivo.estado !== 'terminado') {
      dueloIdRef.current = dueloActivo.id
      clearPolling()
      pollRef.current = setInterval(pollDuelo, 2000)
      if (dueloActivo.estado === 'en_curso') {
        fetch(`/api/duelos/${dueloActivo.id}`).then(r => r.json()).then(data => {
          if (!mountedRef.current) return
          const ronda = data.duelo?.ronda_actual ?? 1
          lastSeenRondaRef.current = ronda
          setRondaActual(ronda)
          setPuntosRetador(data.duelo?.puntos_retador ?? 0)
          setPuntosRival(data.duelo?.puntos_rival ?? 0)
          if (data.preguntaActual && !preguntaRef.current) {
            preguntaRef.current = data.preguntaActual
            setPregunta(data.preguntaActual)
            setCuentaRegresiva(3)
          }
        })
      }
    }
    return () => { clearPolling(); clearTimer() }
  }, [dueloActivo?.id])

  useEffect(() => {
    if (cuentaRegresiva === null) return
    if (cuentaRegresiva === 0) { setCuentaRegresiva(null); iniciarTimer(); return }
    const id = setTimeout(() => setCuentaRegresiva(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [cuentaRegresiva])

  async function refrescarSala() {
    const res = await fetch('/api/duelos')
    if (!res.ok) return
    const data = await res.json()
    setSala(data.sala)
    if (data.stats) setStats(data.stats)
    if (data.statsPorRival) setStatsPorRival(data.statsPorRival)
  }

  async function crearDesafio() {
    if (!cartaSeleccionada || cargando) return
    setCargando(true)
    const res = await fetch('/api/duelos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'crear', cartaId: cartaSeleccionada, tipo: tipoSeleccionado }),
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
      lastSeenRondaRef.current = 1
      setRondaActual(1)
      if (d2.preguntaActual) {
        preguntaRef.current = d2.preguntaActual
        setPregunta(d2.preguntaActual)
        setCuentaRegresiva(3)
      }
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
      const tipo: TipoDuelo = d.tipo ?? 'estandar'
      const cartaGanada = gane && tipo === 'apuesta'
        ? (esRetador ? d.carta_rival : d.carta_retador) ?? undefined
        : undefined
      const monedasGanadas = gane && tipo === 'estandar' ? 40 : undefined
      setResultado({ gane, empate, tipo, cartaGanada, monedasGanadas, puntosRetador: data.puntosRetador ?? 0, puntosRival: data.puntosRival ?? 0 })
      setHistorial(prev => [d, ...prev].slice(0, 5))
      if (data.respuestaCorrecta !== undefined) {
        setPregunta(p => p ? { ...p, respuesta: data.respuestaCorrecta } : p)
      }
    } else if (data.rondaTerminada) {
      // Esta ronda terminó, el match continúa
      if (data.respuestaCorrecta !== undefined) {
        setPregunta(p => p ? { ...p, respuesta: data.respuestaCorrecta } : p)
      }
      const nextRonda = (dueloActivo.ronda_actual ?? 1) + 1
      lastSeenRondaRef.current = nextRonda
      overlayActiveRef.current = true
      mostrarResultadoRondaYAvanzar({
        ronda: dueloActivo.ronda_actual ?? 1,
        ganadorRonda: data.ganadorRonda,
        respuestaCorrecta: data.respuestaCorrecta,
        retadorAcerto: data.retadorAcerto,
        rivalAcerto: data.rivalAcerto,
        puntosRetador: data.puntosRetador ?? 0,
        puntosRival: data.puntosRival ?? 0,
      }, dueloActivo.id)
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
    preguntaRef.current = null
    setRespuestaSeleccionada(null)
    setEsperandoRival(false)
    setRespondioEarly(false)
    setTimer(25)
    setRondaActual(1)
    setPuntosRetador(0)
    setPuntosRival(0)
    setResultadoRonda(null)
    lastSeenRondaRef.current = 0
    overlayActiveRef.current = false
    dueloIdRef.current = null
    setTipoSeleccionado('estandar')
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
    if (respuestaSeleccionada === null) return '1px solid rgba(255,255,255,0.1)'
    if (pregunta?.respuesta !== undefined) {
      if (idx === pregunta.respuesta) return '2px solid #27ae60'
      if (idx === respuestaSeleccionada) return '2px solid #e74c3c'
    }
    return '1px solid rgba(255,255,255,0.08)'
  }

  function MiniCarta({ cartaId, size = 'sm' }: { cartaId: string; size?: 'sm' | 'md' }) {
    const c = cartasMap[cartaId]
    if (!c) return <div style={{ width: size === 'md' ? 80 : 52, height: size === 'md' ? 110 : 72, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
    const color = RAREZA_COLOR[rarezaVisual(c.rareza)]
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

  function ScoreDots({ pts, max = 2, color }: { pts: number; max?: number; color: string }) {
    return (
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 11, height: 11, borderRadius: '50%',
            background: i < pts ? color : 'rgba(255,255,255,0.12)',
            border: `1px solid ${i < pts ? color : 'rgba(255,255,255,0.2)'}`,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    )
  }

  // ── RESULTADO FINAL ──
  if (resultado && dueloActivo) {
    const misPts = esRetador ? resultado.puntosRetador : resultado.puntosRival
    const rivalPts = esRetador ? resultado.puntosRival : resultado.puntosRetador
    return (
      <div className="text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.4rem' }}>
          {resultado.empate ? '🤝' : resultado.gane ? '🏆' : '💀'}
        </div>
        <h2 className="font-title" style={{ color: resultado.empate ? '#d4af37' : resultado.gane ? '#27ae60' : '#e74c3c', marginBottom: '0.25rem' }}>
          {resultado.empate ? '¡Empate!' : resultado.gane ? '¡Ganaste!' : '¡Perdiste!'}
        </h2>

        {/* Marcador final */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: '1rem' }}>
          <ScoreDots pts={misPts} color="#27ae60" />
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{misPts} — {rivalPts}</span>
          <ScoreDots pts={rivalPts} color="#e74c3c" />
        </div>

        {resultado.empate && (
          <p className="text-muted">
            {resultado.tipo === 'apuesta' ? 'Las cartas vuelven a sus dueños.' : 'Nadie suma monedas.'}
          </p>
        )}
        {resultado.gane && resultado.cartaGanada && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Te llevás la carta de tu rival:</p>
            <div className="d-flex justify-content-center mt-2 mb-3">
              <MiniCarta cartaId={resultado.cartaGanada} size="md" />
            </div>
          </div>
        )}
        {resultado.gane && resultado.monedasGanadas && (
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d4af37', marginBottom: '0.75rem' }}>
            +{resultado.monedasGanadas} ⚡
          </div>
        )}
        {!resultado.gane && !resultado.empate && (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            {resultado.tipo === 'apuesta' ? 'Tu rival se llevó tu carta.' : 'Tu rival sumó las monedas.'}
          </p>
        )}

        {pregunta && pregunta.respuesta !== undefined && (
          <div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 700, marginBottom: 4 }}>✓ Última respuesta correcta</div>
            <div style={{ fontSize: '0.85rem', color: '#fff' }}>{pregunta.opciones[pregunta.respuesta]}</div>
          </div>
        )}

        <button onClick={reiniciar} className="btn--brand" style={{ marginTop: '0.5rem' }}>
          Volver a la Arena
        </button>
      </div>
    )
  }

  // ── RESULTADO DE RONDA (overlay entre rondas) ──
  if (resultadoRonda && dueloActivo) {
    const esGanadorRonda = (resultadoRonda.ganadorRonda === 'retador') === esRetador
    const esEmpateRonda = resultadoRonda.ganadorRonda === 'empate'
    const misPts = esRetador ? resultadoRonda.puntosRetador : resultadoRonda.puntosRival
    const rivalPts = esRetador ? resultadoRonda.puntosRival : resultadoRonda.puntosRetador
    const yoAcerte = esRetador ? resultadoRonda.retadorAcerto : resultadoRonda.rivalAcerto
    const rivalAcerto = esRetador ? resultadoRonda.rivalAcerto : resultadoRonda.retadorAcerto

    // Razón por la que ganaste/perdiste/empataste
    let razonTexto = ''
    let razonColor = 'rgba(255,255,255,0.45)'
    if (resultadoRonda.retadorAcerto !== undefined) {
      if (yoAcerte && !rivalAcerto) {
        razonTexto = '¡Respondiste bien y tu rival se equivocó!'
        razonColor = '#27ae60'
      } else if (!yoAcerte && rivalAcerto) {
        razonTexto = 'Tu rival respondió bien y vos te equivocaste'
        razonColor = '#e74c3c'
      } else if (!yoAcerte && !rivalAcerto) {
        razonTexto = 'Ninguno de los dos acertó — ronda empatada'
        razonColor = '#d4af37'
      } else if (yoAcerte && rivalAcerto && esGanadorRonda) {
        razonTexto = '¡Ambos respondieron bien, pero fuiste más rápido!'
        razonColor = '#27ae60'
      } else if (yoAcerte && rivalAcerto && !esGanadorRonda) {
        razonTexto = 'Ambos respondieron bien, pero tu rival fue más rápido'
        razonColor = '#e74c3c'
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>
          {esEmpateRonda ? '🤝' : esGanadorRonda ? '✅' : '❌'}
        </div>
        <h3 className="font-title" style={{ color: esEmpateRonda ? '#d4af37' : esGanadorRonda ? '#27ae60' : '#e74c3c', margin: 0 }}>
          {esEmpateRonda ? 'Ronda empatada' : esGanadorRonda ? `¡Ganaste la ronda ${resultadoRonda.ronda}!` : `Perdiste la ronda ${resultadoRonda.ronda}`}
        </h3>

        {/* Razón */}
        {razonTexto && (
          <p style={{ fontSize: '0.85rem', color: razonColor, margin: 0, textAlign: 'center', maxWidth: 360, fontWeight: 600 }}>
            {razonTexto}
          </p>
        )}

        {/* Respuesta correcta */}
        {pregunta && resultadoRonda.respuestaCorrecta !== undefined && (
          <div style={{ background: 'rgba(39,174,96,0.12)', border: '2px solid rgba(39,174,96,0.5)', borderRadius: 14, padding: '1rem 1.25rem', maxWidth: 440, textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Respuesta correcta
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#27ae60' }}>
              ✓ {pregunta.opciones[resultadoRonda.respuestaCorrecta]}
            </div>
            {pregunta.texto && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                {pregunta.texto}
              </div>
            )}
          </div>
        )}

        {/* Marcador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
          <ScoreDots pts={misPts} color="#27ae60" />
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: 2 }}>{misPts} — {rivalPts}</span>
          <ScoreDots pts={rivalPts} color="#e74c3c" />
        </div>

        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px' }}>
          Ronda {resultadoRonda.ronda + 1} en 5 segundos...
        </div>
      </div>
    )
  }

  // ── CUENTA REGRESIVA ──
  if (dueloActivo?.estado === 'en_curso' && pregunta && cuentaRegresiva !== null && cuentaRegresiva > 0) {
    const colores: Record<number, string> = { 3: '#27ae60', 2: '#e67e22', 1: '#e74c3c' }
    const color = colores[cuentaRegresiva] ?? '#d4af37'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Ronda {rondaActual} / 3
        </div>
        <div style={{ fontSize: '8rem', fontWeight: 900, color, textShadow: `0 0 60px ${color}80`, animation: 'cuentaAnim 0.9s ease-in-out', lineHeight: 1 }}>
          {cuentaRegresiva}
        </div>
        <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ¡Prepárate!
        </div>
        <style>{`@keyframes cuentaAnim { 0% { transform: scale(1.8); opacity: 0 } 40% { transform: scale(1); opacity: 1 } 100% { transform: scale(0.85); opacity: 0.6 } }`}</style>
      </div>
    )
  }

  // ── DUELO EN CURSO ──
  if (dueloActivo?.estado === 'en_curso' && pregunta) {
    const rival = esRetador
      ? { nombre: dueloActivo.rival_nombre, avatar: dueloActivo.rival_avatar, carta: dueloActivo.carta_rival }
      : { nombre: dueloActivo.retador_nombre, avatar: dueloActivo.retador_avatar, carta: dueloActivo.carta_retador }
    const miCarta = esRetador ? dueloActivo.carta_retador : dueloActivo.carta_rival
    const misPts = esRetador ? puntosRetador : puntosRival
    const rivalPts = esRetador ? puntosRival : puntosRetador

    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Cabecera: yo vs rival con marcador */}
        <div className="d-flex align-items-center justify-content-between mb-3 gap-3">
          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Tu carta</div>
            {miCarta && <MiniCarta cartaId={miCarta} size="md" />}
          </div>

          <div className="text-center">
            {/* Marcador */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Ronda {rondaActual}/3
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ScoreDots pts={misPts} color="#27ae60" />
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d4af37' }}>⚔️</span>
                <ScoreDots pts={rivalPts} color="#e74c3c" />
              </div>
              {!respondioEarly && (
                <div style={{
                  fontSize: '1.1rem', fontWeight: 900,
                  color: timer <= 10 ? '#e74c3c' : '#fff',
                  background: timer <= 10 ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 8, padding: '2px 10px', transition: 'all 0.3s',
                }}>
                  {timer}s
                </div>
              )}
            </div>
          </div>

          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Carta rival</div>
            {rival.carta && <MiniCarta cartaId={rival.carta} size="md" />}
          </div>
        </div>

        {/* Pregunta */}
        <div
          className="card p-4 mb-3"
          onCopy={e => e.preventDefault()}
          onContextMenu={e => e.preventDefault()}
          style={{ userSelect: 'none' } as React.CSSProperties}
        >
          <div style={{ fontSize: '0.65rem', color: '#d4af37', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            ⚔️ Pregunta literaria · Ronda {rondaActual}
          </div>
          <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, lineHeight: 1.5, marginBottom: '1.25rem', pointerEvents: 'none' }}>
            {pregunta.texto}
          </p>

          {(() => {
            const shuffledIdx = seededShuffle([0, 1, 2, 3], dueloActivo!.id + rondaActual * 1000)
            const opcionesOrdenadas = shuffledIdx.map(i => pregunta.opciones[i])
            return (
              <div className="d-flex flex-column gap-2">
                {opcionesOrdenadas.map((op, si) => {
                  const originalIdx = shuffledIdx[si]
                  return (
                    <button
                      key={si}
                      onClick={() => enviarRespuesta(originalIdx)}
                      disabled={respuestaSeleccionada !== null || timer === 0}
                      style={{
                        padding: '0.7rem 1rem', borderRadius: 10, border: borderOpcion(originalIdx),
                        background: colorOpcion(originalIdx), color: '#fff', textAlign: 'left',
                        fontSize: '0.88rem', cursor: respuestaSeleccionada !== null ? 'default' : 'pointer',
                        transition: 'all 0.15s', fontWeight: respuestaSeleccionada === originalIdx ? 700 : 400,
                        display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', minWidth: 18 }}>
                        {String.fromCharCode(65 + si)}
                      </span>
                      {op}
                      {respuestaSeleccionada !== null && pregunta.respuesta !== undefined && originalIdx === pregunta.respuesta && (
                        <span style={{ marginLeft: 'auto', color: '#27ae60' }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {respondioEarly && respuestaSeleccionada !== null && resultado === null && !resultadoRonda && (
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

  // ── SALA PRINCIPAL ──
  return (
    <div>
      <div className="row g-4">
        {/* Columna izquierda: sala */}
        <div className="col-lg-8">

          {/* Tu desafío pendiente (visible en la sala mientras esperás) */}
          {dueloActivo?.estado === 'esperando' && (() => {
            const carta = cartasMap[dueloActivo.carta_retador]
            const color = carta ? RAREZA_COLOR[rarezaVisual(carta.rareza)] : '#9b59b6'
            const esApuesta = dueloActivo.tipo === 'apuesta'
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(74,20,140,0.1) 100%)',
                border: '2px solid rgba(124,58,237,0.5)',
                borderRadius: 14, padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 0 24px rgba(124,58,237,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-dot 1.5s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#a78bfa' }}>Tu desafío · Esperando rival...</span>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: esApuesta ? 'rgba(212,175,55,0.12)' : 'rgba(39,174,96,0.12)',
                    border: `1px solid ${esApuesta ? 'rgba(212,175,55,0.35)' : 'rgba(39,174,96,0.35)'}`,
                    borderRadius: 20, padding: '2px 10px',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: esApuesta ? '#d4af37' : '#27ae60',
                  }}>
                    {esApuesta ? '🃏 Apuesta' : '⚡ Estándar'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <MiniCarta cartaId={dueloActivo.carta_retador} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', color: color, fontWeight: 700, marginBottom: 4 }}>
                      {carta?.nombre ?? dueloActivo.carta_retador}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem' }}>
                      {esApuesta ? 'Cualquier rival puede aceptar esta apuesta' : 'Cualquier rival puede aceptar este duelo estándar'}
                    </div>
                    <button
                      onClick={cancelarDesafio}
                      style={{
                        background: 'rgba(231,76,60,0.08)',
                        border: '1px solid rgba(231,76,60,0.35)',
                        borderRadius: 8, color: '#e74c3c',
                        padding: '0.3rem 0.85rem',
                        fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Cancelar desafío
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="font-title mb-0" style={{ color: '#fff' }}>Desafíos disponibles</h5>
            <button onClick={refrescarSala} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ↻ Actualizar
            </button>
          </div>

          {sala.length === 0 ? (
            <div className="card text-center" style={{ padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏟️</div>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                {dueloActivo?.estado === 'esperando'
                  ? 'Tu desafío ya está en la arena. Esperando rival...'
                  : 'La arena está vacía. ¡Sé el primero en desafiar!'}
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sala.map(d => {
                const carta = cartasMap[d.carta_retador]
                const color = carta ? RAREZA_COLOR[rarezaVisual(carta.rareza)] : '#9e9e9e'
                const rarezaLabel = carta ? rarezaVisual(carta.rareza).toUpperCase() : '?'
                const esApuesta = d.tipo === 'apuesta'
                return (
                  <div key={d.id} className="card p-3" style={{ border: `1px solid ${color}40`, position: 'relative' }}>
                    {/* Badges */}
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                      <div style={{
                        background: esApuesta ? 'rgba(212,175,55,0.15)' : 'rgba(39,174,96,0.15)',
                        border: `1px solid ${esApuesta ? 'rgba(212,175,55,0.4)' : 'rgba(39,174,96,0.4)'}`,
                        borderRadius: 20, padding: '2px 8px',
                        fontSize: '0.6rem', fontWeight: 800, color: esApuesta ? '#d4af37' : '#27ae60',
                      }}>
                        {esApuesta ? '🃏 Apuesta' : '⚡ Estándar'}
                      </div>
                      <div style={{
                        background: `${color}22`, border: `1px solid ${color}60`,
                        borderRadius: 20, padding: '2px 8px',
                        fontSize: '0.6rem', fontWeight: 800, color,
                      }}>
                        {rarezaLabel}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div style={{ flexShrink: 0 }}>
                        {d.retador_avatar ? (
                          <img src={d.retador_avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,175,55,0.3)' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#d4af37' }}>
                            {d.retador_nombre[0]}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{d.retador_nombre}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>@{d.retador_username}</div>
                        {carta && (
                          <div style={{ fontSize: '0.75rem', color, fontWeight: 700, marginTop: 2 }}>
                            {carta.simbolo} {carta.nombre}
                          </div>
                        )}
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {esApuesta
                            ? <>Apostá una carta <span style={{ color, fontWeight: 700 }}>{carta ? rarezaVisual(carta.rareza) : ''}</span></>
                            : <>Elegí una carta <span style={{ color, fontWeight: 700 }}>{carta ? rarezaVisual(carta.rareza) : ''}</span> para jugar</>
                          }
                        </div>
                      </div>

                      <MiniCarta cartaId={d.carta_retador} size="sm" />

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
            onClick={() => !dueloActivo && setModal('crear')}
            disabled={!!dueloActivo}
            title={dueloActivo ? 'Ya tenés un desafío activo' : undefined}
            style={{
              width: '100%', padding: '1rem', borderRadius: 12,
              background: dueloActivo
                ? 'rgba(124,58,237,0.15)'
                : 'linear-gradient(135deg, #7d3c98, #9b59b6)',
              border: dueloActivo ? '1px solid rgba(124,58,237,0.3)' : 'none',
              color: dueloActivo ? 'rgba(167,139,250,0.5)' : '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: dueloActivo ? 'not-allowed' : 'pointer',
              marginBottom: '1.5rem',
              boxShadow: dueloActivo ? 'none' : '0 4px 20px rgba(155,89,182,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {dueloActivo?.estado === 'esperando' ? '⏳ Esperando rival...' : '⚔️ Crear desafío'}
          </button>

          {/* Stats globales */}
          {(stats.victorias > 0 || stats.derrotas > 0 || stats.empates > 0) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              {[
                { label: 'V', valor: stats.victorias, color: '#27ae60', bg: 'rgba(39,174,96,0.1)' },
                { label: 'D', valor: stats.derrotas, color: '#e74c3c', bg: 'rgba(231,76,60,0.1)' },
                { label: 'E', valor: stats.empates, color: '#d4af37', bg: 'rgba(212,175,55,0.1)' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '0.5rem 0.25rem',
                  borderRadius: 10, background: s.bg, border: `1px solid ${s.color}30`,
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

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
                  const rivalId = esRet ? d.rival_id : d.retador_id
                  const rivalNombre = esRet ? d.rival_nombre : d.retador_nombre
                  const h2h = statsPorRival.find(s => s.rival_id === rivalId)
                  const misPts = esRet ? d.puntos_retador : d.puntos_rival
                  const rivalPts2 = esRet ? d.puntos_rival : d.puntos_retador
                  return (
                    <div key={d.id} style={{
                      padding: '0.6rem 0.85rem', borderRadius: 10, fontSize: '0.78rem',
                      background: empate ? 'rgba(212,175,55,0.06)' : gane ? 'rgba(39,174,96,0.06)' : 'rgba(231,76,60,0.06)',
                      border: `1px solid ${empate ? 'rgba(212,175,55,0.2)' : gane ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>vs {rivalNombre ?? '?'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{misPts}–{rivalPts2}</span>
                          <span style={{ fontWeight: 700, color: empate ? '#d4af37' : gane ? '#27ae60' : '#e74c3c' }}>
                            {empate ? '🤝' : gane ? '🏆' : '💀'}
                          </span>
                        </div>
                      </div>
                      {h2h && (
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                          H2H: <span style={{ color: '#27ae60' }}>{h2h.victorias}V</span> · <span style={{ color: '#e74c3c' }}>{h2h.derrotas}D</span> · <span style={{ color: '#d4af37' }}>{h2h.empates}E</span>
                        </div>
                      )}
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
            style={{ background: '#1a1a2e', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: '1.5rem', maxWidth: 560, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <h5 className="font-title mb-3" style={{ color: '#d4af37' }}>
              {modal === 'crear' ? '⚔️ Nuevo desafío' : `⚔️ Aceptar duelo de ${dueloParaUnirse?.retador_nombre}`}
            </h5>

            {/* Selector de tipo (solo al crear) */}
            {modal === 'crear' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                {(['estandar', 'apuesta'] as TipoDuelo[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoSeleccionado(t)}
                    style={{
                      flex: 1, padding: '0.75rem 0.5rem', borderRadius: 10,
                      border: tipoSeleccionado === t
                        ? `2px solid ${t === 'estandar' ? '#27ae60' : '#d4af37'}`
                        : '1px solid rgba(255,255,255,0.1)',
                      background: tipoSeleccionado === t
                        ? `${t === 'estandar' ? '#27ae60' : '#d4af37'}15`
                        : 'transparent',
                      color: '#fff', cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{t === 'estandar' ? '⚡' : '🃏'}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{t === 'estandar' ? 'Estándar' : 'Apuesta'}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {t === 'estandar' ? 'Ganás 40 ⚡ monedas' : 'Ganás la carta rival'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Info de duelo de apuesta al unirse */}
            {modal === 'unirse' && dueloParaUnirse && (() => {
              const cartaRival = cartasMap[dueloParaUnirse.carta_retador]
              const colorRiv = cartaRival ? RAREZA_COLOR[cartaRival.rareza] : '#9e9e9e'
              const esApuesta = dueloParaUnirse.tipo === 'apuesta'
              return (
                <div style={{ background: `${colorRiv}12`, border: `1px solid ${colorRiv}35`, borderRadius: 10, padding: '0.6rem 0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MiniCarta cartaId={dueloParaUnirse.carta_retador} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: esApuesta ? '#d4af37' : '#27ae60', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {esApuesta ? '🃏 Duelo de apuesta' : '⚡ Duelo estándar'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>{cartaRival?.nombre}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                      {esApuesta
                        ? <>Apostá una carta <span style={{ color: colorRiv, fontWeight: 700 }}>{cartaRival ? rarezaVisual(cartaRival.rareza) : ''}</span> — si perdés, tu rival se la lleva</>
                        : <>Elegí una carta <span style={{ color: colorRiv, fontWeight: 700 }}>{cartaRival ? rarezaVisual(cartaRival.rareza) : ''}</span> — sin riesgo de perderla</>
                      }
                    </div>
                  </div>
                </div>
              )
            })()}

            <p className="text-muted small mb-3">
              {modal === 'crear'
                ? (tipoSeleccionado === 'apuesta' ? 'Si perdés, tu rival se lleva esta carta.' : 'Tu carta define la rareza. No la apostás.')
                : (dueloParaUnirse?.tipo === 'apuesta' ? 'Si perdés, tu rival se lleva esta carta.' : 'Tu carta define la rareza. No la apostás.')
              }
            </p>

            {(() => {
              const rarezaRequerida = modal === 'unirse' && dueloParaUnirse
                ? cartasMap[dueloParaUnirse.carta_retador]?.rareza
                : null
              const cartasFiltradas = rarezaRequerida
                ? misCartas.filter(c => c.rareza === rarezaRequerida)
                : misCartas

              if (cartasFiltradas.length === 0) return (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>
                  {rarezaRequerida
                    ? `No tenés cartas ${rarezaRequerida}s para este duelo.`
                    : 'No tenés cartas en tu colección todavía.'}
                </p>
              )

              return (
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem', padding: '0.25rem' }}>
                    {cartasFiltradas.map(c => {
                      const color = RAREZA_COLOR[rarezaVisual(c.rareza)]
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
              )
            })()}

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
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
