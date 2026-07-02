import overridesData from '@/data/cartas-overrides.json'

export type Rareza = 'comun' | 'raro' | 'epico' | 'legendario' | 'mitico'

export interface Carta {
  id: string
  nombre: string
  epiteto: string
  concepto: string
  obra: string
  autor: string
  origen: string
  rareza: Rareza
  imagen: string
  color: string
  simbolo: string
  cita: string
  anio: number
  posicionX: number
  posicionY: number
  fondo?: string
  fullArt?: boolean
}

interface CartaOverride {
  imagen?: string
  posicionX?: number
  posicionY?: number
  fondo?: string
}

export const RAREZAS: Record<Rareza, { label: string; letra: string; color: string; peso: number; glow: boolean }> = {
  comun:      { label: 'Común',      letra: 'C', color: '#7d8a6e', peso: 550, glow: false },
  raro:       { label: 'Raro',       letra: 'R', color: '#3d6b94', peso: 280, glow: false },
  epico:      { label: 'Épico',      letra: 'É', color: '#6b3d8e', peso: 130, glow: true  },
  legendario: { label: 'Legendario', letra: 'L', color: '#a8821f', peso: 35,  glow: true  },
  mitico:     { label: 'Mítico',     letra: 'M', color: '#b0481f', peso: 5,   glow: true  },
}

