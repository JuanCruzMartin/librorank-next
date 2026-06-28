export type Rareza = 'comun' | 'raro' | 'epico' | 'legendario' | 'mitico'

export interface Carta {
  id: string
  nombre: string
  obra: string
  autor: string
  rareza: Rareza
  imagen: string
  color: string
  descripcion: string
  anio: number
}

export const RAREZAS: Record<Rareza, { label: string; color: string; peso: number; glow: boolean }> = {
  comun:      { label: 'Común',      color: '#9ea3a8', peso: 550, glow: false },
  raro:       { label: 'Raro',       color: '#4a90d9', peso: 280, glow: false },
  epico:      { label: 'Épico',      color: '#9b59b6', peso: 130, glow: true  },
  legendario: { label: 'Legendario', color: '#d4af37', peso: 35,  glow: true  },
  mitico:     { label: 'Mítico',     color: '#ff6b35', peso: 5,   glow: true  },
}

// Special:FilePath redirige al archivo real en Wikimedia Commons
const fp = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`

export const CARTAS: Carta[] = [
  // COMÚN (10)
  {
    id: 'don-quijote', nombre: 'Don Quijote', obra: 'Don Quijote de la Mancha',
    autor: 'Miguel de Cervantes', rareza: 'comun', anio: 1605, color: '#c47c2e',
    imagen: fp('Gustav Dore - Don Quixote.jpg'),
    descripcion: 'El caballero andante de La Mancha, eterno soñador de imposibles.',
  },
  {
    id: 'sancho-panza', nombre: 'Sancho Panza', obra: 'Don Quijote de la Mancha',
    autor: 'Miguel de Cervantes', rareza: 'comun', anio: 1605, color: '#7a9e3e',
    imagen: fp('Don Quixote 1.jpg'),
    descripcion: 'El fiel escudero, pragmático y leal hasta el final.',
  },
  {
    id: 'robinson-crusoe', nombre: 'Robinson Crusoe', obra: 'Robinson Crusoe',
    autor: 'Daniel Defoe', rareza: 'comun', anio: 1719, color: '#2e7d5e',
    imagen: fp('Robinson Crusoe Wyeth 1920.jpg'),
    descripcion: 'El náufrago que construyó su propio mundo en una isla desierta.',
  },
  {
    id: 'emma-bovary', nombre: 'Emma Bovary', obra: 'Madame Bovary',
    autor: 'Gustave Flaubert', rareza: 'comun', anio: 1857, color: '#c2566b',
    imagen: fp('Albert Lynch - Madame Bovary (1933).jpg'),
    descripcion: 'Romántica atrapada en una vida que no era la que soñaba.',
  },
  {
    id: 'heathcliff', nombre: 'Heathcliff', obra: 'Cumbres Borrascosas',
    autor: 'Emily Brontë', rareza: 'comun', anio: 1847, color: '#4a4a6a',
    imagen: fp('Heathcliff and Cathy.jpg'),
    descripcion: 'El oscuro huérfano consumido por el amor y la venganza.',
  },
  {
    id: 'quasimodo', nombre: 'Quasimodo', obra: 'Nuestra Señora de París',
    autor: 'Victor Hugo', rareza: 'comun', anio: 1831, color: '#6b4f3e',
    imagen: fp('Luc-Olivier Merson - Quasimodo.jpg'),
    descripcion: 'El jorobado de Notre Dame, feo por fuera y puro por dentro.',
  },
  {
    id: 'raskolnikov', nombre: 'Raskolnikov', obra: 'Crimen y Castigo',
    autor: 'Fiódor Dostoievski', rareza: 'comun', anio: 1866, color: '#8b2e2e',
    imagen: fp('Raskolnikov.jpg'),
    descripcion: 'El estudiante que cruzó la línea entre el crimen y la redención.',
  },
  {
    id: 'jean-valjean', nombre: 'Jean Valjean', obra: 'Los Miserables',
    autor: 'Victor Hugo', rareza: 'comun', anio: 1862, color: '#1a4a7a',
    imagen: fp('Jean Valjean and Cosette - Emile Bayard - from Victor Hugo Les Miserables 1862.jpg'),
    descripcion: 'El ex convicto que eligió la bondad sobre la amargura.',
  },
  {
    id: 'dorian-gray', nombre: 'Dorian Gray', obra: 'El Retrato de Dorian Gray',
    autor: 'Oscar Wilde', rareza: 'comun', anio: 1890, color: '#7a4a9a',
    imagen: fp('Dorian Gray Frontispiece.jpg'),
    descripcion: 'El hombre que vendió su alma a cambio de la eterna juventud.',
  },
  {
    id: 'don-juan', nombre: 'Don Juan', obra: 'Don Juan Tenorio',
    autor: 'José Zorrilla', rareza: 'comun', anio: 1844, color: '#a03030',
    imagen: fp('Don juan - Gustave Wertheimer.jpg'),
    descripcion: 'El seductor insaciable que desafió al infierno y al cielo.',
  },

  // RARO (5)
  {
    id: 'hamlet', nombre: 'Hamlet', obra: 'Hamlet',
    autor: 'William Shakespeare', rareza: 'raro', anio: 1603, color: '#4a7aaa',
    imagen: fp('Eugène Delacroix, Hamlet and Horatio in the Graveyard.JPG'),
    descripcion: 'El príncipe danés, atrapado entre la duda y el deber.',
  },
  {
    id: 'sherlock-holmes', nombre: 'Sherlock Holmes', obra: 'Estudio en Escarlata',
    autor: 'Arthur Conan Doyle', rareza: 'raro', anio: 1887, color: '#c9a227',
    imagen: fp('Sherlock Holmes Portrait Paget.jpg'),
    descripcion: 'El detective más brillante de Baker Street. Lógica sin igual.',
  },
  {
    id: 'cyrano', nombre: 'Cyrano de Bergerac', obra: 'Cyrano de Bergerac',
    autor: 'Edmond Rostand', rareza: 'raro', anio: 1897, color: '#3a8a4a',
    imagen: fp('Cyrano de Bergerac - Constant Coquelin.jpg'),
    descripcion: 'El hombre de nariz grande y corazón más grande aún.',
  },
  {
    id: 'anna-karenina', nombre: 'Anna Karenina', obra: 'Anna Karenina',
    autor: 'Lev Tolstói', rareza: 'raro', anio: 1878, color: '#c03050',
    imagen: fp('Kramskoy Portrait of a Woman.jpg'),
    descripcion: 'La mujer que sacrificó todo por amor en la Rusia imperial.',
  },
  {
    id: 'edmond-dantes', nombre: 'Edmond Dantès', obra: 'El Conde de Montecristo',
    autor: 'Alexandre Dumas', rareza: 'raro', anio: 1844, color: '#8a7020',
    imagen: fp('Edmond Dantes.jpg'),
    descripcion: 'El marinero que la traición convirtió en el Conde de Montecristo.',
  },

  // ÉPICO (3)
  {
    id: 'dracula', nombre: 'Drácula', obra: 'Drácula',
    autor: 'Bram Stoker', rareza: 'epico', anio: 1897, color: '#8b0000',
    imagen: fp("Illustration of Bram Stoker's Dracula.jpg"),
    descripcion: 'El señor de las tinieblas, inmortal y hambriento de sangre.',
  },
  {
    id: 'frankenstein', nombre: 'La Criatura', obra: 'Frankenstein',
    autor: 'Mary Shelley', rareza: 'epico', anio: 1818, color: '#2e7a2e',
    imagen: fp('Frontispiece to Frankenstein 1831.jpg'),
    descripcion: 'La creación que superó a su creador, buscando amor y pertenencia.',
  },
  {
    id: 'capitan-ahab', nombre: 'Capitán Ahab', obra: 'Moby Dick',
    autor: 'Herman Melville', rareza: 'epico', anio: 1851, color: '#1a3a5a',
    imagen: fp('Moby Dick p510 illustration.jpg'),
    descripcion: 'El capitán obsesionado con la ballena blanca que le robó la pierna.',
  },

  // LEGENDARIO (1)
  {
    id: 'fausto', nombre: 'Fausto', obra: 'Fausto',
    autor: 'Johann Wolfgang von Goethe', rareza: 'legendario', anio: 1808, color: '#d4af37',
    imagen: fp('Faust und Mephisto.jpg'),
    descripcion: 'El sabio que vendió su alma al diablo en busca del conocimiento absoluto.',
  },

  // MÍTICO (1)
  {
    id: 'shakespeare', nombre: 'William Shakespeare', obra: 'El Bardo de Avon',
    autor: 'La Historia', rareza: 'mitico', anio: 1564, color: '#ff6b35',
    imagen: fp('Shakespeare.jpg'),
    descripcion: 'No es un personaje — es el creador de personajes. La carta más rara de la colección.',
  },
]

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
