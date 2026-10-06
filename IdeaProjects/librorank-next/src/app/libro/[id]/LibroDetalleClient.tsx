'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StarPicker from '@/components/StarPicker'
import MoodPicker from '@/components/MoodPicker'

interface LibroUsuarioData {
  id: number
  estrellas: number
  resena: string | null
  mood: string | null
  estado: string
  genero: string | null
}

interface Props {
  libroGlobalId: number
  titulo: string
  autor: string
  portadaUrl: string | null
  anio: number | null
  paginas: number | null
  yaEnBiblioteca: boolean
  libroUsuario?: LibroUsuarioData
}

const ESTADOS = ['PENDIENTE', 'LEYENDO', 'LEIDO', 'PAUSA', 'DNF']
const ESTADO_LABEL: Record<string, string> = {
  LEIDO: '✅ Leído', LEYENDO: '📖 Leyendo', PENDIENTE: '🕐 Pendiente', PAUSA: '⏸ Pausa', DNF: '❌ Abandoné',
}

export default function LibroDetalleClient({ titulo, autor, portadaUrl, anio, paginas, yaEnBiblioteca, libroUsuario }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState('PENDIENTE')
  const [agregado, setAgregado] = useState(yaEnBiblioteca)
  const [cargando, setCargando] = useState(false)
  const [expandido, setExpandido] = useState(false)

  // Review panel state
  const [reviewAbierto, setReviewAbierto] = useState(false)
  const [reviewEstrellas, setReviewEstrellas] = useState(libroUsuario?.estrellas ?? 0)
  const [reviewResena, setReviewResena] = useState(libroUsuario?.resena ?? '')
  const [reviewMood, setReviewMood] = useState(libroUsuario?.mood ?? '')
  const [guardandoReview, setGuardandoReview] = useState(false)
  const [reviewOk, setReviewOk] = useState(false)

  async function agregar() {
    setCargando(true)
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'nuevo', titulo, autor, anio, paginas, estado, portada_url: portadaUrl }),
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

  async function guardarReview() {
    if (!libroUsuario) return
    setGuardandoReview(true)
    try {
      await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'editar',
          id: libroUsuario.id,
          estado: libroUsuario.estado,
          estrellas: String(reviewEstrellas),
          resena: reviewResena,
          mood: reviewMood,
          genero: libroUsuario.genero || '',
        }),
      })
      setReviewOk(true)
      setReviewAbierto(false)
      setTimeout(() => { setReviewOk(false); router.refresh() }, 1500)
    } finally {
      setGuardandoReview(false)
    }
  }

  // ── Already in library ──
  if (agregado) {
    const hasReview = reviewEstrellas > 0 || reviewResena.trim().length > 0
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: 10, background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.35)' }}>
            <span>✅</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#27ae60' }}>En tu biblioteca</span>
          </div>
          {libroUsuario && (
            <button
              onClick={() => setReviewAbierto(v => !v)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${reviewAbierto ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.25)'}`,
                background: reviewAbierto ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: '#d4af37', fontWeight: 700, fontSize: '0.82rem',
              }}
            >
              {hasReview ? '✏️ Editar reseña' : '✍️ Dejar reseña'}
            </button>
          )}
        </div>

        {reviewOk && (
          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', fontSize: '0.82rem', color: '#2ecc71', fontWeight: 700 }}>
            ✅ Reseña guardada
          </div>
        )}

        {libroUsuario && reviewAbierto && (
          <div style={{ padding: '1.1rem 1.2rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Calificación</label>
              <StarPicker value={reviewEstrellas} onChange={setReviewEstrellas} size={28} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Vibe del libro</label>
              <MoodPicker value={reviewMood} onChange={setReviewMood} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Reseña</label>
              <textarea
                value={reviewResena}
                onChange={e => setReviewResena(e.target.value)}
                rows={3}
                placeholder="¿Qué te pareció este libro?"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setReviewAbierto(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.82rem', padding: '6px 4px' }}>
                Cancelar
              </button>
              <button
                onClick={guardarReview}
                disabled={guardandoReview}
                style={{
                  padding: '6px 20px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg,#b8860b,#d4af37)',
                  color: '#000', fontWeight: 700, fontSize: '0.82rem',
                  cursor: guardandoReview ? 'default' : 'pointer',
                  opacity: guardandoReview ? 0.7 : 1,
                }}
              >
                {guardandoReview ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Add to library ──
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
          <option key={e} value={e} style={{ background: '#1a1a1a' }}>{ESTADO_LABEL[e]}</option>
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
      <button onClick={() => setExpandido(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.5rem' }}>
        Cancelar
      </button>
    </div>
  )
}
