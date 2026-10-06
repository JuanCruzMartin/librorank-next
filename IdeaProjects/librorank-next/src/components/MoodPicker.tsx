'use client'

export const MOOD_TAGS = [
  'Relajado', 'Aventurero', 'Emotivo', 'Intelectual',
  'Nostálgico', 'Inspirador', 'Oscuro', 'Divertido',
  'Romántico', 'Trepidante', 'Filosófico', 'Perturbador',
]

interface Props {
  value: string       // comma-separated, e.g. "Oscuro,Romántico"
  onChange: (v: string) => void
  max?: number
}

export default function MoodPicker({ value, onChange, max = 2 }: Props) {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag).join(','))
    } else if (selected.length < max) {
      onChange([...selected, tag].join(','))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {MOOD_TAGS.map(tag => {
          const active = selected.includes(tag)
          const maxed = !active && selected.length >= max
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              disabled={maxed}
              style={{
                padding: '4px 11px',
                borderRadius: 99,
                border: `1px solid ${active ? '#d4af37' : 'rgba(255,255,255,0.15)'}`,
                background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: active ? '#d4af37' : maxed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                fontSize: '0.73rem',
                fontWeight: active ? 700 : 400,
                cursor: maxed ? 'default' : 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>
      {selected.length >= max && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
          Máximo {max} vibes
        </div>
      )}
    </div>
  )
}
