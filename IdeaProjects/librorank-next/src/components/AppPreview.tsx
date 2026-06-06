'use client'

import { useState } from 'react'

const TABS = [
  { key: 'biblioteca', label: 'Biblioteca', icon: '📚' },
  { key: 'misiones',   label: 'Misiones',   icon: '🎯' },
  { key: 'wrapped',    label: 'Tu Año',      icon: '📊' },
  { key: 'ranking',    label: 'Ranking',     icon: '🏆' },
]

// ── Mockup: Biblioteca ───────────────────────────────────────────────────────
function BibliotecaMockup() {
  const libros = [
    { titulo: 'El Nombre del Viento', autor: 'Patrick Rothfuss', estado: 'LEIDO',    color: '#8b4513' },
    { titulo: '1984',                  autor: 'George Orwell',    estado: 'LEIDO',    color: '#1a3a5c' },
    { titulo: 'Cien años de soledad',  autor: 'García Márquez',   estado: 'LEYENDO',  color: '#4a7c3f' },
    { titulo: 'Dune',                  autor: 'Frank Herbert',    estado: 'LEYENDO',  color: '#8b6914' },
    { titulo: 'El Principito',         autor: 'Saint-Exupéry',   estado: 'PENDIENTE',color: '#2c4a7c' },
    { titulo: 'Sapiens',               autor: 'Yuval Harari',     estado: 'LEIDO',    color: '#5c3a1e' },
  ]
  const estadoColor = (e: string) =>
    e === 'LEIDO' ? '#4cd137' : e === 'LEYENDO' ? '#f1c40f' : 'rgba(255,255,255,0.35)'

  return (
    <div>
      {/* Mini stats bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { icon: '📚', valor: '24', label: 'Leídos' },
          { icon: '📄', valor: '6.840', label: 'Páginas' },
          { icon: '✍️', valor: 'Rowling', label: 'Autor fav.' },
          { icon: '⭐', valor: 'Dune', label: 'Top rated' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.85rem' }}>{s.icon} {s.valor}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['Todos', '✅ Leído', '📖 Leyendo', '🕐 Pendiente'].map((f, i) => (
          <span key={f} style={{
            background: i === 0 ? 'linear-gradient(135deg,#d4af37,#f1c40f)' : 'rgba(255,255,255,0.05)',
            color: i === 0 ? '#000' : 'rgba(255,255,255,0.5)',
            border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '0.2rem 0.65rem',
            fontSize: '0.65rem', fontWeight: 700,
          }}>{f}</span>
        ))}
      </div>

      {/* Grid libros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem' }}>
        {libros.map(l => (
          <div key={l.titulo} style={{ aspectRatio: '2/3', borderRadius: 8, background: l.color, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
            {/* Título */}
            <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: '0.42rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{l.titulo}</div>
            {/* Badge estado */}
            <div style={{ position: 'absolute', top: 4, left: 4, background: estadoColor(l.estado), color: '#000', borderRadius: 99, padding: '1px 4px', fontSize: '0.38rem', fontWeight: 800 }}>
              {l.estado === 'LEIDO' ? '✓' : l.estado === 'LEYENDO' ? '▶' : '·'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mockup: Misiones ─────────────────────────────────────────────────────────
function MisionesMockup() {
  const misiones = [
    { icono: '📅', nombre: 'Lector del Mes', desc: 'Leé 1 libro este mes', progreso: 1, meta: 1, puntos: 100, tipo: 'mensual', color: '#5dade2', completada: true, reclamada: false },
    { icono: '⚡', nombre: 'Maratón Semanal', desc: 'Leé 2 libros esta semana', progreso: 1, meta: 2, puntos: 50, tipo: 'semanal', color: '#1abc9c', completada: false, reclamada: false },
    { icono: '🏆', nombre: 'Crítico Experto', desc: 'Escribí 10 reseñas', progreso: 7, meta: 10, puntos: 200, tipo: 'permanente', color: '#d4af37', completada: false, reclamada: false },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.25rem' }}>
        {[
          { label: 'Puntos totales', valor: '⭐ 840', color: '#d4af37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)' },
          { label: 'Completadas', valor: '✅ 3', color: '#27ae60', bg: 'rgba(39,174,96,0.1)', border: 'rgba(39,174,96,0.3)' },
          { label: 'Sin reclamar', valor: '🎁 1', color: '#ffa500', bg: 'rgba(255,165,0,0.15)', border: 'rgba(255,165,0,0.4)' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '0.5rem 0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color }}>{s.valor}</div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {misiones.map(m => {
        const pct = Math.round((m.progreso / m.meta) * 100)
        return (
          <div key={m.nombre} style={{
            background: m.completada ? `linear-gradient(135deg, ${m.color}12, ${m.color}05)` : 'rgba(255,255,255,0.03)',
            border: m.completada ? `1px solid ${m.color}50` : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '0.85rem',
          }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{m.icono}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.78rem' }}>{m.nombre}</div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{m.desc}</div>
              </div>
              <span style={{
                fontSize: '0.52rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20,
                background: m.tipo === 'mensual' ? 'rgba(41,128,185,0.2)' : m.tipo === 'semanal' ? 'rgba(22,160,133,0.2)' : 'rgba(212,175,55,0.15)',
                color: m.tipo === 'mensual' ? '#5dade2' : m.tipo === 'semanal' ? '#1abc9c' : '#d4af37',
              }}>
                {m.tipo === 'mensual' ? '📅 Mes' : m.tipo === 'semanal' ? '⚡ Sem.' : '🏆 Perm.'}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${m.color}aa, ${m.color})`, borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(212,175,55,0.8)', fontWeight: 700 }}>⭐ +{m.puntos} pts</span>
              {m.completada && !m.reclamada ? (
                <span style={{ background: 'linear-gradient(135deg,#d4af37,#f1c40f)', color: '#000', fontWeight: 800, fontSize: '0.62rem', padding: '0.25rem 0.7rem', borderRadius: 6 }}>
                  🎁 Reclamar
                </span>
              ) : (
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{pct}% completado</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Mockup: Wrapped ──────────────────────────────────────────────────────────
function WrappedMockup() {
  const meses = [
    { mes: 'Ene', total: 2 }, { mes: 'Feb', total: 1 }, { mes: 'Mar', total: 3 },
    { mes: 'Abr', total: 4 }, { mes: 'May', total: 2 }, { mes: 'Jun', total: 5 },
    { mes: 'Jul', total: 3 }, { mes: 'Ago', total: 1 }, { mes: 'Sep', total: 4 },
    { mes: 'Oct', total: 6 }, { mes: 'Nov', total: 2 }, { mes: 'Dic', total: 3 },
  ]
  const maxMes = Math.max(...meses.map(m => m.total))
  const generos = [
    { g: 'Fantasía', total: 8, color: '#af7ac5' },
    { g: 'Ciencia Ficción', total: 6, color: '#5dade2' },
    { g: 'Clásicos', total: 5, color: '#d4af37' },
    { g: 'Historia', total: 3, color: '#4cd137' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a1208)', borderRadius: 12, padding: '1.25rem', marginBottom: '0.75rem', textAlign: 'center', border: '1px solid rgba(212,175,55,0.2)' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', margin: '0 0 4px' }}>Tu año en libros</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>2025</div>
      </div>

      {/* Stats grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[
          { icon: '📚', valor: '36', label: 'libros', color: '#d4af37' },
          { icon: '📄', valor: '9.840', label: 'páginas', color: '#4cd137' },
          { icon: '⭐', valor: '4.2', label: 'prom.', color: '#f39c12' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}30`, borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.valor}</div>
            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de meses */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', marginBottom: '0.6rem', margin: '0 0 0.6rem' }}>
          📅 Lecturas por mes
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
          {meses.map((m, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: '100%',
                height: `${Math.max((m.total / maxMes) * 40, m.total > 0 ? 4 : 2)}px`,
                background: m.total === maxMes ? '#d4af37' : 'rgba(212,175,55,0.35)',
                borderRadius: 3,
              }} />
              <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.3)' }}>{m.mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Géneros */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem' }}>
        <p style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', margin: '0 0 0.6rem' }}>
          🎭 Top géneros
        </p>
        {generos.map(g => (
          <div key={g.g} style={{ marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', marginBottom: 2 }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{g.g}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{g.total}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${(g.total / 8) * 100}%`, background: g.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mockup: Ranking ──────────────────────────────────────────────────────────
function RankingMockup() {
  const usuarios = [
    { pos: 1, user: 'lectoravid',  pts: 2840, leidos: 47, liga: '💎', nivel: '📖 Oráculo' },
    { pos: 2, user: 'bookworm_ar', pts: 1920, leidos: 38, liga: '🥇', nivel: '🦅 Maestro' },
    { pos: 3, user: 'anabooklover',pts: 1450, leidos: 29, liga: '🥇', nivel: '🌟 Experto' },
    { pos: 4, user: 'juanmartin',  pts: 840,  leidos: 18, liga: '🥈', nivel: '🎯 Avanzado', soyYo: true },
    { pos: 5, user: 'readingchile', pts: 620, leidos: 14, liga: '🥈', nivel: '📗 Intermedio' },
  ]
  const liga = { nombre: 'Plata', emoji: '🥈', color: '#b0b8c1', bg: 'rgba(176,184,193,0.12)', border: 'rgba(176,184,193,0.35)' }

  return (
    <div>
      {/* Liga del usuario */}
      <div style={{ background: liga.bg, border: `1px solid ${liga.border}`, borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 800, color: liga.color, fontSize: '0.85rem' }}>{liga.emoji} Liga {liga.nombre}</span>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Faltan <strong style={{ color: '#fff' }}>160 pts</strong> para 🥇 Oro</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '73%', background: `linear-gradient(90deg, ${liga.color}aa, ${liga.color})`, borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)' }}>
          <span>300 pts</span><span>800 pts</span>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {usuarios.map(u => (
          <div key={u.pos} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: u.soyYo ? 'rgba(176,184,193,0.1)' : 'rgba(255,255,255,0.03)',
            border: u.soyYo ? '1px solid rgba(176,184,193,0.3)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10, padding: '0.55rem 0.75rem',
          }}>
            <div style={{ width: 22, textAlign: 'center', fontSize: u.pos <= 3 ? '0.9rem' : '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, flexShrink: 0 }}>
              {u.pos === 1 ? '🥇' : u.pos === 2 ? '🥈' : u.pos === 3 ? '🥉' : `#${u.pos}`}
            </div>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(212,175,55,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>👤</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                @{u.user}
                {u.soyYo && <span style={{ marginLeft: 4, fontSize: '0.55rem', background: 'rgba(212,175,55,0.2)', color: '#d4af37', borderRadius: 20, padding: '1px 5px' }}>Vos</span>}
              </div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)' }}>{u.nivel} · {u.liga} {u.pos <= 3 ? 'Oro' : u.pos === 4 ? 'Plata' : 'Bronce'}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d4af37' }}>⭐ {u.pts}</div>
              <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)' }}>📚 {u.leidos}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AppPreview() {
  const [tab, setTab] = useState('biblioteca')

  return (
    <section style={{ paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 99,
          padding: '0.25rem 1rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#d4af37',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Vista previa
        </div>
        <h2 className="fw-bold text-white" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>La app en acción</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Todo lo que necesitás como lector, en un solo lugar.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? 'linear-gradient(135deg,#d4af37,#f1c40f)' : 'rgba(255,255,255,0.05)',
              border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '0.45rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: tab === t.key ? '#000' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Marco de laptop */}
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        {/* Barra superior del "browser" */}
        <div style={{
          background: '#1a1614',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          borderRadius: '14px 14px 0 0',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          {/* Botones semáforo */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
          </div>
          {/* URL bar */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
            librorank.vercel.app/{tab === 'biblioteca' ? 'biblioteca' : tab === 'misiones' ? 'biblioteca/paravos/misiones' : tab === 'wrapped' ? 'perfil' : 'ranking'}
          </div>
          {/* Logo */}
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d4af37', flexShrink: 0 }}>Libro<span style={{ color: '#fff' }}>Rank</span></span>
        </div>

        {/* Contenido del "browser" */}
        <div style={{
          background: '#0f0d0b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: 'none',
          borderRadius: '0 0 14px 14px',
          padding: '1.25rem',
          minHeight: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {tab === 'biblioteca' && <BibliotecaMockup />}
          {tab === 'misiones'   && <MisionesMockup />}
          {tab === 'wrapped'    && <WrappedMockup />}
          {tab === 'ranking'    && <RankingMockup />}
        </div>

        {/* "Pie" del laptop */}
        <div style={{ width: '60%', height: 10, background: '#1a1614', margin: '0 auto', borderRadius: '0 0 8px 8px', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }} />
        <div style={{ width: '75%', height: 6, background: '#151311', margin: '0 auto', borderRadius: '0 0 6px 6px' }} />
      </div>

      {/* CTA bajo el preview */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <a href="/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'linear-gradient(135deg,#d4af37,#f1c40f)',
          color: '#000', fontWeight: 800, fontSize: '0.95rem',
          padding: '0.75rem 2rem', borderRadius: 12,
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Crear mi cuenta gratis →
        </a>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
          Sin tarjeta · Sin publicidades · 100% gratis
        </p>
      </div>
    </section>
  )
}
