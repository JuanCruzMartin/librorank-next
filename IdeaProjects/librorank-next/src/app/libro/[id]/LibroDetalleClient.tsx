'use client'

import { useState } from 'react'

interface Props {
  libroGlobalId: number
  titulo: string
  autor: string
  portadaUrl: string | null
  anio: number | null
  paginas: number | null
  yaEnBiblioteca: boolean
}

const ESTADOS = ['PENDIENTE', 'LEYENDO', 'LEIDO', 'PAUSA']

export default function LibroDetalleClient({ titulo, autor, portadaUrl, anio, paginas, yaEnBiblioteca }: Props) {
  const [estado, setEstado] = useState('PENDIENTE')
  const [agregado, setAgregado] = useState(yaEnBiblioteca)
  const [cargando, setCargando] = useState(false)
  const [expandido, setExpandido] = useState(false)

  async function agregar() {
    setCargando(true)
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'nuevo',
          titulo,
          autor,
          anio,
          paginas,
          estado,
          portada_url: portadaUrl,
        }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        setAgregado(true)
        setExpandido(false)
      }
    } finally {
      setCargando(false)
    }
  }

  if (agregado) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.4rem', borderRadius: 10, background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.35)' }}>
        <span style={{ fontSize: '1rem' }}>✅</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#27ae60' }}>En tu biblioteca</span>
      </div>
    )
  }

  if (!expandido) {
    return (
      <button
        onClick={() => setExpandido(true)}
        style={{
          padding: '0.6rem 1.6rem', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#d4af37,#f1c40f)',
          fontWeight: 700, fontSize: '0.9rem', color: '#000', cursor: 'pointer',
        }}
      >
        + Agregar a mi biblioteca
      </button>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <select
        value={estado}
        onChange={e => setEstado(e.target.value)}
        style={{
          background: '#2c2724', border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: 8, padding: '0.5rem 0.85rem',
          color: '#fff', fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
        }}
      >
        {ESTADOS.map(e => (
          <option key={e} value={e} style={{ background: '#1a1a1a' }}>
            {e === 'LEIDO' ? '✅ Leído' : e === 'LEYENDO' ? '📖 Leyendo' : e === 'PENDIENTE' ? '🕐 Pendiente' : '⏸ Pausa'}
          </option>
        ))}
      </select>
      <button
        onClick={agregar}
        disabled={cargando}
        style={{
          padding: '0.55rem 1.4rem', borderRadius: 8, border: 'none',
          background: cargando ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#d4af37,#f1c40f)',
          fontWeight: 700, fontSize: '0.85rem', color: '#000',
          cursor: cargando ? 'default' : 'pointer',
        }}
      >
        {cargando ? '...' : 'Confirmar'}
      </button>
      <button
        onClick={() => setExpandido(false)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.5rem' }}
      >
        Cancelar
      </button>
    </div>
  )
}
