// Funciones puras de niveles — sin imports de DB, se puede usar en cliente y servidor

export interface NivelInfo {
  nivel: number
  titulo: string
  emoji: string
  puntosMin: number
  puntosMax: number
  progreso: number // 0-100
}

const NIVELES = [
  { nivel: 1,  titulo: 'Curioso sin Libro',        emoji: '📖', min: 0    },
  { nivel: 2,  titulo: 'Nuevo Lector',              emoji: '🌱', min: 50   },
  { nivel: 3,  titulo: 'Aprendiz de las Letras',    emoji: '✏️', min: 150  },
  { nivel: 4,  titulo: 'Lector Comprometido',       emoji: '📚', min: 300  },
  { nivel: 5,  titulo: 'Aventurero de Páginas',     emoji: '🗺️', min: 500  },
  { nivel: 6,  titulo: 'Explorador Literario',      emoji: '🔭', min: 800  },
  { nivel: 7,  titulo: 'Devorador de Historias',    emoji: '🐉', min: 1200 },
  { nivel: 8,  titulo: 'Maestro Lector',            emoji: '🏅', min: 1800 },
  { nivel: 9,  titulo: 'Erudito',                   emoji: '🎓', min: 2600 },
  { nivel: 10, titulo: 'Guardián del Conocimiento', emoji: '🏰', min: 3500 },
  { nivel: 11, titulo: 'Sabio de los Libros',       emoji: '🌟', min: 5000 },
  { nivel: 12, titulo: 'Oráculo Eterno',            emoji: '👑', min: 7000 },
]

export function getNivelLector(puntos: number): NivelInfo {
  let actual = NIVELES[0]
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (puntos >= NIVELES[i].min) { actual = NIVELES[i]; break }
  }
  const siguienteMin = NIVELES[actual.nivel]?.min ?? actual.min
  const progreso = actual.nivel >= NIVELES.length
    ? 100
    : Math.min(100, Math.round(((puntos - actual.min) / (siguienteMin - actual.min)) * 100))
  return {
    nivel: actual.nivel,
    titulo: actual.titulo,
    emoji: actual.emoji,
    puntosMin: actual.min,
    puntosMax: siguienteMin,
    progreso,
  }
}
