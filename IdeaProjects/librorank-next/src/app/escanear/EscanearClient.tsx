'use client'

import { useState, useCallback } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const [isbnEscaneado, setIsbnEscaneado] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [agregadoMsg, setAgregadoMsg] = useState('')

  const onDetected = useCallback(async (isbn: string) => {
    setShowScanner(false)
    setCargando(true)
    setError(null)
    setResultado(null)
    setIsbnEscaneado(isbn)
    setAgregadoMsg('')

    try {
      const res = await fetch(`/api/escanear?isbn=${encodeURIComponent(isbn)}`)
      if (res.status === 404) {
        setError('No encontramos información sobre este libro. Probá buscarlo en biblioteca.')
        return
      }
      if (!res.ok) throw new Error('Error del servidor')
      const data: ResultadoEscaneo = await res.json()
      setResultado(data)
    } catch {
      setError('Ocurrió un error al buscar el libro. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }, [])

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
    setError(null)
    setIsbnEscaneado(null)
    setAgregadoMsg('')
  }

  return (
    <main className="container py-5" style={{ maxWidth: 680 }}>
      {/* Título */}
      <div className="mb-5">
        <h1 className="font-title display-5 mb-2">📷 Escanear libro</h1>
        <p className="text-muted">
          Apuntá la cámara al código de barras de cualquier libro y mirá su puntaje en la comunidad LibroRank.
        </p>
      </div>

      {/* Estado: sin resultado */}
      {!resultado && !cargando && !error && (
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
          <p className="text-muted mt-3" style={{ fontSize: '0.75rem' }}>
            Compatible con códigos ISBN-13 e ISBN-10
          </p>
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

      {/* Estado: error */}
      {error && (
        <div className="card p-4 text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😕</div>
          <p className="text-white mb-3">{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowScanner(true)} className="btn-gold">
              📷 Escanear de nuevo
            </button>
            <button onClick={resetear} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Card principal del libro */}
          <div className="card p-4">
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              {/* Portada */}
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

              {/* Info */}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
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

            {/* Descripción */}
            {resultado.libro.descripcion && (
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginTop: '1rem', marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {resultado.libro.descripcion}
              </p>
            )}
          </div>

          {/* Card comunidad */}
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
                {/* Puntaje */}
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

                {/* Reseñas */}
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

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {agregadoMsg ? (
              <div style={{ flex: 1, textAlign: 'center', padding: '0.85rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, fontSize: '0.9rem', color: '#d4af37', fontWeight: 600 }}>
                {agregadoMsg}
              </div>
            ) : (
              <button
                onClick={agregarABiblioteca}
                disabled={agregando}
                className="btn-gold"
                style={{ flex: 1, padding: '0.85rem', fontSize: '0.95rem' }}
              >
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
