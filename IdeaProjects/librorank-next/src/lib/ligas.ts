export const LIGAS = [
  { key: 'bronce',   nombre: 'Bronce',   emoji: '🥉', color: '#cd7f32', colorBg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.35)',  min: 0,    max: 299   },
  { key: 'plata',    nombre: 'Plata',    emoji: '🥈', color: '#b0b8c1', colorBg: 'rgba(176,184,193,0.12)', border: 'rgba(176,184,193,0.35)', min: 300,  max: 799   },
  { key: 'oro',      nombre: 'Oro',      emoji: '🥇', color: '#d4af37', colorBg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.35)',  min: 800,  max: 1999  },
  { key: 'diamante', nombre: 'Diamante', emoji: '💎', color: '#7ecfff', colorBg: 'rgba(126,207,255,0.12)', border: 'rgba(126,207,255,0.35)', min: 2000, max: Infinity },
]

export type Liga = typeof LIGAS[number]

export function getLiga(puntos: number): Liga {
  for (let i = LIGAS.length - 1; i >= 0; i--) {
    if (puntos >= LIGAS[i].min) return LIGAS[i]
  }
  return LIGAS[0]
}
