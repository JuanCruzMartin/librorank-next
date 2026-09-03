export interface LigaArena {
  key: string
  nombre: string
  emoji: string
  color: string
  colorBg: string
  border: string
  puntosMeta: number | null // null = Master (acumula sin tope)
  orden: number
}

export const LIGAS_ARENA: LigaArena[] = [
  {
    key: 'bronce', nombre: 'Bronce', emoji: '🥉',
    color: '#cd7f32', colorBg: 'rgba(205,127,50,0.15)', border: 'rgba(205,127,50,0.4)',
    puntosMeta: 100, orden: 0,
  },
  {
    key: 'plata', nombre: 'Plata', emoji: '🥈',
    color: '#b0b8c1', colorBg: 'rgba(176,184,193,0.15)', border: 'rgba(176,184,193,0.4)',
    puntosMeta: 100, orden: 1,
  },
  {
    key: 'oro', nombre: 'Oro', emoji: '🥇',
    color: '#d4af37', colorBg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)',
    puntosMeta: 100, orden: 2,
  },
  {
    key: 'diamante', nombre: 'Diamante', emoji: '💎',
    color: '#7ecfff', colorBg: 'rgba(126,207,255,0.15)', border: 'rgba(126,207,255,0.4)',
    puntosMeta: 100, orden: 3,
  },
  {
    key: 'master', nombre: 'Master', emoji: '👑',
    color: '#ff6b35', colorBg: 'rgba(255,107,53,0.15)', border: 'rgba(255,107,53,0.4)',
    puntosMeta: null, orden: 4,
  },
]

export function getLigaArena(key: string): LigaArena {
  return LIGAS_ARENA.find(l => l.key === key) ?? LIGAS_ARENA[0]
}

export function getLigaArenaSiguiente(key: string): LigaArena | null {
  const idx = LIGAS_ARENA.findIndex(l => l.key === key)
  return LIGAS_ARENA[idx + 1] ?? null
}
