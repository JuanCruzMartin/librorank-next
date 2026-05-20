'use client'

import { useState } from 'react'

export function AgregarAmigoBtnClient({ amigoId }: { amigoId: number }) {
  const [agregado, setAgregado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function agregar() {
    setLoading(true)
    await fetch('/api/amigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'agregar', amigoId }),
    })
    setLoading(false)
    setAgregado(true)
  }

  if (agregado) return <span className="badge-cozy small">siguiendo</span>

  return (
    <button onClick={agregar} disabled={loading} className="btn btn-sm btn-outline-secondary">
      {loading ? '...' : '+ Seguir'}
    </button>
  )
}
