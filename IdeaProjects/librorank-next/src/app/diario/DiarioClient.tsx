'use client'

import { useState, useRef } from 'react'
import type { Libro } from '@/lib/dao/libroDAO'
import type { DiarioLectura } from '@/lib/dao/diarioDAO'
import type { Cita } from '@/lib/dao/citaDAO'

interface Props {
  libro: Libro | null
  entradas: DiarioLectura[]
  citas: Cita[]
  misLibros: Libro[]
  libroIdActual: number | null
}

export default function DiarioClient({ libro, entradas: entradasIni, citas: citasIni, misLibros, libroIdActual }: Props) {
  const [entradas, setEntradas] = useState(entradasIni)
  const [citas, setCitas] = useState(citasIni)
  const [tab, setTab] = useState<'entradas' | 'citas'>('entradas')
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const formEntradaRef = useRef<HTMLFormElement>(null)
  const formCitaRef = useRef<HTMLFormElement>(null)

  async function agregarEntrada(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libroId: libroIdActual, capitulo: fd.get('capitulo'), comentario: fd.get('comentario') }),
      })
      const json = await res.json()
      if (json.ok && json.entrada) {
        setEntradas(prev => [json.entrada, ...prev])
        formEntradaRef.current?.reset()
      }
    } finally {
      setGuardando(false)
    }
  }

  async function agregarCita(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'cita', libroId: libroIdActual, texto: fd.get('texto'), pagina: fd.get('pagina') }),
      })
      const json = await res.json()
      if (json.ok && json.cita) {
        setCitas(prev => [json.cita, ...prev])
        formCitaRef.current?.reset()
      }
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: number, tipo: 'entrada' | 'cita') {
    if (eliminando !== null) return
    setEliminando(id)
    try {
      const res = await fetch('/api/diario', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo }),
      })
      const json = await res.json()
      if (json.ok) {
        if (tipo === 'entrada') setEntradas(prev => prev.filter(e => e.id !== id))
        else setCitas(prev => prev.filter(c => c.id !== id))
      }
    } finally {
      setEliminando(null)
    }
  }

  /* ── Sin libro seleccionado ── */
  if (!libro) {
    return (
      <div className="container py-5">
        <h1 className="font-title display-5 mb-5">📓 Diario de Lectura</h1>
        <div className="card p-5 text-center">
          <p className="text-muted mb-4">Seleccioná un libro para ver su diario de lectura.</p>
          <div className="row g-3 justify-content-center">
            {misLibros.map(l => (
              <div key={l.id} className="col-auto">
                <a href={`/diario?libroId=${l.id}`} className="d-block text-decoration-none">
                  <div className="card p-3 text-center" style={{ width: 120 }}>
                    {l.portada_url ? (
                      <img src={l.portada_url} alt={l.titulo} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📚</div>
                    )}
                    <div className="small text-white mt-2 text-truncate">{l.titulo}</div>
                  </div>
                </a>
              </div>
            ))}
            {misLibros.length === 0 && (
              <p className="text-muted">No tenés libros en tu biblioteca aún.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Con libro ── */
  return (
    <div className="container py-5">

      {/* Breadcrumb */}
      <div className="d-flex align-items-center gap-2 mb-5">
        <a href="/diario" className="text-muted text-decoration-none small">← Mis libros</a>
        <span className="text-muted small">/</span>
        <span className="small" style={{ color: 'var(--accent-gold)' }}>📓 {libro.titulo}</span>
        <span className="text-muted small ms-2">— {libro.autor}</span>
      </div>

      {/* ── FORMULARIOS ── */}
      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>📝 Nueva entrada</h6>
            <form ref={formEntradaRef} onSubmit={agregarEntrada} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small">Capítulo / Sección</label>
                <input name="capitulo" type="text" className="form-control" placeholder="Ej: Cap. 5" />
              </div>
              <div>
                <label className="form-label text-muted small">Comentario *</label>
                <textarea name="comentario" rows={4} className="form-control" required placeholder="¿Qué te pareció esta parte?..." />
              </div>
              <button type="submit" className="btn-gold w-100 mt-auto" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar entrada'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>💬 Nueva cita</h6>
            <form ref={formCitaRef} onSubmit={agregarCita} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small">Cita *</label>
                <textarea name="texto" rows={5} className="form-control" required placeholder="Escribí la frase o párrafo que querés guardar..." />
              </div>
              <div>
                <label className="form-label text-muted small">Página (opcional)</label>
                <input name="pagina" type="text" className="form-control" placeholder="Ej: 142" />
              </div>
              <button type="submit" className="btn-gold w-100 mt-auto" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cita'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="inventory-tabs mb-4">
        <button onClick={() => setTab('entradas')} className={`tab-btn ${tab === 'entradas' ? 'active' : ''}`}>
          📝 Entradas ({entradas.length})
        </button>
        <button onClick={() => setTab('citas')} className={`tab-btn ${tab === 'citas' ? 'active' : ''}`}>
          💬 Citas ({citas.length})
        </button>
      </div>

      {/* Timeline de entradas */}
      {tab === 'entradas' && (
        <div>
          {entradas.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <p>Aún no hay entradas. ¡Guardá tu primera nota arriba!</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
              <div style={{
                position: 'absolute', left: '0.45rem', top: 0, bottom: 0, width: 3,
                background: 'linear-gradient(to bottom, var(--accent-gold), transparent)', borderRadius: 4,
              }} />
              {entradas.map((e, idx) => (
                <div key={e.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <div style={{
                    position: 'absolute', left: '-1.55rem', top: '1.1rem',
                    width: 12, height: 12, borderRadius: '50%',
                    background: idx === 0 ? 'var(--accent-gold)' : 'var(--bg-card)',
                    border: '2px solid var(--accent-gold)',
                    boxShadow: idx === 0 ? '0 0 8px var(--accent-gold)' : 'none',
                  }} />
                  <div className="card p-4" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        {e.capitulo && (
                          <span className="fw-bold small" style={{ color: 'var(--accent-gold)' }}>
                            Cap. {e.capitulo}
                          </span>
                        )}
                        <span className="text-muted small">
                          {e.fecha_creacion
                            ? new Date(e.fecha_creacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => eliminar(e.id!, 'entrada')}
                        disabled={eliminando === e.id}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', padding: '2px 6px',
                          borderRadius: 6, transition: 'color 0.15s',
                        }}
                        onMouseEnter={el => (el.currentTarget.style.color = '#e74c3c')}
                        onMouseLeave={el => (el.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                        title="Eliminar entrada"
                      >
                        {eliminando === e.id ? '...' : '✕'}
                      </button>
                    </div>
                    <p className="text-white mb-0" style={{ lineHeight: 1.7 }}>{e.comentario}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tarjetas de citas */}
      {tab === 'citas' && (
        <div>
          {citas.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <p>Aún no hay citas guardadas.</p>
            </div>
          ) : (
            <div className="row g-4">
              {citas.map(c => (
                <div key={c.id} className="col-md-6">
                  <div className="p-4 h-100" style={{
                    background: 'rgba(212,175,55,0.03)',
                    border: '1px dashed var(--accent-gold)',
                    borderRadius: 16, position: 'relative',
                  }}>
                    {/* Botón eliminar */}
                    <button
                      onClick={() => eliminar(c.id!, 'cita')}
                      disabled={eliminando === c.id}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', padding: '2px 6px',
                        borderRadius: 6, transition: 'color 0.15s',
                      }}
                      onMouseEnter={el => (el.currentTarget.style.color = '#e74c3c')}
                      onMouseLeave={el => (el.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                      title="Eliminar cita"
                    >
                      {eliminando === c.id ? '...' : '✕'}
                    </button>

                    <p className="text-white mb-3" style={{ fontStyle: 'italic', lineHeight: 1.8, fontSize: '1.05rem', paddingRight: '1.5rem' }}>
                      &ldquo;{c.texto}&rdquo;
                    </p>
                    {c.pagina && (
                      <div className="text-muted small">— Página {c.pagina}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
