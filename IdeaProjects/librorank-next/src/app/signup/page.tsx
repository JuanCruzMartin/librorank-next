'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: fd.get('nombre'),
        usuario: fd.get('usuario'),
        email: fd.get('email'),
        password: fd.get('password'),
        password2: fd.get('password2'),
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) setError(json.error || 'Error al registrarse')
    else { router.push(json.redirect || '/home'); router.refresh() }
  }

  return (
    <div className="auth-page">
      <aside className="auth-visual" />
      <main className="auth-content" style={{ width: 580 }}>
        <header className="auth-header">
          <Link href="/" className="logo text-decoration-none">Libro<span>Rank</span></Link>
        </header>

        <div className="auth-form-container">
          <h1>Crea tu cuenta</h1>
          <p className="text-muted">Unite a miles de lectores. Tu aventura empieza acá.</p>

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
            <div className="row">
              <div className="col-md-6">
                <div className="field">
                  <label>Nombre completo</label>
                  <input type="text" name="nombre" className="auth-input" placeholder="Juan Pérez" required />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>Usuario</label>
                  <input type="text" name="usuario" className="auth-input" placeholder="@lector123" required />
                </div>
              </div>
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" name="email" className="auth-input" placeholder="tu@email.com" required />
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="field">
                  <label>Contraseña</label>
                  <input type="password" name="password" className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field">
                  <label>Repetir contraseña</label>
                  <input type="password" name="password2" className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="terms" name="terms" required style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)', flexShrink: 0 }} />
              <label htmlFor="terms" style={{ fontSize: '0.9rem', color: '#ccc', cursor: 'pointer' }}>
                Acepto los{' '}
                <a href="#" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>
                  términos y condiciones
                </a>
              </label>
            </div>

            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Comenzar mi aventura'}
            </button>

            <p className="text-muted text-center mt-4">
              ¿Ya sos parte?{' '}
              <Link href="/login" className="text-gold fw-bold">Iniciá sesión acá</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
