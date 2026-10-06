'use client'

import { useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  size?: number
}

export default function StarPicker({ value, onChange, size = 30 }: Props) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onMouseLeave={() => setHover(0)}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const fill = Math.min(1, Math.max(0, display - (n - 1)))
          return (
            <span key={n} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
              {/* Background star */}
              <span style={{
                display: 'block', fontSize: size, lineHeight: 1,
                color: 'rgba(255,255,255,0.12)', userSelect: 'none', pointerEvents: 'none',
              }}>★</span>
              {/* Gold overlay */}
              {fill > 0 && (
                <span style={{
                  position: 'absolute', top: 0, left: 0,
                  display: 'block', fontSize: size, lineHeight: 1,
                  overflow: 'hidden', width: `${Math.round(fill * 100)}%`,
                  color: hover > 0 ? '#f1c40f' : '#d4af37',
                  whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
                }}>★</span>
              )}
              {/* Invisible left-half tap zone (half star) */}
              <button
                type="button"
                aria-label={`${n - 0.5} estrellas`}
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', opacity: 0, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                onMouseEnter={() => setHover(n - 0.5)}
                onClick={() => onChange(n - 0.5 === value ? 0 : n - 0.5)}
              />
              {/* Invisible right-half tap zone (full star) */}
              <button
                type="button"
                aria-label={`${n} estrellas`}
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', opacity: 0, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                onMouseEnter={() => setHover(n)}
                onClick={() => onChange(n === value ? 0 : n)}
              />
            </span>
          )
        })}
      </div>
      <span style={{
        fontSize: '0.85rem', fontWeight: 700, minWidth: 28,
        color: hover > 0 ? '#f1c40f' : value > 0 ? '#d4af37' : 'rgba(255,255,255,0.25)',
        transition: 'color 0.1s',
      }}>
        {hover > 0 ? hover : value > 0 ? value : '–'}
      </span>
    </div>
  )
}
