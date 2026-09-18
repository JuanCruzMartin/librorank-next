'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

interface LibroExterno {
  titulo: string
  autor: string
  anio: string
  paginas: string | number
  portada: string
  genero: string
  descripcion: string
  id?: string
}

interface Review {
  resena: string
  estrellas: number
  username: string
}

interface Distribucion {
  estrellas: number
  cantidad: number
}

interface Comunidad {
  nota_media: number
  total_lectores: number
  reviews: Review[]
  distribucion: Distribucion[]
}

interface ResultadoEscaneo {
  libro: LibroExterno
  comunidad: Comunidad
}

function Estrellas({ valor, size = 'md' }: { valor: number; size?: 'sm' | 'md' | 'lg' }) {
  const tam = size === 'lg' ? '1.6rem' : size === 'md' ? '1.2rem' : '0.9rem'
  return (
    <span style={{ fontSize: tam, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(valor) ? '#d4af37' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </span>
  )
}

function BarraDistribucion({ distribucion }: { distribucion: Distribucion[] }) {
  const total = distribucion.reduce((s, d) => s + d.cantidad, 0)
  if (total === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[5, 4, 3, 2, 1].map(n => {
        const item = distribucion.find(d => d.estrellas === n)
        const cantidad = item?.cantidad ?? 0
        const pct = total > 0 ? (cantidad / total) * 100 : 0
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', width: 8, textAlign: 'right' }}>{n}</span>
            <span style={{ color: '#d4af37', fontSize: '0.7rem' }}>★</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #d4af37, #f1c40f)', borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', width: 16, textAlign: 'right' }}>{cantidad}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function EscanearClient() {
  const [showScanner, setShowScanner] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoEscaneo | null>(null)
  const [isbnEscaneado, setIsbnEscaneado] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [agregadoMsg, setAgregadoMsg] = useState('')

  // Fallback búsqueda por título cuando ISBN no se encuentra
  const [isbnNoEncontrado, setIsbnNoEncontrado] = useState(false)
  const [busquedaFallback, setBusquedaFallback] = useState('')
  const [sugerencias, setSugerencias] = useState<LibroExterno[]>([])
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function cargarResultado(libro: LibroExterno, isbn?: string) {
    setCargando(true)
    try {
      const [googleExtra, comunidadRes] = await Promise.all([
        isbn
          ? fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
        fetch(`/api/escanear?titulo=${encodeURIComponent(libro.titulo)}&autor=${encodeURIComponent(libro.autor)}`).then(r => r.json()).catch(() => ({ nota_media: 0, total_lectores: 0, reviews: [], distribucion: [] })),
      ])

      const descripcion = googleExtra?.items?.[0]?.volumeInfo?.description || ''

      setResultado({
        libro: { ...libro, descripcion },
        comunidad: comunidadRes,
      })
      setIsbnNoEncontrado(false)
      setSugerencias([])
      setBusquedaFallback('')
    } finally {
      setCargando(false)
    }
  }

  const onDetected = useCallback(async (isbn: string) => {
    setShowScanner(false)
    setCargando(true)
    setResultado(null)
    setIsbnNoEncontrado(false)
    setSugerencias([])
    setBusquedaFallback('')
    setIsbnEscaneado(isbn)
    setAgregadoMsg('')

    try {
      const buscarRes = await fetch(`/api/libros/buscar?q=${encodeURIComponent(isbn)}`)
      const buscarData: LibroExterno[] = await buscarRes.json()
      const libroRaw = buscarData[0]

      if (!libroRaw || !libroRaw.titulo) {
        // ISBN no encontrado → activar fallback de búsqueda por título
        setCargando(false)
        setIsbnNoEncontrado(true)
        return
      }

      await cargarResultado(libroRaw, isbn)
    } catch {
      setCargando(false)
      setIsbnNoEncontrado(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onBusquedaFallbackChange(valor: string) {
    setBusquedaFallback(valor)
    setSugerencias([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!valor.trim() || valor.trim().length < 2) { setCargandoSugerencias(false); return }

    setCargandoSugerencias(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/libros/buscar?q=${encodeURIComponent(valor.trim())}`)
        const data: LibroExterno[] = await res.json()
        setSugerencias(data.slice(0, 6))
      } catch {
        setSugerencias([])
      } finally {
        setCargandoSugerencias(false)
      }
    }, 350)
  }

  async function agregarABiblioteca() {
    if (!resultado || agregando) return
    setAgregando(true)
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: resultado.libro.titulo,
          autor: resultado.libro.autor,
          anio: resultado.libro.anio || null,
          paginas: resultado.libro.paginas || null,
          portada_url: resultado.libro.portada || null,
          genero: resultado.libro.genero || null,
          estado: 'PENDIENTE',
          mood: null,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setAgregadoMsg('¡Libro agregado a tu biblioteca!')
      } else if (json.error === 'ya_existe') {
        setAgregadoMsg('Ya tenés este libro en tu biblioteca.')
      } else {
        setAgregadoMsg('No se pudo agregar. Intentá desde Biblioteca.')
      }
    } catch {
      setAgregadoMsg('Error de conexión. Intentá de nuevo.')
    } finally {
      setAgregando(false)
    }
  }

  function resetear() {
    setResultado(null)
    setIsbnNoEncontrado(false)
    setIsbnEscaneado(null)
    setSugerencias([])
    setBusquedaFallback('')
    setAgregadoMsg('')
  }

  return (
    <main className="container py-5" style={{ maxWidth: 680 }}>
      <div className="mb-5">
        <h1 className="font-title display-5 mb-2">📷 Escanear libro</h1>
        <p className="text-muted">
          Apuntá la cámara al código de barras de cualquier libro y mirá su puntaje en la comunidad LibroRank.
        </p>
      </div>

      {/* Estado: pantalla inicial */}
      {!resultado && !cargando && !isbnNoEncontrado && (
        <div className="card p-5 text-center" style={{ border: '2px dashed rgba(212,175,55,0.3)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h5 className="font-title mb-2" style={{ color: 'var(--accent-gold)' }}>¿Vale la pena leerlo?</h5>
          <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
            Escaneá el código de barras de un libro y mirá el puntaje de la comunidad, reseñas y más.
          </p>
          <button
            onClick={() => setShowScanner(true)}
            className="btn-gold"
            style={{ fontSize: '1rem', padding: '0.85rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            📷 Escanear código de barras
          </button>
          <p className="text-muted mt-3" style={{ fontSize: '0.75rem' }}>Compatible con códigos ISBN-13 e ISBN-10</p>
        </div>
      )}

      {/* Estado: cargando */}
      {cargando && (
        <div className="card p-5 text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔍</div>
          <p className="text-muted mb-1">Buscando libro{isbnEscaneado ? ` (ISBN: ${isbnEscaneado})` : ''}...</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Consultando Google Books y la comunidad LibroRank</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Estado: ISBN no encontrado → búsqueda manual por título */}
      {isbnNoEncontrado && !cargando && (
        <div className="card p-4">
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔎</div>
            <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
              ISBN no encontrado en bases de datos
            </p>
            {isbnEscaneado && (
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem' }}>
                ISBN escaneado: {isbnEscaneado}
              </p>
            )}
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: 0 }}>
              Buscalo por título para ver el puntaje de la comunidad.
            </p>
          </div>

          {/* Buscador por título */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Escribí el título o autor..."
              value={busquedaFallback}
              onChange={e => onBusquedaFallbackChange(e.target.value)}
              autoFocus
              style={{ paddingRight: cargandoSugerencias ? '2.5rem' : undefined }}
            />
            {cargandoSugerencias && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                ⏳
              </span>
            )}
          </div>

          {/* Sugerencias */}
          {sugerencias.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  onClick={() => cargarResultado(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '0.65rem 0.85rem',
                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  {s.portada ? (
                    <img src={s.portada} alt={s.titulo} style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div style={{ width: 36, height: 50, background: 'rgba(255,255,255,0.05)', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📚</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.titulo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{s.autor}{s.anio ? ` · ${s.anio}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => { resetear(); setShowScanner(true) }} className="btn-gold" style={{ flex: 1 }}>
              📷 Escanear de nuevo
            </button>
            <button onClick={resetear} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="card p-4">
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                {resultado.libro.portada ? (
                  <img
                    src={resultado.libro.portada}
                    alt={resultado.libro.titulo}
                    style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: 90, height: 135, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📚</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                  Libro encontrado
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', lineHeight: 1.3, marginBottom: '0.3rem' }}>
                  {resultado.libro.titulo}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem' }}>
                  {resultado.libro.autor}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {resultado.libro.anio && (
                    <span style={{ fontSize: '0.72rem', color: 'rgba(212,175,55,0.7)', background: 'rgba(212,175,55,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                      {resultado.libro.anio}
                    </span>
                  )}
                  {resultado.libro.paginas && (
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                      {resultado.libro.paginas} pág.
                    </span>
                  )}
                  {resultado.libro.genero && (
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                      {resultado.libro.genero}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {resultado.libro.descripcion && (
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginTop: '1rem', marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {resultado.libro.descripcion}
              </p>
            )}
          </div>

          <div className="card p-4">
            <h6 className="font-title mb-4" style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>
              🌎 Comunidad LibroRank
            </h6>
            {resultado.comunidad.total_lectores === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 0 }}>
                  Todavía nadie en LibroRank leyó este libro. ¡Sé el primero!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>
                      {resultado.comunidad.nota_media > 0 ? resultado.comunidad.nota_media.toFixed(1) : '—'}
                    </div>
                    {resultado.comunidad.nota_media > 0 && <Estrellas valor={resultado.comunidad.nota_media} size="md" />}
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                      {resultado.comunidad.total_lectores} {resultado.comunidad.total_lectores === 1 ? 'lector' : 'lectores'}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <BarraDistribucion distribucion={resultado.comunidad.distribucion} />
                  </div>
                </div>
                {resultado.comunidad.reviews.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.75rem' }}>
                      Reseñas
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {resultado.comunidad.reviews.map((r, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(212,175,55,0.8)' }}>@{r.username}</span>
                            <Estrellas valor={r.estrellas} size="sm" />
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 0 }}>{r.resena}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {agregadoMsg ? (
              <div style={{ flex: 1, textAlign: 'center', padding: '0.85rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, fontSize: '0.9rem', color: '#d4af37', fontWeight: 600 }}>
                {agregadoMsg}
              </div>
            ) : (
              <button onClick={agregarABiblioteca} disabled={agregando} className="btn-gold" style={{ flex: 1, padding: '0.85rem', fontSize: '0.95rem' }}>
                {agregando ? 'Agregando...' : '+ Agregar a mi biblioteca'}
              </button>
            )}
            <button
              onClick={() => { resetear(); setShowScanner(true) }}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '0.85rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}
            >
              📷 Escanear otro
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onDetected={onDetected} onClose={() => setShowScanner(false)} />
      )}
    </main>
  )
}
