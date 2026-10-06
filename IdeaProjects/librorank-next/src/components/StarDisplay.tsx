interface Props {
  value: number
  size?: number
  showEmpty?: boolean
}

function StarUnit({ fill, size }: { fill: number; size: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontSize: size, lineHeight: 1 }}>
      <span style={{ color: 'rgba(255,255,255,0.12)', userSelect: 'none', pointerEvents: 'none' }}>★</span>
      {fill > 0 && (
        <span style={{
          position: 'absolute', top: 0, left: 0,
          overflow: 'hidden',
          width: `${Math.round(fill * 100)}%`,
          color: '#d4af37',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>★</span>
      )}
    </span>
  )
}

export default function StarDisplay({ value, size = 14, showEmpty = true }: Props) {
  const v = Math.max(0, Math.min(5, value || 0))
  if (v <= 0 && !showEmpty) return null
  return (
    <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center', lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <StarUnit key={n} fill={Math.min(1, Math.max(0, v - (n - 1)))} size={size} />
      ))}
    </span>
  )
}
