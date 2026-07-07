'use client'

import { useEffect, useState, useCallback } from 'react'
import { CARTAS, RAREZAS, type Carta, type Rareza } from '@/lib/cartas'
import type { Intercambio } from '@/lib/dao/intercambioDAO'

interface Amigo { id: number; nombre: string; avatar: string | null }

interface Props {
  usuarioId: number
  miColeccion: string[]
  amigos: Amigo[]
}

type Tab = 'mercado' | 'mis-ofertas' | 'recibidas' | 'historial'

const RAREZA_LABEL: Record<Rareza, string> = {
  comun: 'Común', raro: 'Rara', epico: 'Épica', legendario: 'Legendaria', mitico: 'Mítica',
}

const RAREZA_COLOR: Record<Rareza, string> = {
  comun: '#a0a0a0', raro: '#4a9eff', epico: '#b44fff', legendario: '#f5c842', mitico: '#ff6b35',
}

function CartaChip({ cartaId, size = 'md' }: { cartaId: string; size?: 'sm' | 'md' }) {
  const carta = CARTAS.find(c => c.id === cartaId)
  if (!carta) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>???</span>
  const color = RAREZA_COLOR[carta.rareza]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: size === 'sm' ? 6 : 8,
      background: `${color}12`,
      border: `1px solid ${color}40`,
      borderRadius: 8,
      padding: size === 'sm' ? '4px 8px' : '6px 12px',
    }}>
      <img
        src={carta.imagen}
        alt={carta.nombre}
        style={{ width: size === 'sm' ? 28 : 36, height: size === 'sm' ? 40 : 52, objectFit: 'cover', borderRadius: 4 }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
      <div>
        <p style={{ fontSize: size === 'sm' ? '0.72rem' : '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {carta.nombre}
        </p>
        <p style={{ fontSize: '0.62rem', color, fontWeight: 600 }}>{RAREZA_LABEL[carta.rareza]}</p>
      </div>
    </div>
  )
}

function Avatar({ nombre, avatar }: { nombre: string; avatar: string | null }) {
  if (avatar) return (
    <img src={avatar} alt={nombre} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
  )
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'linear-gradient(135deg, #d4af37, #a8821f)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 800, color: '#000',
    }}>
      {nombre[0]?.toUpperCase()}
    </div>
  )
}

