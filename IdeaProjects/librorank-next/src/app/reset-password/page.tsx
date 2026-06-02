'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    if (!token) setError('Link inválido. Pedí uno nuevo desde la página de login.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Error al restablecer la contraseña')
      else {
        setExito(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form-container">
      {exito ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ marginBottom: '0.75rem' }}>¡Contraseña actualizada!</h1>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Tu contraseña fue restablecida correctamente. Te redirigimos al login...
          </p>
          <Link href="/login" className="btn-auth" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
            Ir al inicio de sesión
          </Link>
        </div>
      ) : (
        <>
          <h1>Nueva contraseña</h1>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Ingresá tu nueva contraseña. Debe tener al menos 6 caracteres.
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
              <label htmlFor="password">Nueva contraseña</label>
              <input
                type="password"
                id="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label htmlFor="password2">Repetí la contraseña</label>
              <input
                type="password"
                id="password2"
                className="auth-input"
                placeholder="••••••••"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                required
              />
            </div>
            <button
              className="btn-auth"
              type="submit"
              disabled={loading || !password || !password2 || !token}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <aside className="auth-visual" />
      <main className="auth-content">
        <header className="auth-header">
          <Link href="/" className="logo text-decoration-none">Libro<span>Rank</span></Link>
        </header>
        <Suspense fallback={<div className="auth-form-container"><p className="text-muted">Cargando...</p></div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  )
}
