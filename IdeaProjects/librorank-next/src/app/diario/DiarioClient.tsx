'use client'

import { useState } from 'react'
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
  const [entradas] = useState(entradasIni)
  const [citas] = useState(citasIni)
  const [tab, setTab] = useState<'entradas' | 'citas'>('entradas')

  async function agregarEntrada(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/diario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libroId: libroIdActual, capitulo: fd.get('capitulo'), comentario: fd.get('comentario') }),
    })
    if (res.ok) { e.currentTarget.reset(); window.location.reload() }
  }

  async function agregarCita(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/diario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cita', libroId: libroIdActual, texto: fd.get('texto'), pagina: fd.get('pagina') }),
    })
    if (res.ok) { e.currentTarget.reset(); window.location.reload() }
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

      {/* ── FORMULARIOS (2 columnas en la parte de arriba) ── */}
      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>📝 Nueva entrada</h6>
            <form onSubmit={agregarEntrada} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small">Capítulo / Sección</label>
                <input
                  name="capitulo"
                  type="text"
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Ej: Cap. 5"
                />
              </div>
              <div>
                <label className="form-label text-muted small">Comentario *</label>
                <textarea
                  name="comentario"
                  rows={4}
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  required
                  placeholder="¿Qué te pareció esta parte?..."
                />
              </div>
              <button type="submit" className="btn-gold w-100 mt-auto">Guardar entrada</button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-4 h-100">
            <h6 className="font-title mb-3" style={{ color: 'var(--accent-gold)' }}>💬 Nueva cita</h6>
            <form onSubmit={agregarCita} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small">Cita *</label>
                <textarea
                  name="texto"
                  rows={5}
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  required
                  placeholder="Escribí la frase o párrafo que querés guardar..."
                />
              </div>
              <div>
                <label className="form-label text-muted small">Página (opcional)</label>
                <input
                  name="pagina"
                  type="text"
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Ej: 142"
                />
              </div>
              <button type="submit" className="btn-gold w-100 mt-auto">Guardar cita</button>
            </form>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO (timeline + citas) ── */}
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
              {/* Línea vertical del timeline */}
              <div style={{
                position: 'absolute',
                left: '0.45rem',
                top: 0,
                bottom: 0,
                width: 3,
                background: 'linear-gradient(to bottom, var(--accent-gold), transparent)',
                borderRadius: 4,
              }} />

              {entradas.map((e, idx) => (
                <div key={e.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  {/* Bullet point */}
                  <div style={{
                    position: 'absolute',
                    left: '-1.55rem',
                    top: '1.1rem',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: idx === 0 ? 'var(--accent-gold)' : 'var(--bg-card)',
                    border: '2px solid var(--accent-gold)',
                    boxShadow: idx === 0 ? '0 0 8px var(--accent-gold)' : 'none',
                  }} />

                  <div className="card p-4" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      {e.capitulo && (
                        <span className="fw-bold small" style={{ color: 'var(--accent-gold)' }}>
                          Cap. {e.capitulo}
                        </span>
                      )}
                      <span className="text-muted small ms-auto">
                        {e.fecha_creacion
                          ? new Date(e.fecha_creacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </span>
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
                    borderRadius: 16,
                  }}>
                    <p className="text-white mb-3" style={{ fontStyle: 'italic', lineHeight: 1.8, fontSize: '1.05rem' }}>
                      &ldquo;{c.texto}&rdquo;
                    </p>
                    {c.pagina && (
                      <div className="text-muted small" style={{ color: 'var(--accent-gold) !important' }}>
                        — Página {c.pagina}
                      </div>
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