export default function IntercambiosClient({ usuarioId, miColeccion, amigos }: Props) {
  const [tab, setTab] = useState<Tab>('mercado')
  const [ofertas, setOfertas] = useState<Intercambio[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [accion, setAccion] = useState<{ tipo: 'aceptar' | 'rechazar' | 'cancelar'; id: number } | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'error' } | null>(null)

  // Estado del modal nueva oferta
  const [cartaOfrecida, setCartaOfrecida] = useState<string>('')
  const [cartaPedida, setCartaPedida] = useState<string>('')
  const [tipoOferta, setTipoOferta] = useState<'mercado' | 'directo'>('mercado')
  const [amigoSeleccionado, setAmigoSeleccionado] = useState<number | null>(null)
  const [coleccionAmigo, setColeccionAmigo] = useState<string[]>([])
  const [cargandoAmigo, setCargandoAmigo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [filtroRareza, setFiltroRareza] = useState<Rareza | ''>('')

  const mostrarToast = (msg: string, tipo: 'ok' | 'error' = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const cargarOfertas = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/intercambios?tab=${tab}`)
      const data = await res.json()
      setOfertas(Array.isArray(data) ? data : [])
    } finally {
      setCargando(false)
    }
  }, [tab])

  useEffect(() => { cargarOfertas() }, [cargarOfertas])

  useEffect(() => {
    if (!amigoSeleccionado) { setColeccionAmigo([]); return }
    setCargandoAmigo(true)
    fetch(`/api/intercambios/coleccion-usuario?usuarioId=${amigoSeleccionado}`)
      .then(r => r.json())
      .then(data => setColeccionAmigo(Array.isArray(data) ? data : []))
      .finally(() => setCargandoAmigo(false))
  }, [amigoSeleccionado])

  // Cuando cambia la carta ofrecida, resetear la pedida
  useEffect(() => { setCartaPedida('') }, [cartaOfrecida])

  const rarezaOfrecida = cartaOfrecida ? CARTAS.find(c => c.id === cartaOfrecida)?.rareza : null

  // Cartas disponibles para ofrecer (las mías)
  const cartasParaOfrecer = CARTAS.filter(c =>
    miColeccion.includes(c.id) &&
    (!filtroRareza || c.rareza === filtroRareza)
  )

  // Cartas que puedo pedir (misma rareza, que no tengo yo, y si es directo: que el amigo tenga)
  const cartasParaPedir = rarezaOfrecida
    ? CARTAS.filter(c => {
        if (c.rareza !== rarezaOfrecida) return false
        if (c.id === cartaOfrecida) return false
        if (tipoOferta === 'directo' && amigoSeleccionado) {
          return coleccionAmigo.includes(c.id)
        }
        return true
      })
    : []

  async function crearOferta() {
    if (!cartaOfrecida || !cartaPedida) return
    if (tipoOferta === 'directo' && !amigoSeleccionado) return
    setEnviando(true)
    try {
      const res = await fetch('/api/intercambios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartaOfrecida,
          cartaPedida,
          receptorId: tipoOferta === 'directo' ? amigoSeleccionado : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { mostrarToast(data.error ?? 'Error al crear la oferta', 'error'); return }
      mostrarToast('¡Oferta publicada!')
      setMostrarModal(false)
      setCartaOfrecida(''); setCartaPedida(''); setAmigoSeleccionado(null); setFiltroRareza('')
      if (tab === 'mis-ofertas' || tab === 'mercado') cargarOfertas()
    } finally {
      setEnviando(false)
    }
  }

  async function ejecutarAccion() {
    if (!accion) return
    setProcesando(true)
    try {
      let res: Response
      if (accion.tipo === 'cancelar') {
        res = await fetch(`/api/intercambios/${accion.id}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/intercambios/${accion.id}/${accion.tipo}`, { method: 'POST' })
      }
      const data = await res.json()
      if (!res.ok) { mostrarToast(data.error ?? 'Error', 'error'); return }
      const msgs = { aceptar: '¡Intercambio realizado! 🎴', rechazar: 'Oferta rechazada', cancelar: 'Oferta cancelada' }
      mostrarToast(msgs[accion.tipo])
      setAccion(null)
      cargarOfertas()
    } finally {
      setProcesando(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'mercado',     label: '🌐 Mercado' },
    { id: 'recibidas',  label: '📬 Para mí' },
    { id: 'mis-ofertas', label: '📤 Mis ofertas' },
    { id: 'historial',  label: '📋 Historial' },
  ]

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 99999,
          background: toast.tipo === 'ok' ? 'rgba(76,193,55,0.15)' : 'rgba(255,80,80,0.15)',
          border: `1px solid ${toast.tipo === 'ok' ? '#4cd137' : '#ff5050'}`,
          borderRadius: 10, padding: '0.75rem 1.25rem',
          color: toast.tipo === 'ok' ? '#4cd137' : '#ff5050',
          fontWeight: 700, fontSize: '0.82rem',
          animation: 'fade-in-bg 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 className="font-title" style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', marginBottom: 4 }}>
            🔄 Intercambios
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            Intercambiá cartas con otros lectores · Solo cartas de igual rareza
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="btn--brand"
          style={{ fontSize: '0.85rem' }}
        >
          + Nueva oferta
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 20,
              border: `1px solid ${tab === t.id ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)'}`,
              background: tab === t.id ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: tab === t.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de ofertas */}
      {cargando ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', textAlign: 'center', padding: '3rem 0' }}>
          Cargando...
        </p>
      ) : ofertas.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 0',
          color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem',
        }}>
          {tab === 'mercado' && '🌐 No hay ofertas en el mercado todavía. ¡Publicá la primera!'}
          {tab === 'recibidas' && '📬 Nadie te envió ofertas directas aún.'}
          {tab === 'mis-ofertas' && '📤 No tenés ofertas activas. Creá una con el botón de arriba.'}
          {tab === 'historial' && '📋 No tenés intercambios en el historial.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ofertas.map(oferta => {
            const cartaOf = CARTAS.find(c => c.id === oferta.carta_ofrecida)
            const cartaPed = CARTAS.find(c => c.id === oferta.carta_pedida)
            const esMia = oferta.solicitante_id === usuarioId
            const puedoAceptar = !esMia && tab !== 'historial' &&
              miColeccion.includes(oferta.carta_pedida) &&
              oferta.estado === 'pendiente'
            const estadoColor = {
              pendiente: 'rgba(212,175,55,0.7)',
              aceptado: '#4cd137',
              rechazado: '#ff5050',
              cancelado: 'rgba(255,255,255,0.3)',
            }[oferta.estado]

            return (
              <div key={oferta.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              }}>
                {/* Usuario */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                  <Avatar nombre={oferta.solicitante_nombre} avatar={oferta.solicitante_avatar_url} />
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                      {esMia ? 'Vos' : oferta.solicitante_nombre}
                    </p>
                    {oferta.receptor_id && (
                      <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>
                        → {esMia ? oferta.receptor_nombre : 'directa'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cartas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <CartaChip cartaId={oferta.carta_ofrecida} size="sm" />
                  <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }}>⇄</span>
                  <CartaChip cartaId={oferta.carta_pedida} size="sm" />
                </div>

                {/* Acciones / estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tab === 'historial' ? (
                    <span style={{ fontSize: '0.7rem', color: estadoColor, fontWeight: 700 }}>
                      {oferta.estado === 'aceptado' ? '✓ Aceptado' :
                       oferta.estado === 'rechazado' ? '✗ Rechazado' : '○ Cancelado'}
                      {oferta.aceptado_por_nombre && ` por ${oferta.aceptado_por_nombre}`}
                    </span>
                  ) : esMia ? (
                    <button
                      onClick={() => setAccion({ tipo: 'cancelar', id: oferta.id })}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(255,80,80,0.3)',
                        background: 'rgba(255,80,80,0.08)', color: '#ff5050',
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {puedoAceptar ? (
                        <button
                          onClick={() => setAccion({ tipo: 'aceptar', id: oferta.id })}
                          style={{
                            padding: '4px 14px', borderRadius: 8,
                            border: '1px solid rgba(76,193,55,0.4)',
                            background: 'rgba(76,193,55,0.12)', color: '#4cd137',
                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Aceptar
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
                          {miColeccion.includes(oferta.carta_pedida) ? '' : 'No tenés esa carta'}
                        </span>
                      )}
                      {tab === 'recibidas' && (
                        <button
                          onClick={() => setAccion({ tipo: 'rechazar', id: oferta.id })}
                          style={{
                            padding: '4px 12px', borderRadius: 8,
                            border: '1px solid rgba(255,80,80,0.3)',
                            background: 'rgba(255,80,80,0.08)', color: '#ff5050',
                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Rechazar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmación acción */}
      {accion && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => !procesando && setAccion(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 16, padding: '2rem',
              maxWidth: 380, width: '90%', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '1.3rem', marginBottom: 8 }}>
              {accion.tipo === 'aceptar' ? '🔄' : accion.tipo === 'rechazar' ? '✗' : '○'}
            </p>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: 8 }}>
              {accion.tipo === 'aceptar' ? '¿Aceptar este intercambio?' :
               accion.tipo === 'rechazar' ? '¿Rechazar esta oferta?' : '¿Cancelar tu oferta?'}
            </p>
            {accion.tipo === 'aceptar' && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                Las cartas se intercambiarán de forma permanente. Esta acción no se puede deshacer.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: '1.25rem' }}>
              <button
                onClick={() => setAccion(null)}
                disabled={procesando}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', fontSize: '0.82rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarAccion}
                disabled={procesando}
                className={accion.tipo === 'aceptar' ? 'btn--brand' : undefined}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 10,
                  border: accion.tipo !== 'aceptar' ? '1px solid rgba(255,80,80,0.4)' : undefined,
                  background: accion.tipo !== 'aceptar' ? 'rgba(255,80,80,0.1)' : undefined,
                  color: accion.tipo !== 'aceptar' ? '#ff5050' : undefined,
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                  opacity: procesando ? 0.5 : 1,
                }}
              >
                {procesando ? 'Procesando...' :
                 accion.tipo === 'aceptar' ? '✓ Confirmar intercambio' :
                 accion.tipo === 'rechazar' ? 'Rechazar' : 'Cancelar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva oferta */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => !enviando && setMostrarModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 16, padding: '1.5rem',
              width: '100%', maxWidth: 760,
              maxHeight: '92vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '1rem' }}>🔄 Nueva oferta de intercambio</h3>
              <button onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Tipo de oferta */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['mercado', 'directo'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTipoOferta(t); setAmigoSeleccionado(null); setCartaPedida('') }}
                    style={{
                      padding: '0.35rem 1rem', borderRadius: 20,
                      border: `1px solid ${tipoOferta === t ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      background: tipoOferta === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: tipoOferta === t ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {t === 'mercado' ? '🌐 Mercado público' : '👤 Directo a un amigo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amigo (si es directo) */}
            {tipoOferta === 'directo' && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Amigo</p>
                {amigos.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No tenés amigos aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {amigos.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setAmigoSeleccionado(a.id === amigoSeleccionado ? null : a.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 20,
                          border: `1px solid ${amigoSeleccionado === a.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          background: amigoSeleccionado === a.id ? 'rgba(212,175,55,0.12)' : 'transparent',
                          color: amigoSeleccionado === a.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <Avatar nombre={a.nombre} avatar={a.avatar} />
                        {a.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filtro rareza (compartido) */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginRight: 4 }}>Filtrar:</span>
              {(['', 'comun', 'raro', 'epico', 'legendario', 'mitico'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setFiltroRareza(r as Rareza | ''); setCartaOfrecida(''); setCartaPedida('') }}
                  style={{
                    padding: '2px 10px', borderRadius: 20,
                    border: `1px solid ${filtroRareza === r ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: filtroRareza === r ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color: filtroRareza === r ? 'var(--accent-gold)' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {r === '' ? 'Todas' : RAREZA_LABEL[r as Rareza]}
                </button>
              ))}
            </div>

            {/* Dos columnas: ofrecés | pedís */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>

              {/* Columna izquierda: ¿Qué ofrecés? */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${cartaOfrecida ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '0.75rem',
              }}>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  ¿Qué ofrecés?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
                  {cartasParaOfrecer.length === 0 ? (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>No tenés cartas de esa rareza.</p>
                  ) : cartasParaOfrecer.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCartaOfrecida(c.id === cartaOfrecida ? '' : c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, textAlign: 'left',
                        border: `1px solid ${cartaOfrecida === c.id ? `${RAREZA_COLOR[c.rareza]}70` : 'rgba(255,255,255,0.06)'}`,
                        background: cartaOfrecida === c.id ? `${RAREZA_COLOR[c.rareza]}18` : 'transparent',
                        cursor: 'pointer', outline: 'none', width: '100%',
                      }}
                    >
                      <img src={c.imagen} alt="" style={{ width: 22, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: cartaOfrecida === c.id ? RAREZA_COLOR[c.rareza] : 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>{c.nombre}</p>
                        <p style={{ fontSize: '0.6rem', color: RAREZA_COLOR[c.rareza], opacity: 0.8 }}>{RAREZA_LABEL[c.rareza]}</p>
                      </div>
                      {cartaOfrecida === c.id && <span style={{ marginLeft: 'auto', color: RAREZA_COLOR[c.rareza], fontSize: '0.8rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna derecha: ¿Qué pedís? */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${cartaPedida ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '0.75rem',
              }}>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  ¿Qué pedís?
                  {rarezaOfrecida && <span style={{ color: RAREZA_COLOR[rarezaOfrecida], fontWeight: 700, marginLeft: 6 }}>({RAREZA_LABEL[rarezaOfrecida]})</span>}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
                  {!cartaOfrecida ? (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Primero elegí una carta para ofrecer →</p>
                  ) : tipoOferta === 'directo' && !amigoSeleccionado ? (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Primero seleccioná un amigo.</p>
                  ) : tipoOferta === 'directo' && cargandoAmigo ? (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>Cargando...</p>
                  ) : cartasParaPedir.length === 0 ? (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>
                      {tipoOferta === 'directo' ? 'Tu amigo no tiene cartas de esa rareza.' : 'No hay más cartas de esa rareza.'}
                    </p>
                  ) : cartasParaPedir.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCartaPedida(c.id === cartaPedida ? '' : c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, textAlign: 'left',
                        border: `1px solid ${cartaPedida === c.id ? `${RAREZA_COLOR[c.rareza]}70` : 'rgba(255,255,255,0.06)'}`,
                        background: cartaPedida === c.id ? `${RAREZA_COLOR[c.rareza]}18` : 'transparent',
                        cursor: 'pointer', outline: 'none', width: '100%',
                      }}
                    >
                      <img src={c.imagen} alt="" style={{ width: 22, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: cartaPedida === c.id ? RAREZA_COLOR[c.rareza] : 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>{c.nombre}</p>
                        <p style={{ fontSize: '0.6rem', color: RAREZA_COLOR[c.rareza], opacity: 0.8 }}>{RAREZA_LABEL[c.rareza]}</p>
                      </div>
                      {cartaPedida === c.id && <span style={{ marginLeft: 'auto', color: RAREZA_COLOR[c.rareza], fontSize: '0.8rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview + botón */}
            {cartaOfrecida && cartaPedida && (
              <div style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 10, padding: '0.6rem 1rem',
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: '1rem',
              }}>
                <CartaChip cartaId={cartaOfrecida} size="sm" />
                <span style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>⇄</span>
                <CartaChip cartaId={cartaPedida} size="sm" />
              </div>
            )}

            <button
              onClick={crearOferta}
              disabled={!cartaOfrecida || !cartaPedida || enviando || (tipoOferta === 'directo' && !amigoSeleccionado)}
              className="btn--brand"
              style={{
                width: '100%', fontSize: '0.88rem',
                opacity: (!cartaOfrecida || !cartaPedida || enviando || (tipoOferta === 'directo' && !amigoSeleccionado)) ? 0.4 : 1,
              }}
            >
              {enviando ? 'Publicando...' : tipoOferta === 'mercado' ? '🌐 Publicar en el mercado' : '📤 Enviar oferta directa'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-bg {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
