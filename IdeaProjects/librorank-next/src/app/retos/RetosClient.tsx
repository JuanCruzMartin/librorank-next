'use client'

import { useState } from 'react'
import type { RetoAmigo } from '@/lib/dao/retoDAO'
import type { Libro } from '@/lib/dao/libroDAO'

interface Props {
  retos: RetoAmigo[]
  misLibros: Libro[]
  usuarioId: number
}

export default function RetosClient({ retos: retosIni, misLibros, usuarioId }: Props) {
  const [retos, setRetos] = useState(retosIni)
  const [showModal, setShowModal] = useState(false)

  async function crearReto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/retos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'crear',
        nombre: fd.get('nombre'),
        libroId: fd.get('libroId') || null,
        fechaFin: fd.get('fechaFin'),
      }),
    })
    if (res.ok) { setShowModal(false); window.location.reload() }
  }

  async function unirse(retoId: number) {
    await fetch('/api/retos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'unirse', retoId }),
    })
    window.location.reload()
  }

  async function actualizarProgreso(retoId: number, progreso: number) {
    await fetch('/api/retos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'actualizar', retoId, progreso }),
    })
    window.location.reload()
  }

  return (
    <div className="container py-5">

      {/* ── Hero: ¿Qué son los Retos? ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(231,76,60,0.08), rgba(231,76,60,0.02))',
        border: '1px solid rgba(231,76,60,0.2)',
        borderRadius: 18,
        padding: '1.75rem',
        marginBottom: '2rem',
      }}>
        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 className="font-title mb-1" style={{ fontSize: '1.8rem' }}>⚔️ Retos de Lectura</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Creá un reto, <strong style={{ color: '#fff' }}>invitá a tus amigos</strong> y competí para ver quién
              llega primero a la meta — un libro específico o un porcentaje de avance —
              antes de la <strong style={{ color: '#e74c3c' }}>fecha límite</strong>.
              Ganás puntos por crear retos y por completarlos.
            </p>

            {/* Diferencia con Bingo */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            }}>
              <div style={{
                background: 'rgba(243,156,18,0.08)',
                border: '1px solid rgba(243,156,18,0.2)',
                borderRadius: 10, padding: '0.6rem 1rem',
                fontSize: '0.78rem',
              }}>
                <div style={{ fontWeight: 700, color: '#f39c12', marginBottom: 2 }}>🎲 Bingo</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Desafíos solo, a tu ritmo,<br />por categorías de libros</div>
              </div>
              <div style={{
                background: 'rgba(231,76,60,0.1)',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 10, padding: '0.6rem 1rem',
                fontSize: '0.78rem',
              }}>
                <div style={{ fontWeight: 700, color: '#e74c3c', marginBottom: 2 }}>⚔️ Retos ← estás acá</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Competencia directa contra<br />amigos con fecha límite</div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-gold flex-shrink-0" style={{ alignSelf: 'flex-start' }}>
            + Crear Reto
          </button>
        </div>
      </div>

      {/* Lista de retos */}
      {retos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(231,76,60,0.25)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚔️</div>
          <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Aún no hay retos activos</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 400, margin: '0 auto 1.5rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Creá el primer reto, elegí un libro objetivo o una meta de lectura,
            ponele fecha límite y compartilos con tus amigos.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-gold">
            Crear mi primer reto
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {retos.map(r => {
            const miParticipacion = r.participantes.find(p => p.usuario_id === usuarioId)
            const yaParticipa = Boolean(miParticipacion)

            return (
              <div key={r.id} className="col-md-6">
                <div className="card p-4 h-100">

                  {/* Cabecera del reto */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="font-title text-white mb-1">{r.nombre_reto}</h5>
                      <div className="text-muted small">
                        Creado por <span style={{ color: 'var(--accent-gold)' }}>@{r.creador_username}</span>
                        {r.fecha_fin && (
                          <span> · Hasta {new Date(r.fecha_fin).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                    {!yaParticipa && (
                      <button onClick={() => unirse(r.id)} className="btn-gold btn-sm ms-2 flex-shrink-0">
                        Unirse
                      </button>
                    )}
                  </div>

                  {/* Libro objetivo — box punteado dorado */}
                  {r.titulo_libro && (
                    <div className="mb-3 px-3 py-2 rounded" style={{
                      border: '1px dashed var(--accent-gold)',
                      background: 'rgba(212,175,55,0.04)',
                      fontSize: '0.85rem',
                      color: 'var(--accent-gold)',
                    }}>
                      📚 {r.titulo_libro}
                    </div>
                  )}

                  {/* Participantes con progress bars */}
                  <div>
                    <div className="text-muted small mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                      Participantes ({r.participantes.length})
                    </div>
                    {r.participantes.map(p => (
                      <div key={p.usuario_id} className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <img
                            src={p.avatar_url || '/img/personajes/personaje_1.png'}
                            alt={p.username}
                            className="rounded-circle flex-shrink-0"
                            style={{ width: 26, height: 26, objectFit: 'cover', border: '1px solid var(--accent-gold)' }}
                          />
                          <span className="text-white small flex-grow-1">@{p.username}</span>
                          <span className="small fw-bold" style={{ color: 'var(--accent-gold)', minWidth: 36, textAlign: 'right' }}>
                            {p.progreso}%
                          </span>
                        </div>

                        {/* Progress bar con gradiente dorado */}
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(p.progreso, 100)}%`,
                            background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
                            borderRadius: 99,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>

                        {/* Botones de progreso (solo para el usuario logueado) */}
                        {p.usuario_id === usuarioId && (
                          <div className="d-flex gap-1 mt-1">
                            {[25, 50, 75, 100].map(pct => (
                              <button
                                key={pct}
                                onClick={() => actualizarProgreso(r.id, pct)}
                                className="btn btn-sm btn-outline-secondary"
                                style={{
                                  fontSize: '0.6rem',
                                  padding: '1px 5px',
                                  opacity: p.progreso === pct ? 1 : 0.5,
                                  borderColor: p.progreso === pct ? 'var(--accent-gold)' : undefined,
                                  color: p.progreso === pct ? 'var(--accent-gold)' : undefined,
                                }}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Crear Reto */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>⚔️ Crear Reto</h4>
              <button onClick={() => setShowModal(false)} className="btn-close btn-close-white" />
            </div>

            <form onSubmit={crearReto} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Nombre del reto *
                </label>
                <input
                  name="nombre"
                  type="text"
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  required
                  placeholder="Ej: Leer 3 libros en enero"
                />
              </div>

              <div>
                <label className="form-label text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Libro objetivo (opcional)
                </label>
                <select
                  name="libroId"
                  className="form-select"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  <option value="">Sin libro específico</option>
                  {misLibros.map(l => <option key={l.id} value={l.id}>{l.titulo}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Fecha límite *
                </label>
                <input
                  name="fechaFin"
                  type="date"
                  className="form-control"
                  style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', colorScheme: 'dark' }}
                  required
                />
              </div>

              <button type="submit" className="btn-gold w-100 mt-2">
                Crear reto
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
