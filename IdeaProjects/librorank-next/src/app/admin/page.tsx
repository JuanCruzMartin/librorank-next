'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resultado, setResultado] = useState<{ ok?: boolean; error?: string; mensaje?: string } | null>(null)
  const [loading, setLoading] = useState(false)

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
