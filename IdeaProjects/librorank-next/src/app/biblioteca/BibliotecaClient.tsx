'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Libro, PerfilStats } from '@/lib/dao/libroDAO'
import type { Usuario } from '@/lib/dao/usuarioDAO'
import BannerExplicativo from '@/components/BannerExplicativo'
import Toast from '@/components/Toast'
import { GENEROS } from '@/lib/generos'

const ESTADOS = ['PENDIENTE', 'LEYENDO', 'LEIDO', 'PAUSA']
const MOODS = ['Relajado', 'Aventurero', 'Emotivo', 'Intelectual', 'Nostálgico', 'Inspirador', 'Oscuro', 'Divertido']

interface Sugerencia { titulo: string; autor: string; anio: string; paginas: string; portada: string; genero: string }

interface Props {
  librosIniciales: Libro[]
  stats: PerfilStats
  autorMasLeido: string
  mejorCalificado: string
  paginas: number
  usuario: Usuario
  soloLectura?: boolean
}

export default function BibliotecaClient({ librosIniciales, stats, autorMasLeido, mejorCalificado, paginas, usuario, soloLectura = false }: Props) {
  const [libros, setLibros] = useState(librosIniciales)
  const [filtro, setFiltro] = useState('TODOS')
  const [filtroGenero, setFiltroGenero] = useState('TODOS')
  const [filtroEstrellas, setFiltroEstrellas] = useState(0)
  const [ordenar, setOrdenar] = useState('reciente')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaModal, setBusquedaModal] = useState('')
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [formNuevo, setFormNuevo] = useState({ titulo: '', autor: '', anio: '', paginas: '', portada_url: '', genero: '' })
  const [busquedaHeader, setBusquedaHeader] = useState('')
  const [sugerenciasHeader, setSugerenciasHeader] = useState<Sugerencia[]>([])
  const [editando, setEditando] = useState<Libro | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeEdit, setMensajeEdit] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ puntos: number; mensaje: string } | null>(null)
  const [libroAEliminar, setLibroAEliminar] = useState<Libro | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  // Atajo "/" enfoca el buscador de la biblioteca
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setBusqueda('')
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function mostrarToast(puntos: number, mensaje: string) {
    if (puntos > 0) setToast({ puntos, mensaje })
  }

  const buscarLibros = useCallback(async (q: string) => {
    if (q.length < 3) { setSugerencias([]); return }
    const res = await fetch(`/api/libros/buscar?q=${encodeURIComponent(q)}`)
    setSugerencias(await res.json())
  }, [])

  const buscarHeader = useCallback(async (q: string) => {
    if (q.length < 3) { setSugerenciasHeader([]); return }
    const res = await fetch(`/api/libros/buscar?q=${encodeURIComponent(q)}`)
    setSugerenciasHeader(await res.json())
  }, [])

  const seleccionarSugerencia = (s: Sugerencia) => {
    setFormNuevo({ titulo: s.titulo, autor: s.autor, anio: s.anio, paginas: String(s.paginas), portada_url: s.portada, genero: s.genero || '' })
    setSugerencias([])
    setBusquedaModal(s.titulo)
  }

  const seleccionarDesdeHeader = (s: Sugerencia) => {
    setSugerenciasHeader([])
    setBusquedaHeader('')
    setFormNuevo({ titulo: s.titulo, autor: s.autor, anio: s.anio, paginas: String(s.paginas), portada_url: s.portada, genero: s.genero || '' })
    setBusquedaModal(s.titulo)
    setShowModal(true)
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
    setShowModal(false)
    setBusquedaModal('')
    setBusquedaHeader('')
    setSugerencias([])
    setSugerenciasHeader([])
    // Agregar el libro al estado local sin recargar
    const nuevoLibro: Libro = {
      id: json.id,
      usuario_id: usuario.id,
      libro_global_id: null,
      titulo: String(fd.get('titulo') || ''),
      autor: String(fd.get('autor') || ''),
      anio: fd.get('anio') ? Number(fd.get('anio')) : null,
      paginas: fd.get('paginas') ? Number(fd.get('paginas')) : null,
      estado: String(fd.get('estado') || 'PENDIENTE'),
      portada_url: String(fd.get('portada_url') || '') || null,
      genero: String(fd.get('genero') || '') || null,
      mood: String(fd.get('mood') || '') || null,
      estrellas: 0,
      resena: null,
    }
    setLibros(prev => [nuevoLibro, ...prev])
    setFormNuevo({ titulo: '', autor: '', anio: '', paginas: '', portada_url: '', genero: '' })
    if (json.puntosGanados > 0) mostrarToast(json.puntosGanados, json.toastMsg)
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
      // Actualizar el libro en el estado local sin recargar
      const estadoNuevo = (payload.estado as string).toUpperCase()
      setLibros(prev => prev.map(l => l.id === editando.id ? {
        ...l,
        estado: estadoNuevo,
        estrellas: Number(payload.estrellas) || 0,
        resena: (payload.resena as string) || null,
        genero: (payload.genero as string) || null,
        mood: (payload.mood as string) || null,
      } : l))
      setEditando(null)
      if (json.puntosGanados > 0) mostrarToast(json.puntosGanados, json.toastMsg)
    } catch {
      setMensajeEdit('Error de conexión. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminar() {
    if (!libroAEliminar) return
    setEliminando(true)
    await fetch('/api/libros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar', id: libroAEliminar.id }),
    })
    setLibros(prev => prev.filter(l => l.id !== libroAEliminar.id))
    setLibroAEliminar(null)
    setEliminando(false)
  }

  const hayFiltrosActivos = filtro !== 'TODOS' || filtroGenero !== 'TODOS' || filtroEstrellas > 0 || busqueda !== ''

  const librosFiltrados = libros
    .filter(l => {
      if (filtro !== 'TODOS' && l.estado !== filtro) return false
      if (filtroGenero !== 'TODOS' && l.genero !== filtroGenero) return false
      if (filtroEstrellas > 0 && (l.estrellas ?? 0) < filtroEstrellas) return false
      if (busqueda && !l.titulo.toLowerCase().includes(busqueda.toLowerCase()) && !l.autor.toLowerCase().includes(busqueda.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (ordenar === 'titulo')      return a.titulo.localeCompare(b.titulo)
      if (ordenar === 'autor')       return (a.autor || '').localeCompare(b.autor || '')
      if (ordenar === 'estrellas')   return (b.estrellas ?? 0) - (a.estrellas ?? 0)
      if (ordenar === 'paginas')     return (b.paginas ?? 0) - (a.paginas ?? 0)
      // 'reciente' → orden original (id desc, ya viene así del servidor)
      return 0
    })

  // Géneros que realmente existen en la biblioteca del usuario
  const generosEnBiblioteca = ['TODOS', ...Array.from(new Set(libros.map(l => l.genero).filter(Boolean) as string[]))]

  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const estadoColor = (estado: string) => {
    if (estado === 'LEIDO')    return { bg: '#4cd137', color: '#000' }
    if (estado === 'LEYENDO')  return { bg: '#f1c40f', color: '#000' }
    if (estado === 'PAUSA')    return { bg: '#5dade2', color: '#000' }
    return { bg: 'rgba(255,255,255,0.25)', color: '#fff' }
  }

  return (
    <>
      {/* Toast de puntos */}
      {toast && (
        <Toast
          puntos={toast.puntos}
          mensaje={toast.mensaje}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal confirmar eliminación */}
      {libroAEliminar && (
        <div
          onClick={() => setLibroAEliminar(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e1a18',
              border: '1px solid rgba(255,94,87,0.35)',
              borderRadius: 18,
              padding: '2rem',
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗑️</div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ¿Eliminar este libro?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              &ldquo;{libroAEliminar.titulo}&rdquo;
            </p>
            <p style={{ color: 'rgba(255,94,87,0.8)', fontSize: '0.78rem', marginBottom: '1.75rem' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setLibroAEliminar(null)}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, color: '#fff',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: eliminando ? 'rgba(255,94,87,0.3)' : 'rgba(255,94,87,0.15)',
                  border: '1px solid rgba(255,94,87,0.5)',
                  borderRadius: 10, color: '#ff5e57',
                  fontWeight: 700, fontSize: '0.9rem', cursor: eliminando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <h1 className="h2 fw-bold text-white mb-0">
                    {soloLectura ? `Biblioteca de @${usuario.username}` : 'Mi Biblioteca'}
                  </h1>
                  <p className="text-muted small mb-0">
                    {soloLectura ? `${stats.total} libros · ${stats.leidos} leídos` : 'Gestiona tu viaje literario'}
                  </p>
                </div>
              </div>

              {/* Buscador para agregar — solo visible en mi propia biblioteca */}
              {!soloLectura && (
                <div className="p-3 rounded-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                  <label className="form-label text-gold fw-bold mb-2 text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.8rem' }}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Buscar libro para añadir
                  </label>
                  <div className="input-group">
                    <input type="text" className="form-control" placeholder="Escribe el título de un libro..."
                      style={{ border: '1px solid rgba(212,175,55,0.3)' }}
                      value={busquedaHeader}
                      onChange={e => { setBusquedaHeader(e.target.value); buscarHeader(e.target.value) }} />
                    <button className="btn btn-gold px-4 border-0" type="button" onClick={() => setShowModal(true)}>
                      <i className="bi bi-search fw-bold"></i>
                    </button>
                  </div>
                  {sugerenciasHeader.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: '#2c2724', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, zIndex: 999, maxHeight: 320, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', marginTop: 4 }}>
                      {sugerenciasHeader.map((s, i) => (
                        <button key={i} onClick={() => seleccionarDesdeHeader(s)}
                          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%', padding: '0.6rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {s.portada
                            ? <img src={s.portada} alt={s.titulo} style={{ width: 38, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                            : <div style={{ width: 38, height: 56, background: '#36302c', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📚</div>
                          }
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>{s.titulo}</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{s.autor}</div>
                            {s.anio && <div style={{ fontSize: '0.65rem', color: 'rgba(212,175,55,0.6)' }}>{s.anio}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
        {!soloLectura && (
          <BannerExplicativo
            icon="📚"
            titulo="Tu Biblioteca"
            descripcion="Todo lo que leés, en un solo lugar"
            pasos={[
              { icon: '🔍', texto: 'Buscá un libro por título y agregalo' },
              { icon: '🏷️', texto: 'Marcá su estado: Pendiente, Leyendo, Leído o Pausa' },
              { icon: '⭐', texto: 'Calificalo y escribí tu reseña' },
              { icon: '📝', texto: 'Anotá citas y usá el diario de lectura' },
            ]}
          />
        )}

        {/* ── Barra de filtros ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>

          {/* Fila 1: Estado + Agregar */}
          <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginRight: 4 }}>Estado</span>
            {['TODOS', ...ESTADOS].map(e => (
              <button key={e} onClick={() => setFiltro(e)}
                style={{
                  background: filtro === e ? 'linear-gradient(135deg,#d4af37,#f1c40f)' : 'rgba(255,255,255,0.05)',
                  border: filtro === e ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '0.3rem 0.85rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: filtro === e ? '#000' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {e === 'TODOS' ? 'Todos' : e === 'LEIDO' ? '✅ Leído' : e === 'LEYENDO' ? '📖 Leyendo' : e === 'PENDIENTE' ? '🕐 Pendiente' : '⏸ Pausa'}
              </button>
            ))}
            {!soloLectura && (
              <button onClick={() => setShowModal(true)} className="btn btn-gold btn-sm ms-auto px-4" style={{ flexShrink: 0 }}>
                <i className="bi bi-plus-lg me-1"></i>Agregar libro
              </button>
            )}
          </div>

          {/* Fila 2: Género + Calificación + Ordenar + Búsqueda */}
          <div className="d-flex gap-2 flex-wrap align-items-center">

            {/* Género */}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginRight: 4 }}>Género</span>
            <select
              value={filtroGenero}
              onChange={e => setFiltroGenero(e.target.value)}
              style={{
                background: filtroGenero !== 'TODOS' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border: filtroGenero !== 'TODOS' ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '0.3rem 0.85rem',
                fontSize: '0.75rem', fontWeight: 700,
                color: filtroGenero !== 'TODOS' ? '#d4af37' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {generosEnBiblioteca.map(g => (
                <option key={g} value={g} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {g === 'TODOS' ? '🌍 Todos los géneros' : g}
                </option>
              ))}
            </select>

            {/* Calificación mínima */}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginLeft: 8, marginRight: 4 }}>Mínimo</span>
            <select
              value={filtroEstrellas}
              onChange={e => setFiltroEstrellas(Number(e.target.value))}
              style={{
                background: filtroEstrellas > 0 ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border: filtroEstrellas > 0 ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '0.3rem 0.85rem',
                fontSize: '0.75rem', fontWeight: 700,
                color: filtroEstrellas > 0 ? '#d4af37' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value={0} style={{ background: '#1a1a1a' }}>⭐ Cualquier calificación</option>
              <option value={3} style={{ background: '#1a1a1a' }}>⭐⭐⭐ 3+ estrellas</option>
              <option value={4} style={{ background: '#1a1a1a' }}>⭐⭐⭐⭐ 4+ estrellas</option>
              <option value={5} style={{ background: '#1a1a1a' }}>⭐⭐⭐⭐⭐ Solo 5 estrellas</option>
            </select>

            {/* Ordenar */}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginLeft: 8, marginRight: 4 }}>Ordenar</span>
            <select
              value={ordenar}
              onChange={e => setOrdenar(e.target.value)}
              style={{
                background: ordenar !== 'reciente' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border: ordenar !== 'reciente' ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '0.3rem 0.85rem',
                fontSize: '0.75rem', fontWeight: 700,
                color: ordenar !== 'reciente' ? '#d4af37' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="reciente"  style={{ background: '#1a1a1a' }}>🕐 Más reciente</option>
              <option value="titulo"    style={{ background: '#1a1a1a' }}>🔤 Título A–Z</option>
              <option value="autor"     style={{ background: '#1a1a1a' }}>✍️ Autor A–Z</option>
              <option value="estrellas" style={{ background: '#1a1a1a' }}>⭐ Mejor calificado</option>
              <option value="paginas"   style={{ background: '#1a1a1a' }}>📄 Más páginas</option>
            </select>

            {/* Búsqueda dentro de la biblioteca */}
            <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 180px', maxWidth: 280 }}>
              <input
                ref={searchRef}
                type="text"
                placeholder={soloLectura ? '🔍 Buscar en esta biblioteca...' : '🔍 Buscar  (/)'}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  background: busqueda ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.05)',
                  border: busqueda ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '0.35rem 2rem 0.35rem 1rem',
                  fontSize: '0.75rem', color: '#fff', outline: 'none',
                  width: '100%', transition: 'border-color 0.15s',
                }}
              />
              {busqueda ? (
                <button onClick={() => setBusqueda('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                  ✕
                </button>
              ) : (
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none', fontWeight: 700 }}>
                  /
                </span>
              )}
            </div>
          </div>

          {/* Resultado + limpiar filtros */}
          <div className="d-flex align-items-center justify-content-between mt-3">
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {librosFiltrados.length === libros.length
                ? `${libros.length} libro${libros.length !== 1 ? 's' : ''} en total`
                : `${librosFiltrados.length} de ${libros.length} libros`}
            </span>
            {hayFiltrosActivos && (
              <button
                onClick={() => { setFiltro('TODOS'); setFiltroGenero('TODOS'); setFiltroEstrellas(0); setOrdenar('reciente'); setBusqueda('') }}
                style={{ background: 'none', border: 'none', color: '#ff5e57', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {librosFiltrados.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {busqueda ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                  Sin resultados para &ldquo;{busqueda}&rdquo;
                </p>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Probá con el título, autor o parte del nombre.
                </p>
                <button onClick={() => setBusqueda('')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', padding: '0.5rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <i className="bi bi-book display-1 mb-3 d-block opacity-25"></i>
                <p>No hay libros en esta categoría.</p>
                {!soloLectura && (
                  <button onClick={() => setShowModal(true)} className="btn btn-gold btn-sm mt-2">Agregar mi primer libro</button>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {librosFiltrados.map(libro => {
              const hovered = hoveredId === libro.id
              const ec = estadoColor(libro.estado)
              return (
                <div key={libro.id}
                  style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '2/3', cursor: 'pointer', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.7)' : '0 2px 10px rgba(0,0,0,0.4)', transform: hovered ? 'translateY(-6px) scale(1.02)' : 'none', transition: 'all 0.22s ease' }}
                  onMouseEnter={() => setHoveredId(libro.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Portada */}
                  {libro.portada_url && !imgErrors.has(libro.id) ? (
                    <Image
                      src={libro.portada_url.replace('http://', 'https://')}
                      alt={libro.titulo}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 480px) 33vw, (max-width: 768px) 20vw, 15vw"
                      onError={() => setImgErrors(prev => { const next = new Set(prev); next.add(libro.id); return next })}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#25211e,#36302c)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                      <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</span>
                      <span style={{ fontSize: '0.72rem', color: '#fff', textAlign: 'center', fontWeight: 700, lineHeight: 1.3 }}>{libro.titulo}</span>
                    </div>
                  )}

                  {/* Badge estado */}
                  <div style={{ position: 'absolute', top: 8, left: 8, background: ec.bg, color: ec.color, borderRadius: 99, padding: '2px 7px', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {libro.estado}
                  </div>

                  {/* Botón eliminar — solo en mi propia biblioteca */}
                  {!soloLectura && (
                    <button onClick={e => { e.stopPropagation(); setLibroAEliminar(libro) }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#ff5e57', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
                      ✕
                    </button>
                  )}

                  {/* Overlay hover */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)', padding: '1.2rem 0.65rem 0.75rem', transform: hovered ? 'translateY(0)' : 'translateY(35%)', opacity: hovered ? 1 : 0, transition: 'all 0.25s ease' }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.75rem', color: '#fff', lineHeight: 1.25, overflow: 'hidden', maxHeight: '2.5rem' } as React.CSSProperties}>{libro.titulo}</p>
                    <p style={{ margin: '0 0 6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)' }}>{libro.autor}</p>
                    {(libro.estrellas ?? 0) > 0 && (
                      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', letterSpacing: 1 }}>{'⭐'.repeat(libro.estrellas ?? 0)}</p>
                    )}
                    {libro.resena && (
                      <p style={{ margin: '0 0 7px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        &ldquo;{libro.resena}&rdquo;
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {libro.libro_global_id && (
                        <Link href={`/libro/${libro.libro_global_id}`}
                          style={{ flex: 1, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, padding: '0.3rem 0.25rem', fontSize: '0.6rem', fontWeight: 700, color: '#d4af37', textDecoration: 'none', textAlign: 'center' }}>
                          🌐 Ver
                        </Link>
                      )}
                      {!soloLectura && (
                        <>
                          <Link href={`/diario?libroId=${libro.id}`}
                            style={{ flex: 1, background: '#d4af37', borderRadius: 6, padding: '0.3rem 0.25rem', fontSize: '0.6rem', fontWeight: 700, color: '#000', textDecoration: 'none', textAlign: 'center' }}>
                            📖 Diario
                          </Link>
                          <button onClick={() => setEditando(libro)}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '0.3rem 0.25rem', fontSize: '0.6rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                            ✏️ Editar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal: Agregar libro — solo en mi propia biblioteca */}
      {!soloLectura && showModal && (
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
                    <div className="col-12"><label className="form-label text-muted">Título *</label><input name="titulo" type="text" className="form-control" required value={formNuevo.titulo} onChange={e => setFormNuevo(p => ({...p, titulo: e.target.value}))} /></div>
                    <div className="col-12"><label className="form-label text-muted">Autor *</label><input name="autor" type="text" className="form-control" required value={formNuevo.autor} onChange={e => setFormNuevo(p => ({...p, autor: e.target.value}))} /></div>
                    <div className="col-6"><label className="form-label text-muted">Año</label><input name="anio" type="number" className="form-control" value={formNuevo.anio} onChange={e => setFormNuevo(p => ({...p, anio: e.target.value}))} /></div>
                    <div className="col-6"><label className="form-label text-muted">Páginas</label><input name="paginas" type="number" className="form-control" value={formNuevo.paginas} onChange={e => setFormNuevo(p => ({...p, paginas: e.target.value}))} /></div>
                    <div className="col-12"><label className="form-label text-muted">URL de portada</label><input name="portada_url" type="text" className="form-control" value={formNuevo.portada_url} onChange={e => setFormNuevo(p => ({...p, portada_url: e.target.value}))} /></div>
                    <div className="col-4">
                      <label className="form-label text-muted">Estado</label>
                      <select name="estado" className="form-select">{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                    <div className="col-4">
                      <label className="form-label text-muted">Género</label>
                      <select name="genero" className="form-select" value={formNuevo.genero} onChange={e => setFormNuevo(p => ({...p, genero: e.target.value}))}>
                        <option value="">Sin género</option>
                        {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
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

      {/* Modal: Editar libro — solo en mi propia biblioteca */}
      {!soloLectura && editando && (
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
