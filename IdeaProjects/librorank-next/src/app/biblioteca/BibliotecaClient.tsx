'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Libro, PerfilStats } from '@/lib/dao/libroDAO'
import type { Usuario } from '@/lib/dao/usuarioDAO'

const ESTADOS = ['PENDIENTE', 'LEYENDO', 'LEIDO', 'PAUSA']
const GENEROS = ['Fantasía', 'Ciencia Ficción', 'Romance', 'Terror', 'Misterio', 'Historia', 'Biografía', 'Autoayuda', 'Poesía', 'Otro']
const MOODS = ['Relajado', 'Aventurero', 'Emotivo', 'Intelectual', 'Nostálgico', 'Inspirador', 'Oscuro', 'Divertido']

interface Sugerencia { titulo: string; autor: string; anio: string; paginas: string; portada: string }

interface Props {
  librosIniciales: Libro[]
  stats: PerfilStats
  autorMasLeido: string
  mejorCalificado: string
  paginas: number
  usuario: Usuario
}

export default function BibliotecaClient({ librosIniciales, stats, autorMasLeido, mejorCalificado, paginas }: Props) {
  const [libros, setLibros] = useState(librosIniciales)
  const [filtro, setFiltro] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaModal, setBusquedaModal] = useState('')
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [editando, setEditando] = useState<Libro | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeEdit, setMensajeEdit] = useState('')
  const [guardando, setGuardando] = useState(false)

  const buscarLibros = useCallback(async (q: string) => {
    if (q.length < 3) { setSugerencias([]); return }
    const res = await fetch(`/api/libros/buscar?q=${encodeURIComponent(q)}`)
    setSugerencias(await res.json())
  }, [])

  const seleccionarSugerencia = (s: Sugerencia) => {
    const form = document.getElementById('formNuevo') as HTMLFormElement
    if (!form) return
    ;(form.elements.namedItem('titulo') as HTMLInputElement).value = s.titulo
    ;(form.elements.namedItem('autor') as HTMLInputElement).value = s.autor
    ;(form.elements.namedItem('anio') as HTMLInputElement).value = s.anio
    ;(form.elements.namedItem('paginas') as HTMLInputElement).value = s.paginas
    ;(form.elements.namedItem('portada_url') as HTMLInputElement).value = s.portada
    setSugerencias([])
    setBusquedaModal(s.titulo)
  }

  async function agregarLibro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/libros', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'nuevo', titulo: fd.get('titulo'), autor: fd.get('autor'), anio: fd.get('anio'), paginas: fd.get('paginas'), estado: fd.get('estado'), portada_url: fd.get('portada_url'), genero: fd.get('genero'), mood: fd.get('mood') }),
    })
    const json = await res.json()
    if (!res.ok) { setMensaje(json.error); return }
    setShowModal(false); window.location.reload()
  }

  async function editarLibro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editando) return
    setGuardando(true)
    setMensajeEdit('')
    try {
      const fd = new FormData(e.currentTarget)
      const payload = {
        accion: 'editar',
        id: editando.id,
        estado:   (fd.get('estado')   as string) || editando.estado,
        estrellas:(fd.get('estrellas') as string) || '0',
        resena:   (fd.get('resena')   as string) || '',
        genero:   (fd.get('genero')   as string) || '',
        mood:     (fd.get('mood')     as string) || '',
      }
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setMensajeEdit(json.error || 'No se pudo guardar. Intentá de nuevo.')
        return
      }
      setEditando(null)
      window.location.reload()
    } catch {
      setMensajeEdit('Error de conexión. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarLibro(id: number) {
    if (!confirm('¿Eliminar este libro?')) return
    await fetch('/api/libros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'eliminar', id }) })
    setLibros(prev => prev.filter(l => l.id !== id))
  }

  const librosFiltrados = libros.filter(l => {
    if (filtro !== 'TODOS' && l.estado !== filtro) return false
    if (busqueda && !l.titulo.toLowerCase().includes(busqueda.toLowerCase()) && !l.autor.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const badgeEstado = (estado: string) => {
    if (estado === 'LEIDO') return 'badge bg-success-subtle text-success border border-success-subtle'
    if (estado === 'LEYENDO') return 'badge bg-warning-subtle text-warning border border-warning-subtle'
    if (estado === 'PAUSA') return 'badge bg-info-subtle text-info border border-info-subtle'
    return 'badge bg-secondary-subtle text-secondary border border-secondary-subtle'
  }

  return (
    <>
      {/* Header interno estilo original */}
      <header className="library-header py-5" style={{ background: 'linear-gradient(135deg,#0a0a0a 0%,#151515 100%)', borderBottom: '2px solid rgba(212,175,55,0.2)' }}>
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <div className="d-flex align-items-center mb-3">
                <div className="p-2 rounded-3 me-3" style={{ width: 45, height: 45, background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-collection-play-fill text-dark fs-4"></i>
                </div>
                <div>
                  <h1 className="h2 fw-bold text-white mb-0">Mi Biblioteca</h1>
                  <p className="text-muted small mb-0">Gestiona tu viaje literario</p>
                </div>
              </div>
              <div className="p-3 rounded-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label className="form-label text-gold fw-bold mb-2 text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.8rem' }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>Buscar libro para añadir
                </label>
                <div className="input-group">
                  <input type="text" className="form-control" placeholder="Escribe el título de un libro..."
                    style={{ border: '1px solid rgba(212,175,55,0.3)' }}
                    value={busqueda} onChange={e => { setBusqueda(e.target.value); buscarLibros(e.target.value) }} />
                  <button className="btn btn-gold px-4 border-0" type="button" onClick={() => setShowModal(true)}>
                    <i className="bi bi-search fw-bold"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {[
                  { label: 'Libros Leídos', value: stats.leidos, icon: '📚' },
                  { label: 'Páginas totales', value: paginas, icon: '📄' },
                  { label: 'Autor favorito', value: autorMasLeido || '—', icon: '✍️' },
                  { label: 'Mejor calificado', value: mejorCalificado || '—', icon: '⭐' },
                ].map(s => (
                  <div key={s.label} className="col-sm-6">
                    <div className="stat-card p-3 rounded-4 d-flex align-items-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.1)', minHeight: 80 }}>
                      <div className="stat-icon me-3 fs-3">{s.icon}</div>
                      <div>
                        <div className="text-gold small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: 1 }}>{s.label}</div>
                        <div className="h3 fw-bold text-white mb-0" style={{ fontSize: '1.2rem' }}>{s.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container my-5">
        {mensaje && <div className="alert alert-danger">{mensaje}</div>}

        {/* Filtros */}
        <div className="d-flex gap-2 flex-wrap mb-4 align-items-center">
          <button onClick={() => setFiltro('TODOS')} className={`btn btn-sm ${filtro === 'TODOS' ? 'btn-gold' : 'btn-outline-secondary'}`}>Todos</button>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltro(e)} className={`btn btn-sm ${filtro === e ? 'btn-gold' : 'btn-outline-secondary'}`}>{e}</button>
          ))}
          <button onClick={() => setShowModal(true)} className="btn btn-gold btn-sm ms-auto px-4">
            <i className="bi bi-plus-lg me-2"></i>Agregar libro
          </button>
        </div>

        {/* Grid */}
        {librosFiltrados.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-book display-1 mb-3 d-block opacity-25"></i>
            <p>No hay libros en esta categoría.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-gold btn-sm mt-2">Agregar mi primer libro</button>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-4" id="contenedorLibros">
            {librosFiltrados.map(libro => (
              <div key={libro.id} className="col">
                <div className="card h-100 text-white p-2" style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <div className="position-relative">
                    {libro.portada_url ? (
                      <img src={libro.portada_url} alt={libro.titulo} className="card-img-top rounded shadow-sm" style={{ height: 200, objectFit: 'cover' }} />
                    ) : (
                      <div className="card-img-top rounded d-flex align-items-center justify-content-center" style={{ height: 200, background: '#36302c', fontSize: '3rem' }}>📚</div>
                    )}
                    <div className="position-absolute top-0 end-0 p-1 d-flex gap-1">
                      <button onClick={() => eliminarLibro(libro.id)} className="btn btn-danger btn-sm p-1" title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-2 text-center">
                    <h6 className="card-title text-truncate mb-1" title={libro.titulo}>{libro.titulo}</h6>
                    <p className="card-text small text-muted text-truncate mb-2">{libro.autor}</p>
                    <div className="mb-3">
                      <span className={badgeEstado(libro.estado)}>{libro.estado}</span>
                    </div>
                    <div className="d-grid gap-2">
                      <Link href={`/diario?libroId=${libro.id}`} className="btn btn-gold btn-sm">
                        <i className="bi bi-journal-bookmark me-1"></i>Diario / Citas
                      </Link>
                      <button onClick={() => setEditando(libro)} className="btn btn-outline-warning btn-sm">
                        <i className="bi bi-pencil me-1"></i>Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Agregar libro */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: 20 }}>
              <div className="modal-header border-0">
                <h5 className="modal-title font-title" style={{ color: 'var(--accent-gold)' }}>Agregar Libro</h5>
                <button className="btn-close btn-close-white" onClick={() => { setShowModal(false); setSugerencias([]); setBusquedaModal('') }}></button>
              </div>
              <div className="modal-body py-4">
                <div className="position-relative mb-4">
                  <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>BUSCAR EN GOOGLE BOOKS</label>
                  <div className="input-group">
                    <input type="text" className="form-control" placeholder="Escribe el título..." value={busquedaModal}
                      onChange={e => { setBusquedaModal(e.target.value); buscarLibros(e.target.value) }} />
                  </div>
                  {sugerencias.length > 0 && (
                    <div className="position-absolute w-100" style={{ background: '#2c2724', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, top: '100%', zIndex: 999, maxHeight: 300, overflowY: 'auto' }}>
                      {sugerencias.map((s, i) => (
                        <button key={i} onClick={() => seleccionarSugerencia(s)}
                          className="d-flex gap-2 align-items-center w-100 text-start p-2" style={{ background: 'none', border: 'none', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {s.portada && <img src={s.portada} alt={s.titulo} style={{ height: 50, borderRadius: 4 }} />}
                          <div><div className="fw-bold">{s.titulo}</div><div className="text-muted small">{s.autor}</div></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <form id="formNuevo" onSubmit={agregarLibro}>
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label text-muted">Título *</label><input name="titulo" type="text" className="form-control" required /></div>
                    <div className="col-12"><label className="form-label text-muted">Autor *</label><input name="autor" type="text" className="form-control" required /></div>
                    <div className="col-6"><label className="form-label text-muted">Año</label><input name="anio" type="number" className="form-control" /></div>
                    <div className="col-6"><label className="form-label text-muted">Páginas</label><input name="paginas" type="number" className="form-control" /></div>
                    <div className="col-12"><label className="form-label text-muted">URL de portada</label><input name="portada_url" type="text" className="form-control" /></div>
                    <div className="col-4">
                      <label className="form-label text-muted">Estado</label>
                      <select name="estado" className="form-select">{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                    <div className="col-4">
                      <label className="form-label text-muted">Género</label>
                      <select name="genero" className="form-select"><option value="">Sin género</option>{GENEROS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                    </div>
                    <div className="col-4">
                      <label className="form-label text-muted">Mood</label>
                      <select name="mood" className="form-select"><option value="">Sin mood</option>{MOODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-4 px-0">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cerrar</button>
                    <button type="submit" className="btn btn-gold btn-sm px-4">Agregar a mi biblioteca</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar libro */}
      {editando && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) { setEditando(null); setMensajeEdit('') } }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: 20 }}>
              <div className="modal-header border-0">
                <h5 className="modal-title font-title" style={{ color: 'var(--accent-gold)' }}>✏️ {editando.titulo}</h5>
                <button className="btn-close btn-close-white" onClick={() => { setEditando(null); setMensajeEdit('') }}></button>
              </div>
              {/* key=editando.id fuerza que React reinicie el form con los valores correctos al cambiar de libro */}
              <form key={editando.id} onSubmit={editarLibro}>
                <div className="modal-body py-3">
                  {mensajeEdit && (
                    <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                      ⚠️ {mensajeEdit}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>ESTADO</label>
                      <select name="estado" defaultValue={editando.estado} className="form-select">
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>CALIFICACIÓN</label>
                      <select name="estrellas" defaultValue={String(editando.estrellas ?? 0)} className="form-select">
                        <option value="0">Sin calificar</option>
                        <option value="1">⭐ (1)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>GÉNERO</label>
                      <select name="genero" defaultValue={editando.genero || ''} className="form-select">
                        <option value="">Sin género</option>
                        {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>MOOD</label>
                      <select name="mood" defaultValue={editando.mood || ''} className="form-select">
                        <option value="">Sin mood</option>
                        {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-gold fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>RESEÑA</label>
                      <textarea
                        name="resena"
                        defaultValue={editando.resena || ''}
                        rows={4}
                        className="form-control"
                        placeholder="¿Qué te pareció este libro?"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    onClick={() => { setEditando(null); setMensajeEdit('') }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-gold btn-sm px-4" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
