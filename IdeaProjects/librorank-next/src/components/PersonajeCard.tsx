'use client'

import type { Personaje } from '@/lib/personaje'

interface Props {
  personaje: Personaje
  username: string
}

function BarraAtributo({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{valor}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
        <div style={{
          width: `${valor}%`,
          height: '100%',
          background: color,
          borderRadius: 99,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

export default function PersonajeCard({ personaje, username }: Props) {
  const { clase, emoji, nivel, atributos, descripcion, colorPrincipal } = personaje

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${colorPrincipal}40`,
      borderRadius: 20,
      overflow: 'hidden',
      maxWidth: 480,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colorPrincipal}18, ${colorPrincipal}08)`,
        borderBottom: `1px solid ${colorPrincipal}30`,
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: `${colorPrincipal}20`,
          border: `2px solid ${colorPrincipal}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: `${colorPrincipal}cc`, marginBottom: 2 }}>
            {clase}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            @{username}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${colorPrincipal}25`,
            border: `1px solid ${colorPrincipal}50`,
            borderRadius: 20,
            padding: '2px 10px',
            marginTop: 4,
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colorPrincipal }}>
              Nivel {nivel}
            </span>
          </div>
        </div>
      </div>

      {/* Atributos */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <BarraAtributo label="📖 Sabiduría"   valor={atributos.sabiduria}  color="#9b59b6" />
        <BarraAtributo label="✍️ Elocuencia"  valor={atributos.elocuencia} color="#3498db" />
        <BarraAtributo label="🔥 Constancia"  valor={atributos.constancia} color="#e74c3c" />
        <BarraAtributo label="🌍 Amplitud"    valor={atributos.amplitud}   color="#27ae60" />
      </div>

      {/* Descripción */}
      <div style={{
        borderTop: `1px solid rgba(255,255,255,0.06)`,
        padding: '0.85rem 1.25rem',
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
      }}>
        "{descripcion}"
      </div>
    </div>
  )
}
