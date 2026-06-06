'use client'

import type { PerfilStats } from '@/lib/dao/libroDAO'

interface Props {
  generos: Record<string, number>
  moods: Record<string, number>
  paginas: number
  autorMasLeido: string
  mejorCalificado: string
  stats: PerfilStats
}

const COLORES_GENERO = ['#d4af37', '#4cd137', '#5dade2', '#af7ac5', '#ff5e57', '#f39c12', '#1abc9c']
const COLORES_MOOD: Record<string, string> = {
  'Relajado': '#4a9e7a', 'Aventurero': '#e67e22', 'Emotivo': '#f39c12',
  'Intelectual': '#8e44ad', 'Nostálgico': '#c0392b', 'Inspirador': '#d4af37',
  'Oscuro': '#5dade2', 'Divertido': '#1abc9c',
}

function BarraHorizontal({ label, valor, max, color }: { label: string; valor: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{valor} libro{valor !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 99, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

export default function StatsClient({ generos, moods, paginas, autorMasLeido, mejorCalificado, stats }: Props) {
  const totalGeneros = Object.values(generos).reduce((a, b) => a + b, 0)
  const maxGenero = Math.max(...Object.values(generos), 1)
  const maxMood = Math.max(...Object.values(moods), 1)
  const pctLeidos = stats.total > 0 ? Math.round((stats.leidos / stats.total) * 100) : 0

  const estadoItems = [
    { label: 'Leídos',    valor: stats.leidos,    color: '#27ae60', icon: '✅' },
    { label: 'Leyendo',   valor: stats.leyendo,   color: '#d4af37', icon: '📖' },
    { label: 'Pendiente', valor: stats.pendientes, color: '#5dade2', icon: '🕐' },
    { label: 'En pausa',  valor: stats.pausa,     color: '#e74c3c', icon: '⏸️' },
  ]

  return (
    <div className="container py-5">
      <h1 className="font-title display-5 mb-2">📊 Mis Estadísticas</h1>
      <p className="text-muted mb-5">Un vistazo completo a tus hábitos de lectura</p>

      {/* ── Métricas principales ── */}
      <div className="row g-3 mb-5">
        {[
          { label: 'Total en biblioteca', value: stats.total,               icon: '📚', color: '#d4af37' },
          { label: 'Libros leídos',        value: stats.leidos,              icon: '✅', color: '#27ae60' },
          { label: 'Páginas leídas',       value: paginas.toLocaleString(), icon: '📄', color: '#4cd137' },
          { label: 'Leyendo ahora',        value: stats.leyendo,             icon: '📖', color: '#5dade2' },
          { label: 'Autor favorito',       value: autorMasLeido,             icon: '✍️', color: '#af7ac5' },
          { label: 'Mejor calificado',     value: mejorCalificado,           icon: '⭐', color: '#f39c12' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg-2">
            <div style={{
              background: 'var(--bg-card)',
              border: `1px solid ${s.color}30`,
              borderRadius: 14, padding: '1.1rem',
              height: '100%',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div style={{
                fontSize: typeof s.value === 'string' && s.value.length > 12 ? '0.78rem' : '1.4rem',
                fontWeight: 800, color: s.color, lineHeight: 1.2, marginBottom: '0.3rem',
                wordBreak: 'break-word',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progreso de biblioteca ── */}
      <div className="card p-4 mb-4">
        <h5 className="font-title mb-4" style={{ color: 'var(--accent-gold)' }}>📈 Progreso de biblioteca</h5>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {estadoItems.map(e => (
            <div key={e.label} style={{
              flex: 1, minWidth: 100,
              background: `${e.color}12`,
              border: `1px solid ${e.color}30`,
              borderRadius: 12, padding: '0.9rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{e.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: e.color }}>{e.valor}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{e.label}</div>
            </div>
          ))}
        </div>
        {/* Barra de completado */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>% de biblioteca leída</span>
            <span style={{ color: '#27ae60', fontWeight: 700 }}>{pctLeidos}%</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pctLeidos}%`,
              background: 'linear-gradient(90deg,#27ae60,#2ecc71)',
              borderRadius: 99, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Géneros ── */}
        <div className="col-md-6">
          <div className="card p-4 h-100">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>🎭 Por género</h5>
              {totalGeneros > 0 && (
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{totalGeneros} libros</span>
              )}
            </div>
            {Object.keys(generos).length === 0 ? (
              <p className="text-muted small">Aún no hay datos. Agregá géneros a tus libros.</p>
            ) : (
              <>
                {Object.entries(generos)
                  .sort((a, b) => b[1] - a[1])
                  .map(([g, total], i) => (
                    <BarraHorizontal key={g} label={g} valor={total} max={maxGenero} color={COLORES_GENERO[i % COLORES_GENERO.length]} />
                  ))}
              </>
            )}
          </div>
        </div>

        {/* ── Moods ── */}
        <div className="col-md-6">
          <div className="card p-4 h-100">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h5 className="font-title mb-0" style={{ color: 'var(--accent-gold)' }}>🎨 Por mood</h5>
            </div>
            {Object.keys(moods).length === 0 ? (
              <p className="text-muted small">Aún no hay datos. Asigná moods a tus libros.</p>
            ) : (
              <>
                {Object.entries(moods)
                  .sort((a, b) => b[1] - a[1])
                  .map(([m, total]) => (
                    <BarraHorizontal key={m} label={m} valor={total} max={maxMood} color={COLORES_MOOD[m] ?? '#d4af37'} />
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
