'use client'

import { useState } from 'react'
import type { Cuento } from '@/lib/dao/cuentoPersonalDAO'

const MAX_CHARS = 20000

function formatFecha(str: string) {
  return new Date(str).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function contarPalabras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length
}

export default function CuentoClient({ cuentosIniciales }: { cuentosIniciales: Cuento[] }) {
  const [cuentos, setCuentos] = useState<Cuento[]>(cuentosIniciales)
  const [vista, setVista] = useState<'lista' | 'editor' | 'leer'>('lista')
  const [editando, setEditando] = useState<Cuento | null>(null)
  const [leyendo, setLeyendo] = useState<Cuento | null>(null)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [publicado, setPublicado] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function abrirNuevo() {
    setEditando(null)
    setTitulo('')
    setContenido('')
    setPublicado(true)
    setError('')
    setVista('editor')
  }

  function abrirEditar(c: Cuento) {
    setEditando(c)
    setTitulo(c.titulo)
    setContenido(c.contenido)
    setPublicado(c.publicado)
    setError('')
    setVista('editor')
  }

  function abrirLeer(c: Cuento) {
    setLeyendo(c)
    setVista('leer')
  }

  async function guardar() {
    if (!contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    setGuardando(true)
    setError('')
    try {
      if (editando) {
        const res = await fetch(`/api/cuentos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, contenido, publicado }),
        })
        if (!res.ok) { setError('Error al guardar'); return }
        setCuentos(prev => prev.map(c => c.id === editando.id
          ? { ...c, titulo: titulo || 'Sin título', contenido, publicado, updated_at: new Date().toISOString() }
          : c))
      } else {
        const res = await fetch('/api/cuentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, contenido, publicado }),
        })
        if (!res.ok) { setError('Error al guardar'); return }
        const { id } = await res.json()
        const nuevo: Cuento = {
          id, usuario_id: 0,
          titulo: titulo || 'Sin título', contenido, publicado,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }
        setCuentos(prev => [nuevo, ...prev])
      }
      setVista('lista')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(c: Cuento) {
    if (!confirm(`¿Eliminar "${c.titulo}"? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/cuentos/${c.id}`, { method: 'DELETE' })
    setCuentos(prev => prev.filter(x => x.id !== c.id))
  }

  async function togglePublicado(c: Cuento) {
    const nuevo = !c.publicado
    await fetch(`/api/cuentos/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: c.titulo, contenido: c.contenido, publicado: nuevo }),
    })
    setCuentos(prev => prev.map(x => x.id === c.id ? { ...x, publicado: nuevo } : x))
  }

  // ── LEER ──
  if (vista === 'leer' && leyendo) {
    return (
      <div>
        <button onClick={() => setVista('lista')} style={btnBack}>← Volver</button>
        <article style={{ marginTop: '1.5rem' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#fff', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {leyendo.titulo}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{formatFecha(leyendo.created_at)}</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>{contarPalabras(leyendo.contenido).toLocaleString()} palabras</span>
            {!leyendo.publicado && <span style={{ fontSize: '0.68rem', color: '#d4af37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20, padding: '2px 8px' }}>Borrador</span>}
          </div>
          <div style={{
            fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif',
            borderLeft: '3px solid rgba(212,175,55,0.25)', paddingLeft: '1.5rem',
          }}>
            {leyendo.contenido}
          </div>
        </article>
      </div>
    )
  }

  // ── EDITOR ──
  if (vista === 'editor') {
    const chars = contenido.length
    const palabras = contarPalabras(contenido)
    return (
      <div>
        <button onClick={() => setVista('lista')} style={btnBack}>← Volver</button>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Título del cuento..."
            maxLength={200}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '0.75rem 1rem',
              color: '#fff', fontSize: '1.3rem', fontFamily: 'Georgia, serif',
              fontWeight: 700, width: '100%', outline: 'none',
            }}
          />

          <div style={{ position: 'relative' }}>
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Escribí tu cuento acá..."
              rows={20}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '1rem', color: 'rgba(255,255,255,0.88)',
                fontSize: '1rem', fontFamily: 'Georgia, serif', lineHeight: 1.8,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: '0.65rem', color: chars > MAX_CHARS * 0.9 ? '#e74c3c' : 'rgba(255,255,255,0.2)' }}>
              {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()} · {palabras} palabras
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <input
                type="checkbox"
                checked={publicado}
                onChange={e => setPublicado(e.target.checked)}
                style={{ accentColor: '#7c3aed', width: 16, height: 16 }}
              />
              Publicar en mi perfil
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setVista('lista')} style={btnSecondary}>Cancelar</button>
              <button onClick={guardar} disabled={guardando || !contenido.trim()} style={{ ...btnPrimary, opacity: guardando || !contenido.trim() ? 0.5 : 1 }}>
                {guardando ? 'Guardando...' : editando ? '💾 Guardar cambios' : '✍️ Publicar cuento'}
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#e74c3c', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
        </div>
      </div>
    )
  }

  // ── LISTA ──
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2rem', color: '#fff' }}>✍️ Mis cuentos</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            {cuentos.length === 0 ? 'Todavía no escribiste nada. ¡Empezá ahora!' : `${cuentos.length} cuento${cuentos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={abrirNuevo} style={btnPrimary}>✍️ Nuevo cuento</button>
      </div>

      {cuentos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📖</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Las mejores historias están esperando ser escritas.
          </p>
          <button onClick={abrirNuevo} style={btnPrimary}>Escribir mi primer cuento</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cuentos.map(c => (
            <div key={c.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '1.25rem 1.5rem',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3
                      onClick={() => abrirLeer(c)}
                      style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.15rem', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {c.titulo}
                    </h3>
                    {!c.publicado && (
                      <span style={{ fontSize: '0.65rem', color: '#d4af37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                        Borrador
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {c.contenido}
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginTop: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>
                    <span>{formatFecha(c.created_at)}</span>
                    <span>{contarPalabras(c.contenido).toLocaleString()} palabras</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirLeer(c)} style={btnIcono} title="Leer">👁</button>
                  <button onClick={() => abrirEditar(c)} style={btnIcono} title="Editar">✏️</button>
                  <button onClick={() => togglePublicado(c)} style={btnIcono} title={c.publicado ? 'Ocultar del perfil' : 'Publicar en perfil'}>
                    {c.publicado ? '🌐' : '🔒'}
                  </button>
                  <button onClick={() => eliminar(c)} style={{ ...btnIcono, color: '#e74c3c' }} title="Eliminar">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
  boxShadow: '0 4px 16px rgba(124,58,237,0.35)', transition: 'all 0.15s',
}
const btnSecondary: React.CSSProperties = {
  padding: '0.6rem 1.25rem', borderRadius: 10, cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.88rem',
}
const btnBack: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 600, padding: 0,
}
const btnIcono: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: '0.9rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
