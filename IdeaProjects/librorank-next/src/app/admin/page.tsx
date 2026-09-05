'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resultado, setResultado] = useState<{ ok?: boolean; error?: string; mensaje?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillRes, setBackfillRes] = useState<{ ok?: boolean; mensaje?: string; detalle?: { titulo: string; genero: string }[]; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResultado(null)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, email, newPassword }),
      })
      const data = await res.json()
      setResultado(data)
      if (data.ok) {
        setEmail('')
        setNewPassword('')
      }
    } catch {
      setResultado({ error: 'Error de red' })
    } finally {
      setLoading(false)
    }
  }

  async function handleBackfill() {
    if (!secret) { setBackfillRes({ error: 'Ingresá la clave admin primero' }); return }
    setBackfillLoading(true)
    setBackfillRes(null)
    try {
      const res = await fetch('/api/admin/backfill-generos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      const data = await res.json()
      setBackfillRes(data)
    } catch {
      setBackfillRes({ error: 'Error de red' })
    } finally {
      setBackfillLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: '#141414',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 16,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 style={{ color: '#d4af37', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Admin — LibroRank</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Reseteo de contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem', fontWeight: 600 }}>
              Clave admin
            </label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem', fontWeight: 600 }}>
              Email del usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem', fontWeight: 600 }}>
              Nueva contraseña
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#d4af37,#f1c40f)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: 10,
              padding: '0.75rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Actualizando…' : 'Resetear contraseña'}
          </button>
        </form>

        {resultado && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: 10,
            background: resultado.ok ? 'rgba(74,158,122,0.12)' : 'rgba(231,76,60,0.12)',
            border: `1px solid ${resultado.ok ? 'rgba(74,158,122,0.3)' : 'rgba(231,76,60,0.3)'}`,
            fontSize: '0.85rem',
            color: resultado.ok ? '#4cd137' : '#e74c3c',
            textAlign: 'center',
          }}>
            {resultado.ok ? `✅ ${resultado.mensaje}` : `❌ ${resultado.error}`}
          </div>
        )}

        {/* ── Backfill géneros ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '2rem', paddingTop: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🎭</div>
            <h2 style={{ color: '#d4af37', fontSize: '1rem', fontWeight: 800, margin: 0 }}>Auto-asignar géneros</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: '0.3rem' }}>
              Busca en Google Books los libros sin género y los actualiza automáticamente
            </p>
          </div>
          <button
            onClick={handleBackfill}
            disabled={backfillLoading}
            style={{
              width: '100%',
              background: backfillLoading ? 'rgba(93,173,226,0.3)' : 'linear-gradient(135deg,#2980b9,#5dade2)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: 10,
              padding: '0.75rem',
              cursor: backfillLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {backfillLoading ? 'Buscando géneros… (puede tardar 1-2 min)' : 'Asignar géneros automáticamente'}
          </button>

          {backfillRes && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                padding: '0.85rem 1rem', borderRadius: 10,
                background: backfillRes.ok ? 'rgba(74,158,122,0.12)' : 'rgba(231,76,60,0.12)',
                border: `1px solid ${backfillRes.ok ? 'rgba(74,158,122,0.3)' : 'rgba(231,76,60,0.3)'}`,
                fontSize: '0.85rem',
                color: backfillRes.ok ? '#4cd137' : '#e74c3c',
                textAlign: 'center',
                marginBottom: backfillRes.detalle?.length ? '0.75rem' : 0,
              }}>
                {backfillRes.ok ? `✅ ${backfillRes.mensaje}` : `❌ ${backfillRes.error}`}
              </div>
              {backfillRes.detalle && backfillRes.detalle.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                  {backfillRes.detalle.map((d, i) => (
                    <div key={i} style={{ padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#fff' }}>{d.titulo}</span> → <span style={{ color: '#d4af37' }}>{d.genero}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '0.6rem 0.85rem',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}
