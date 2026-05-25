'use client'

interface Paso { icon: string; texto: string }

interface Props {
  icon: string
  titulo: string
  descripcion: string
  pasos: Paso[]
  color?: string
}

export default function BannerExplicativo({ icon, titulo, descripcion, pasos, color = '#d4af37' }: Props) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(212,175,55,0.2)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{titulo}</span>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginLeft: '0.6rem' }}>{descripcion}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {pasos.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '0.35rem 0.75rem',
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)',
          }}>
            <span>{p.icon}</span>
            <span>{p.texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
