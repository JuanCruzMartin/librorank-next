'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Libro {
  id: number
  titulo: string
  autor: string
  portada_url: string | null
  paginas: number | null
  libro_global_id: number | null
}

interface LogHoy {
  libro_usuario_id: number
  paginas: number
}

interface Props {
  libros: Libro[]
  logsHoy: LogHoy[]
}

interface Feedback {
  ptsGanados: number
  racha: number
  escudoGanado: boolean
  milestoneAlcanzado: number | null
}

export default function LeyendoAhoraWidget({ libros, logsHoy: logsIniciales }: Props) {
  const [logs, setLogs] = useState<LogHoy[]>(logsIniciales)
  const [abierto, setAbierto] = useState<number | null>(null)
  const [paginas, setPaginas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<{ libroId: number; data: Feedback } | null>(null)

  function paginasHoy(libroId: number) {
    return logs.find(l => l.libro_usuario_id === libroId)?.paginas ?? 0
  }

  async function registrar(libroId: number) {
    const n = parseInt(paginas)
    if (!n || n < 1) return
    setEnviando(true)
    const res = await fetch('/api/registro-lectura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libroUsuarioId: libroId, paginas: n }),
    })
    const data = await res.json()
    if (data.ok) {
      setLogs(prev => {
        const existe = prev.find(l => l.libro_usuario_id === libroId)
        if (existe) return prev.map(l => l.libro_usuario_id === libroId ? { ...l, paginas: l.paginas + n } : l)
        return [...prev, { libro_usuario_id: libroId, paginas: n }]
      })
      setFeedback({ libroId, data })
      setAbierto(null)
      setPaginas('')
      setTimeout(() => setFeedback(null), 3000)
    }
    setEnviando(false)
  }

  if (libros.length === 0) return null

  return (
    <div>
      <p className="small text-muted mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.8px', fontSize: '0.65rem' }}>
        📖 Leyendo ahora
      </p>
      <div className="d-flex flex-column gap-3">
        {libros.map(libro => {
          const leidas = paginasHoy(libro.id)
          const yaRegistro = leidas > 0
          const pct = libro.paginas && libro.paginas > 0 ? Math.min(Math.round((leidas / libro.paginas) * 100), 100) : null
          const isFeedback = feedback?.libroId === libro.id

          return (
            <div key={libro.id}>
              <div className="d-flex gap-2 align-items-center">
                {/* Portada */}
                {libro.portada_url ? (
                  libro.libro_global_id ? (
                    <Link href={`/libro/${libro.libro_global_id}`} style={{ flexShrink: 0 }}>
                      <Image
                        src={libro.portada_url.replace('http://', 'https://')}
                        alt={libro.titulo}
                        width={32} height={46}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={libro.portada_url.replace('http://', 'https://')}
                      alt={libro.titulo}
                      width={32} height={46}
                      style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  )
                ) : (
                  <div style={{ width: 32, height: 46, background: 'rgba(212,175,55,0.1)', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📚</div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.75rem' }}>{libro.titulo}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>{libro.autor}</div>

                  {/* Progreso si hay total de páginas */}
                  {libro.paginas && libro.paginas > 0 && leidas > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3498db,#5dade2)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {leidas} / {libro.paginas} pgs hoy ({pct}%)
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón */}
                {yaRegistro ? (
                  <button
                    onClick={() => setAbierto(abierto === libro.id ? null : libro.id)}
                    style={{ flexShrink: 0, background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.35)', borderRadius: 6, padding: '3px 7px', fontSize: '0.62rem', color: '#27ae60', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ✓ {leidas} pgs +
                  </button>
                ) : (
                  <button
                    onClick={() => setAbierto(abierto === libro.id ? null : libro.id)}
                    style={{ flexShrink: 0, background: 'rgba(93,173,226,0.12)', border: '1px solid rgba(93,173,226,0.35)', borderRadius: 6, padding: '3px 7px', fontSize: '0.62rem', color: '#5dade2', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + páginas
                  </button>
                )}
              </div>

              {/* Feedback flash */}
              {isFeedback && feedback && (
                <div style={{ marginTop: 6, padding: '5px 10px', borderRadius: 6, background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', fontSize: '0.72rem', color: '#2ecc71', fontWeight: 700 }}>
                  +{feedback.data.ptsGanados} pts · 🔥 racha {feedback.data.racha}d
                  {feedback.data.escudoGanado && ' · 🛡️ ¡escudo ganado!'}
                  {feedback.data.milestoneAlcanzado && ` · 🏆 milestone ${feedback.data.milestoneAlcanzado}d`}
                </div>
              )}

              {/* Input inline */}
              {abierto === libro.id && (
                <div className="d-flex gap-2 align-items-center mt-2" style={{ paddingLeft: 40 }}>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={paginas}
                    onChange={e => setPaginas(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && registrar(libro.id)}
                    placeholder="Páginas"
                    autoFocus
                    style={{
                      width: 80, padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => registrar(libro.id)}
                    disabled={enviando || !paginas}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: 'none',
                      background: 'linear-gradient(135deg,#b8860b,#d4af37)',
                      color: '#000', fontWeight: 700, fontSize: '0.75rem',
                      cursor: enviando || !paginas ? 'default' : 'pointer',
                      opacity: !paginas ? 0.5 : 1,
                    }}
                  >
                    {enviando ? '...' : 'Guardar'}
                  </button>
                  <button onClick={() => { setAbierto(null); setPaginas('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
