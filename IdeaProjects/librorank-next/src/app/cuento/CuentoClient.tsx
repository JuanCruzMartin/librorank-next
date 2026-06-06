'use client'

import { useState } from 'react'
import type { FragmentoHistoria } from '@/lib/dao/cuentoDAO'
import BannerExplicativo from '@/components/BannerExplicativo'

interface Props {
  fragmentos: FragmentoHistoria[]
  yaEscribio: boolean
  usuarioId: number
}

export default function CuentoClient({ fragmentos: fragmentosIni, yaEscribio: yaEscribioIni }: Props) {
  const [fragmentos, setFragmentos] = useState(fragmentosIni)
  const [yaEscribio, setYaEscribio] = useState(yaEscribioIni)
  const [contenido, setContenido] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    setEnviando(true)
    setError('')

    try {
      const res = await fetch('/api/cuento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
      } else {
        // Refrescar lista de fragmentos sin recargar la página
        const refetch = await fetch('/api/cuento')
        if (refetch.ok) {
          const updated = await refetch.json()
          setFragmentos(updated.fragmentos)
        }
        setYaEscribio(true)
        setContenido('')
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container py-5">
      <BannerExplicativo
        icon="✍️"
        titulo="Cuento Colaborativo"
        descripcion="Una historia escrita entre todos"
        pasos={[
          { icon: '📖', texto: 'Cada usuario agrega un fragmento a la historia' },
          { icon: '🔗', texto: 'Los fragmentos se encadenan en orden' },
          { icon: '🎨', texto: 'Dejate llevar y sé creativo' },
          { icon: '⭐', texto: 'Ganás 30 puntos por cada fragmento que aportás' },
        ]}
        color="#27ae60"
      />
      {/* Encabezado */}
      <div className="mb-5">
        <h1 className="font-title display-5 mb-2">✍️ El Gran Cuento</h1>
        <p className="text-muted">Una historia escrita entre todos los lectores de LibroRank. Cada uno aporta su hoja.</p>
      </div>

      {/* ── LIBRO (fondo crema, fuente Georgia) ── */}
      {fragmentos.length === 0 ? (
        <div className="book-container text-center mb-5">
          <p style={{ color: '#7a5c4a', fontStyle: 'italic', fontSize: '1.1rem' }}>
            La historia aún no ha comenzado. ¡Sé el primero en escribir tu hoja!
          </p>
        </div>
      ) : (
        <div className="book-container mb-5">
          <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#7a5c4a', fontSize: '0.85rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {fragmentos.length} {fragmentos.length === 1 ? 'hoja' : 'hojas'} escritas
          </div>

          {fragmentos.map(f => (
            <div key={f.id} className="fragmento">
              <div className="fragmento-meta d-flex justify-content-between align-items-center">
                <span style={{ color: '#b8860b', fontWeight: 700 }}>Hoja #{f.numero_hoja}</span>
                <span>@{f.username}</span>
              </div>
              <p className="fragmento-texto">{f.contenido}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── FORMULARIO DARK (debajo del libro) ── */}
      <div className="card p-4 p-md-5" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h5 className="font-title mb-1" style={{ color: 'var(--accent-gold)' }}>
          {yaEscribio ? '✅ Ya contribuiste' : '✍️ Tu contribución'}
        </h5>
        <p className="text-muted small mb-4">
          {yaEscribio
            ? 'Cada lector puede agregar una sola hoja a la historia.'
            : 'Continuá la historia donde la dejó el lector anterior. Máximo 1000 caracteres.'}
        </p>

        {yaEscribio ? (
          <div className="text-center py-3">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <p className="text-muted">Gracias por contribuir al Gran Cuento de LibroRank.</p>
          </div>
        ) : (
          <form onSubmit={enviar}>
            {error && (
              <div style={{
                background: 'rgba(255,77,77,0.1)',
                border: '1px solid rgba(255,77,77,0.3)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                color: '#ff4d4d',
                marginBottom: '1rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div className="mb-3">
              <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                rows={8}
                maxLength={1000}
                className="form-control"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  resize: 'vertical',
                }}
                placeholder="Continuá la historia..."
                required
              />
              {/* Contador de caracteres */}
              <div className="d-flex justify-content-between mt-2">
                <span className="text-muted small">
                  {1000 - contenido.length} caracteres restantes
                </span>
                <span className="small fw-bold" style={{
                  color: contenido.length > 900 ? '#ff4d4d' : contenido.length > 700 ? '#f39c12' : 'var(--accent-gold)',
                }}>
                  {contenido.length} / 1000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando || !contenido.trim()}
              className="btn-gold w-100"
            >
              {enviando ? 'Enviando...' : 'Agregar mi hoja'}
            </button>
          </form>
        )}
      </div>

    </div>
  )
}