// Special:FilePath redirige al archivo real en Wikimedia Commons
const fp = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`

// Overrides editados desde /admin/cartas (imagen propia + posición de recorte)
const overrides = overridesData as Record<string, CartaOverride>

type CartaBase = Omit<Carta, 'posicionX' | 'posicionY'>

const CARTAS_BASE: CartaBase[] = [
  // COMÚN (10)
  {
    id: 'don-quijote', nombre: 'Don Quijote', epiteto: 'El Ingenioso Hidalgo', concepto: 'Hidalguía',
    obra: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', origen: 'España',
    rareza: 'comun', anio: 1605, color: '#c47c2e',
    imagen: fp('Gustav Dore - Don Quixote.jpg'),
    simbolo: 'La lanza y los molinos de viento',
    cita: '«Ladran, Sancho, señal de que cabalgamos»',
  },
  {
    id: 'sancho-panza', nombre: 'Sancho Panza', epiteto: 'El Fiel Escudero', concepto: 'Lealtad',
    obra: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', origen: 'España',
    rareza: 'comun', anio: 1605, color: '#7a9e3e',
    imagen: fp('Don Quixote 1.jpg'),
    simbolo: 'El asno y los refranes populares',
    cita: '«Más vale buena esperanza que ruin posesión»',
  },
  {
    id: 'robinson-crusoe', nombre: 'Robinson Crusoe', epiteto: 'El Náufrago', concepto: 'Supervivencia',
    obra: 'Robinson Crusoe', autor: 'Daniel Defoe', origen: 'Inglaterra',
    rareza: 'comun', anio: 1719, color: '#2e7d5e',
    imagen: fp('Robinson Crusoe Wyeth 1920.jpg'),
    simbolo: 'La isla desierta y la huella en la arena',
    cita: '«El miedo al peligro es más terrible que el peligro mismo»',
  },
  {
    id: 'emma-bovary', nombre: 'Emma Bovary', epiteto: 'La Soñadora', concepto: 'Pasión',
    obra: 'Madame Bovary', autor: 'Gustave Flaubert', origen: 'Francia',
    rareza: 'comun', anio: 1857, color: '#c2566b',
    imagen: fp('Albert Lynch - Madame Bovary (1933).jpg'),
    simbolo: 'El romanticismo y la insatisfacción',
    cita: '«Madame Bovary soy yo» — Flaubert',
  },
  {
    id: 'heathcliff', nombre: 'Heathcliff', epiteto: 'El Alma Tormentosa', concepto: 'Tormento',
    obra: 'Cumbres Borrascosas', autor: 'Emily Brontë', origen: 'Inglaterra',
    rareza: 'comun', anio: 1847, color: '#4a4a6a',
    imagen: fp('Heathcliff and Cathy.jpg'),
    simbolo: 'Los páramos y el amor destructivo',
    cita: '«No puedo vivir sin mi vida, sin mi alma»',
  },
  {
    id: 'quasimodo', nombre: 'Quasimodo', epiteto: 'El Campanero', concepto: 'Compasión',
    obra: 'Nuestra Señora de París', autor: 'Victor Hugo', origen: 'Francia',
    rareza: 'comun', anio: 1831, color: '#6b4f3e',
    imagen: fp('Luc-Olivier Merson - Quasimodo.jpg'),
    simbolo: 'Las campanas de Notre-Dame',
    cita: '«¡Asilo! ¡Asilo!»',
  },
  {
    id: 'raskolnikov', nombre: 'Raskólnikov', epiteto: 'El Estudiante', concepto: 'Tormento',
    obra: 'Crimen y Castigo', autor: 'Fiódor Dostoyevski', origen: 'Rusia',
    rareza: 'comun', anio: 1866, color: '#8b2e2e',
    imagen: fp('Raskolnikov.jpg'),
    simbolo: 'La culpa y la redención',
    cita: '«¿Soy una criatura temblorosa, o tengo derecho?»',
  },
  {
    id: 'jean-valjean', nombre: 'Jean Valjean', epiteto: 'El Redimido', concepto: 'Redención',
    obra: 'Los Miserables', autor: 'Victor Hugo', origen: 'Francia',
    rareza: 'comun', anio: 1862, color: '#1a4a7a',
    imagen: fp('Jean Valjean and Cosette - Emile Bayard - from Victor Hugo Les Miserables 1862.jpg'),
    simbolo: 'Los candelabros de plata',
    cita: '«Amar a otra persona es ver el rostro de Dios»',
  },
  {
    id: 'dorian-gray', nombre: 'Dorian Gray', epiteto: 'El Eterno Joven', concepto: 'Vanidad',
    obra: 'El Retrato de Dorian Gray', autor: 'Oscar Wilde', origen: 'Irlanda',
    rareza: 'comun', anio: 1890, color: '#7a4a9a',
    imagen: fp('Dorian Gray Frontispiece.jpg'),
    simbolo: 'El retrato que envejece por él',
    cita: '«La única forma de librarse de la tentación es ceder a ella»',
  },
  {
    id: 'don-juan', nombre: 'Don Juan', epiteto: 'El Seductor', concepto: 'Desafío',
    obra: 'Don Juan Tenorio', autor: 'José Zorrilla', origen: 'España',
    rareza: 'comun', anio: 1844, color: '#a03030',
    imagen: fp('Don juan - Gustave Wertheimer.jpg'),
    simbolo: 'La capa y la espada del libertino',
    cita: '«Llamé al cielo y no me oyó»',
  },

  // RARO (5)
  {
    id: 'hamlet', nombre: 'Hamlet', epiteto: 'El Príncipe Indeciso', concepto: 'Duda',
    obra: 'Hamlet', autor: 'William Shakespeare', origen: 'Dinamarca',
    rareza: 'raro', anio: 1603, color: '#4a7aaa',
    imagen: fp('Eugène Delacroix, Hamlet and Horatio in the Graveyard.JPG'),
    simbolo: 'La calavera de Yorick',
    cita: '«Ser o no ser, esa es la cuestión»',
  },
  {
    id: 'sherlock-holmes', nombre: 'Sherlock Holmes', epiteto: 'El Detective', concepto: 'Lógica',
    obra: 'Estudio en Escarlata', autor: 'Arthur Conan Doyle', origen: 'Inglaterra',
    rareza: 'raro', anio: 1887, color: '#c9a227',
    imagen: fp('Sherlock Holmes Portrait Paget.jpg'),
    simbolo: 'La lupa y la pipa',
    cita: '«Elimina lo imposible; lo que quede es la verdad»',
  },
  {
    id: 'cyrano', nombre: 'Cyrano de Bergerac', epiteto: 'El Poeta Espadachín', concepto: 'Honor',
    obra: 'Cyrano de Bergerac', autor: 'Edmond Rostand', origen: 'Francia',
    rareza: 'raro', anio: 1897, color: '#3a8a4a',
    imagen: fp('Cyrano de Bergerac - Constant Coquelin.jpg'),
    simbolo: 'La pluma y el florete',
    cita: '«Es mucho más hermoso cuando es inútil»',
  },
  {
    id: 'anna-karenina', nombre: 'Anna Karénina', epiteto: 'La Aristócrata', concepto: 'Pasión',
    obra: 'Anna Karénina', autor: 'Lev Tolstói', origen: 'Rusia',
    rareza: 'raro', anio: 1878, color: '#c03050',
    imagen: fp('Kramskoy Portrait of a Woman.jpg'),
    simbolo: 'El tren y la nieve',
    cita: '«Todas las familias felices se parecen entre sí»',
  },
  {
    id: 'edmond-dantes', nombre: 'Edmond Dantès', epiteto: 'El Vengador', concepto: 'Venganza',
    obra: 'El Conde de Montecristo', autor: 'Alexandre Dumas', origen: 'Francia',
    rareza: 'raro', anio: 1844, color: '#8a7020',
    imagen: fp('Edmond Dantes.jpg'),
    simbolo: 'El tesoro de la isla de Montecristo',
    cita: '«¡El mundo es mío!»',
  },

  // ÉPICO (3)
  {
    id: 'dracula', nombre: 'Conde Drácula', epiteto: 'El Inmortal', concepto: 'Hambre eterna',
    obra: 'Drácula', autor: 'Bram Stoker', origen: 'Transilvania',
    rareza: 'epico', anio: 1897, color: '#8b0000',
    imagen: fp("Illustration of Bram Stoker's Dracula.jpg"),
    simbolo: 'El castillo y la capa negra',
    cita: '«Escucha — son los hijos de la noche»',
  },
  {
    id: 'frankenstein', nombre: 'La Criatura', epiteto: 'El Rechazado', concepto: 'Soledad',
    obra: 'Frankenstein', autor: 'Mary Shelley', origen: 'Suiza',
    rareza: 'epico', anio: 1818, color: '#2e7a2e',
    imagen: fp('Frontispiece to Frankenstein 1831.jpg'),
    simbolo: 'El rayo que le dio vida',
    cita: '«¿Por qué viví? ¿Por qué no morí entonces?»',
  },
  {
    id: 'capitan-ahab', nombre: 'Capitán Ahab', epiteto: 'El Obsesionado', concepto: 'Venganza',
    obra: 'Moby Dick', autor: 'Herman Melville', origen: 'Estados Unidos',
    rareza: 'epico', anio: 1851, color: '#1a3a5a',
    imagen: fp('Moby Dick p510 illustration.jpg'),
    simbolo: 'La pierna de marfil y el arpón',
    cita: '«Hasta el último aliento lucharé contigo»',
  },

  // LEGENDARIO (1)
  {
    id: 'fausto', nombre: 'Fausto', epiteto: 'El Sabio Condenado', concepto: 'Conocimiento',
    obra: 'Fausto', autor: 'Johann Wolfgang von Goethe', origen: 'Alemania',
    rareza: 'legendario', anio: 1808, color: '#d4af37',
    imagen: fp('Faust und Mephisto.jpg'),
    simbolo: 'El pacto firmado con sangre',
    cita: '«Detente, eres tan hermoso»',
    fullArt: true,
  },

  // MÍTICO (1)
  {
    id: 'shakespeare', nombre: 'William Shakespeare', epiteto: 'El Bardo de Avon', concepto: 'Creación',
    obra: 'Toda su obra', autor: 'La Historia', origen: 'Inglaterra',
    rareza: 'mitico', anio: 1564, color: '#ff6b35',
    imagen: fp('Shakespeare.jpg'),
    simbolo: 'La pluma que creó mil almas',
    cita: '«Todo el mundo es un escenario»',
    fullArt: true,
  },
]

export const CARTAS: Carta[] = CARTAS_BASE.map(c => {
  const o = overrides[c.id]
  return {
    ...c,
    imagen: o?.imagen ?? c.imagen,
    posicionX: o?.posicionX ?? 50,
    posicionY: o?.posicionY ?? 20,
    fondo: o?.fondo,
    fullArt: c.fullArt,
  }
})

// Peso individual por carta = peso_rareza / cantidad_cartas_de_esa_rareza
// Así una carta Rara es individualmente más difícil que una Común
function getPesoIndividual(carta: Carta): number {
  const cantidadEnRareza = CARTAS.filter(c => c.rareza === carta.rareza).length
  return RAREZAS[carta.rareza].peso / cantidadEnRareza
}

export function tirarCarta(): Carta {
  const cartasConPeso = CARTAS.map(c => ({ carta: c, peso: getPesoIndividual(c) }))
  const total = cartasConPeso.reduce((sum, c) => sum + c.peso, 0)
  let rand = Math.random() * total

  for (const { carta, peso } of cartasConPeso) {
    rand -= peso
    if (rand <= 0) return carta
  }

  return CARTAS[0]
}

// Probabilidad individual de cada carta (para mostrar en UI)
export function getProbabilidadCarta(carta: Carta): number {
  const cartasConPeso = CARTAS.map(c => ({ carta: c, peso: getPesoIndividual(c) }))
  const total = cartasConPeso.reduce((sum, c) => sum + c.peso, 0)
  return (getPesoIndividual(carta) / total) * 100
}
