'use client'

import { useRef, useState } from 'react'
import { CARTAS, type Carta } from '@/lib/cartas'
import CartaPersonaje from '@/components/CartaPersonaje'

export default function AdminCartasClient() {
  const [seleccionada, setSeleccionada] = useState<Carta>(CARTAS[0])
  const [imagenUrl, setImagenUrl] = useState(seleccionada.imagen)
  const [posX, setPosX] = useState(seleccionada.posicionX)
  const [posY, setPosY] = useState(seleccionada.posicionY)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const frameRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  function seleccionar(carta: Carta) {
    setSeleccionada(carta)
    setImagenUrl(carta.imagen)
    setPosX(carta.posicionX)
    setPosY(carta.posicionY)
    setMensaje('')
  }

  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    dragging.current = true
    const point = 'touches' in e ? e.touches[0] : e
    lastPos.current = { x: point.clientX, y: point.clientY }
  }

  function onDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging.current || !frameRef.current) return
    const point = 'touches' in e ? e.touches[0] : e
    const rect = frameRef.current.getBoundingClientRect()
    const dx = point.clientX - lastPos.current.x
    const dy = point.clientY - lastPos.current.y
    lastPos.current = { x: point.clientX, y: point.clientY }

    setPosX(prev => Math.min(100, Math.max(0, prev - (dx / rect.width) * 100)))
    setPosY(prev => Math.min(100, Math.max(0, prev - (dy / rect.height) * 100)))
  }

  function onDragEnd() {
    dragging.current = false
  }

  async function guardar() {
    setGuardando(true)
    setMensaje('')
    try {
      const res = await fetch('/api/admin/cartas-posicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seleccionada.id, imagen: imagenUrl, posicionX: posX, posicionY: posY }),
      })
      if (!res.ok) { setMensaje('Error al guardar'); return }
      setMensaje('✓ Guardado — recargá la página de colección para verlo')
    } finally {
      setGuardando(false)
    }
  }

  const cartaPreview: Carta = { ...seleccionada, imagen: imagenUrl, posicionX: posX, posicionY: posY }

  return (
    <div className="container py-4" style={{ maxWidth: 1000 }}>
      <h2 className="font-title" style={{ color: 'var(--accent-gold)', marginBottom: 4, fontSize: '1.3rem' }}>
        🛠️ Editor de imágenes — Cartas
      </h2>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
        Solo visible en local. Elegí una carta, pegá la URL de tu imagen y arrastrá para posicionarla.
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 260 }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
              URL de imagen
            </label>
            <input
              type="text"
              value={imagenUrl}
              onChange={e => setImagenUrl(e.target.value)}
              placeholder="https://... o /cartas/archivo.jpg"
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#fff', fontSize: '0.78rem',
              }}
            />
            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Tip: poné tus imágenes generadas en <code>public/cartas/</code> y usá <code>/cartas/nombre.jpg</code>
            </p>
          </div>

          {/* Frame de drag */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
              Arrastrá para posicionar
            </label>
            <div
              ref={frameRef}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
              style={{
                width: 240, height: 240,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'grab',
                border: `2px solid ${seleccionada.color}`,
                userSelect: 'none',
                background: '#1a1a2e',
              }}
            >
              {imagenUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagenUrl}
                  alt="preview"
                  draggable={false}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: `${posX}% ${posY}%`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              X: {posX.toFixed(0)}% · Y: {posY.toFixed(0)}%
            </p>
          </div>

          <button onClick={guardar} disabled={guardando} className="btn--brand" style={{ alignSelf: 'flex-start' }}>
            {guardando ? 'Guardando...' : 'Guardar posición'}
          </button>
          {mensaje && <p style={{ fontSize: '0.75rem', color: mensaje.startsWith('✓') ? '#4cd137' : '#e74c3c' }}>{mensaje}</p>}
        </div>

        {/* Preview real de la carta */}
        <div>
          <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
            Vista previa
          </label>
          <CartaPersonaje carta={cartaPreview} obtenida size="lg" />
        </div>
      </div>

      {/* Lista de cartas */}
      <div style={{ marginTop: '2.5rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Todas las cartas ({CARTAS.length})
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {CARTAS.map(carta => (
            <button
              key={carta.id}
              onClick={() => seleccionar(carta)}
              style={{
                border: carta.id === seleccionada.id ? `2px solid ${carta.color}` : '2px solid transparent',
                borderRadius: 10, padding: 0, background: 'none', cursor: 'pointer',
              }}
            >
              <CartaPersonaje carta={carta} obtenida size="sm" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
