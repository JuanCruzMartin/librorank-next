'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Error al enviar el email')
      else setEnviado(true)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-visual" />
      <main className="auth-content">
        <header className="auth-header">
          <Link href="/" className="logo text-decoration-none">Libro<span>Rank</span></Link>
        </header>

        <div className="auth-form-container">
          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
              <h1 style={{ marginBottom: '0.75rem' }}>¡Revisá tu email!</h1>
              <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                Si existe una cuenta con <strong style={{ color: '#fff' }}>{email}</strong>, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-muted small mb-4">
                No olvides revisar la carpeta de spam.
              </p>
              <Link href="/login" className="btn-auth" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h1>Recuperar contraseña</h1>
              <p className="text-muted" style={{ marginBottom: '2rem' }}>
                Ingresá tu email y te mandamos un link para restablecer tu contraseña.
              </p>

              {error && (
                <div style={{
                  color: '#ff4d4d', background: 'rgba(255,77,77,0.1)',
                  border: '1px solid rgba(255,77,77,0.3)',
                  borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="auth-input"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-auth" type="submit" disabled={loading || !email}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                </button>
                <p className="text-muted text-center mt-4">
                  <Link href="/login" className="text-gold fw-bold">← Volver al inicio de sesión</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
