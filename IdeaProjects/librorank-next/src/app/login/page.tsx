'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: fd.get('identificador'), password: fd.get('password') }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) setError(json.error || 'Error al iniciar sesión')
    else { router.push(json.redirect || '/home'); router.refresh() }
  }

  return (
    <div className="auth-page">
      <aside className="auth-visual" />
      <main className="auth-content">
        <header className="auth-header">
          <Link href="/" className="logo text-decoration-none">Libro<span>Rank</span></Link>
        </header>

        <div className="auth-form-container">
          <h1>Inicia sesión</h1>
          <p className="text-muted">Qué bueno verte de nuevo. Tu biblioteca te espera.</p>

          {error && (
            <div style={{
              color: '#ff4d4d',
              background: 'rgba(255,77,77,0.1)',
              border: '1px solid rgba(255,77,77,0.3)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="identificador">Email o usuario</label>
              <input
                type="text"
                id="identificador"
                name="identificador"
                className="auth-input"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                className="auth-input"
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Entrar a mi biblioteca'}
            </button>
            <p className="text-muted text-center mt-4">
              ¿Todavía no tenés cuenta?{' '}
              <Link href="/signup" className="text-gold fw-bold">Creá tu cuenta gratis</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
