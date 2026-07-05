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
  dorso?: string
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

  // ── HARRY POTTER ─────────────────────────────────────────────────────────

  // COMÚN HP (7)
  {
    id: 'ron-weasley', nombre: 'Ron Weasley', epiteto: 'El Leal Amigo', concepto: 'Lealtad',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#c8102e',
    imagen: fp('Ron Weasley.jpg'),
    simbolo: 'Las piezas de ajedrez y la rata Scabbers',
    cita: '«¿Qué es el amor sin un amigo que te acompañe?»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'ginny-weasley', nombre: 'Ginny Weasley', epiteto: 'La Chaser', concepto: 'Valentía',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#c8102e',
    imagen: fp('Ginny Weasley.jpg'),
    simbolo: 'El Bludger y el sortilegio Reducto',
    cita: '«No soy cualquier chica de La Madriguera»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'neville-longbottom', nombre: 'Neville Longbottom', epiteto: 'El Inesperado Héroe', concepto: 'Coraje',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#7a5c2e',
    imagen: fp('Neville Longbottom.jpg'),
    simbolo: 'La espada de Gryffindor y la Mandrágora',
    cita: '«Se necesita mucho valor para enfrentarse a tus enemigos, pero igual de importante es enfrentarse a tus amigos»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'cho-chang', nombre: 'Cho Chang', epiteto: 'La Seeker', concepto: 'Gracia',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#1a3a5a',
    imagen: fp('Cho Chang.jpg'),
    simbolo: 'La escoba de quidditch de Ravenclaw',
    cita: '«Ravenclaw no es solo inteligencia, es sabiduría»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'cedric-diggory', nombre: 'Cedric Diggory', epiteto: 'El Campeón', concepto: 'Honor',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#c8a000',
    imagen: fp('Cedric Diggory.jpg'),
    simbolo: 'La copa del Torneo de los Tres Magos',
    cita: '«Sé leal a lo que verdaderamente importa»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'fred-george', nombre: 'Fred y George Weasley', epiteto: 'Los Gemelos', concepto: 'Humor',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#c8102e',
    imagen: fp('Fred George Weasley.jpg'),
    simbolo: 'Los fuegos de artificio y el Pasatiempos Weasley',
    cita: '«La vida es demasiado corta para ser aburrida»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'luna-lovegood', nombre: 'Luna Lovegood', epiteto: 'La Vidente', concepto: 'Originalidad',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'comun', anio: 1997, color: '#87ceeb',
    imagen: fp('Luna Lovegood.jpg'),
    simbolo: 'Los lentes de Percepto y el Quibbler',
    cita: '«Los que te quieren de verdad nunca te dejan del todo»',
    dorso: '/dorso-hp.png',
  },

  // RARO HP (7)
  {
    id: 'hermione-granger', nombre: 'Hermione Granger', epiteto: 'La Bruja Más Lista', concepto: 'Inteligencia',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#c8102e',
    imagen: fp('Hermione Granger.jpg'),
    simbolo: 'El giratiempo y la varita de vid',
    cita: '«Soy una bruja, no una bruja mala»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'draco-malfoy', nombre: 'Draco Malfoy', epiteto: 'El Príncipe de Slytherin', concepto: 'Ambición',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#1a6b3c',
    imagen: fp('Draco Malfoy.jpg'),
    simbolo: 'La Marca Tenebrosa y el Gabinete Vanishing',
    cita: '«No deberías haber venido esta noche»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'rubeus-hagrid', nombre: 'Rubeus Hagrid', epiteto: 'El Guardabosques', concepto: 'Bondad',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#6b4f3e',
    imagen: fp('Rubeus Hagrid.jpg'),
    simbolo: 'La paraguas rosa y Norberto el dragón',
    cita: '«Lo que está hecho, está hecho»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'sirius-black', nombre: 'Sirius Black', epiteto: 'El Animago Fugitivo', concepto: 'Sacrificio',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#4a4a6a',
    imagen: fp('Sirius Black.jpg'),
    simbolo: 'La moto voladora y el perro negro',
    cita: '«El que no tiene nada que perder es el más peligroso»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'severus-snape', nombre: 'Severus Snape', epiteto: 'El Príncipe Mestizo', concepto: 'Redención',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#2d2d2d',
    imagen: fp('Severus Snape.jpg'),
    simbolo: 'La doe patronus y el libro anotado',
    cita: '«Siempre»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'bellatrix-lestrange', nombre: 'Bellatrix Lestrange', epiteto: 'La Fiel Seguidora', concepto: 'Fanatismo',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#8b0000',
    imagen: fp('Bellatrix Lestrange.jpg'),
    simbolo: 'La varita de saúco robada y Azkaban',
    cita: '«La muerte no es nada comparada con la deslealtad»',
    dorso: '/dorso-hp.png',
  },
  {
    id: 'dobby', nombre: 'Dobby', epiteto: 'El Elfo Libre', concepto: 'Libertad',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'raro', anio: 1997, color: '#3d6b94',
    imagen: fp('Dobby.jpg'),
    simbolo: 'El calcetín de la libertad',
    cita: '«Dobby es libre»',
    dorso: '/dorso-hp.png',
  },

  // LEGENDARIO HP (3) — full-art
  {
    id: 'harry-potter', nombre: 'Harry Potter', epiteto: 'El Niño Que Sobrevivió', concepto: 'Destino',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'legendario', anio: 1997, color: '#c8102e',
    imagen: fp('Harry Potter.jpg'),
    simbolo: 'La cicatriz en forma de rayo y la varita de acebo',
    cita: '«No soy nada especial, en realidad»',
    fullArt: true,
    dorso: '/dorso-hp.png',
  },
  {
    id: 'albus-dumbledore', nombre: 'Albus Dumbledore', epiteto: 'El Gran Mago', concepto: 'Sabiduría',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'legendario', anio: 1997, color: '#6b3d8e',
    imagen: fp('Albus Dumbledore.jpg'),
    simbolo: 'La varita de saúco y el Fénix Fawkes',
    cita: '«La felicidad se puede encontrar hasta en los momentos más oscuros, si uno recuerda encender la luz»',
    fullArt: true,
    dorso: '/dorso-hp.png',
  },
  {
    id: 'lord-voldemort', nombre: 'Lord Voldemort', epiteto: 'El Que No Debe Ser Nombrado', concepto: 'Poder',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'legendario', anio: 1997, color: '#2d5a27',
    imagen: fp('Lord Voldemort.jpg'),
    simbolo: 'Los Horrocruxes y la varita de tejo',
    cita: '«No hay bien ni mal, solo poder y los demasiado débiles para buscarlo»',
    fullArt: true,
    dorso: '/dorso-hp.png',
  },

  // MÍTICO HP (1) — full-art
  {
    id: 'reliquias-muerte', nombre: 'Las Reliquias de la Muerte', epiteto: 'El Triángulo Sagrado', concepto: 'Inmortalidad',
    obra: 'Harry Potter', autor: 'J.K. Rowling', origen: 'Gran Bretaña',
    rareza: 'mitico', anio: 2007, color: '#c0c0c0',
    imagen: fp('Deathly Hallows.jpg'),
    simbolo: 'La varita de saúco, la piedra de la resurrección y la capa de invisibilidad',
    cita: '«El hombre más poderoso del mundo sería el dueño de las tres Reliquias de la Muerte»',
    fullArt: true,
    dorso: '/dorso-hp.png',
  },

  // ── EL SEÑOR DE LOS ANILLOS ─────────────────────────────────────────────

  // COMÚN SDA (5)
  {
    id: 'grima', nombre: 'Gríma Lengua de Serpiente', epiteto: 'El Traidor', concepto: 'Traición',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Rohan',
    rareza: 'comun', anio: 1954, color: '#3a3a4a',
    imagen: fp('Grima Wormtongue.jpg'),
    simbolo: 'La lengua viperina y las sombras de Orthanc',
    cita: '«Sus palabras son veneno»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'boromir', nombre: 'Boromir', epiteto: 'El Guerrero Caído', concepto: 'Redención',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Gondor',
    rareza: 'comun', anio: 1954, color: '#c8a000',
    imagen: fp('Boromir.jpg'),
    simbolo: 'El cuerno de Gondor',
    cita: '«Mi ciudad de los reyes no caerá mientras yo pueda luchar»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'barbol', nombre: 'Bárbol', epiteto: 'El Pastor de Árboles', concepto: 'Paciencia',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Fangorn',
    rareza: 'comun', anio: 1954, color: '#5a8a2a',
    imagen: fp('Treebeard Fangorn.jpg'),
    simbolo: 'Los ents y el bosque de Fangorn',
    cita: '«No hay que apresurarse cuando hay mucho en juego»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'theoden', nombre: 'Théoden', epiteto: 'El Rey Restaurado', concepto: 'Honor',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Rohan',
    rareza: 'comun', anio: 1954, color: '#8a7020',
    imagen: fp('Theoden King of Rohan.jpg'),
    simbolo: 'La corona de Rohan y la espada Herugrim',
    cita: '«¡A la muerte! ¡Cabalga hacia la ruina y el ocaso del mundo!»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'eomer', nombre: 'Éomer', epiteto: 'El Mariscal de la Marca', concepto: 'Fidelidad',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Rohan',
    rareza: 'comun', anio: 1954, color: '#c07830',
    imagen: fp('Eomer Marshal of Rohan.jpg'),
    simbolo: 'Las lanzas y los jinetes de Rohan',
    cita: '«¡Muerte! ¡Cabalga, cabalga hacia la ruina y el fin del mundo!»',
    dorso: '/dorso-sda.png',
  },

  // RARO SDA (5)
  {
    id: 'bilbo-bolson', nombre: 'Bilbo Bolsón', epiteto: 'El Hobbit Aventurero', concepto: 'Curiosidad',
    obra: 'El Señor de los Anillos / El Hobbit', autor: 'J.R.R. Tolkien', origen: 'La Comarca',
    rareza: 'raro', anio: 1954, color: '#7a5c2e',
    imagen: fp('Bilbo Baggins The Hobbit.jpg'),
    simbolo: 'El Anillo Único y la espada Aguijón',
    cita: '«¡Allá y de vuelta otra vez!»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'meriadoc', nombre: 'Meriadoc Brandigamo', epiteto: 'El Hobbit del Rohan', concepto: 'Coraje',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'La Comarca',
    rareza: 'raro', anio: 1954, color: '#a07040',
    imagen: fp('Merry Brandybuck hobbit.jpg'),
    simbolo: 'La espada de las colinas de los Túmulos',
    cita: '«¡Pero soy parte de la Compañía! Voy contigo o nada»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'samsagaz', nombre: 'Samsagaz Gamyi', epiteto: 'El Leal Jardinero', concepto: 'Lealtad',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'La Comarca',
    rareza: 'raro', anio: 1954, color: '#7a9e3e',
    imagen: fp('Samwise Gamgee hobbit.jpg'),
    simbolo: 'La caja del jardín de Galadriel',
    cita: '«Siempre hay algo de luz si uno sabe dónde mirar»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'gimli', nombre: 'Gimli', epiteto: 'El Guerrero Enano', concepto: 'Amistad',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'La Montaña Solitaria',
    rareza: 'raro', anio: 1954, color: '#8b4513',
    imagen: fp('Gimli dwarf lord of rings.jpg'),
    simbolo: 'El hacha y el cabello de Galadriel',
    cita: '«¡Que nadie diga que Gimli el Enano fue el último en luchar!»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'faramir', nombre: 'Faramir', epiteto: 'El Capitán de Gondor', concepto: 'Nobleza',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Gondor',
    rareza: 'raro', anio: 1954, color: '#1a3a5a',
    imagen: fp('Faramir Captain of Gondor.jpg'),
    simbolo: 'El arco de los Ithilien y Henneth Annûn',
    cita: '«No deseo ser un rey todopoderoso. Quiero ser un sanador»',
    dorso: '/dorso-sda.png',
  },

  // ÉPICO SDA (5)
  {
    id: 'aragorn', nombre: 'Aragorn', epiteto: 'El Rey Regresado', concepto: 'Destino',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Gondor',
    rareza: 'epico', anio: 1954, color: '#1a3a5a',
    imagen: fp('Aragorn ranger of the north.jpg'),
    simbolo: 'Andúril, la Llama del Oeste',
    cita: '«¡Por el Señor Frodo!»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'legolas', nombre: 'Legolas', epiteto: 'El Arquero Élfico', concepto: 'Precisión',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'El Bosque Negro',
    rareza: 'epico', anio: 1954, color: '#2e7d5e',
    imagen: fp('Legolas elf lord of rings.jpg'),
    simbolo: 'El arco élfico y la flecha dorada',
    cita: '«Mis ojos ven más lejos que los tuyos, amigo»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'arwen', nombre: 'Arwen Undómiel', epiteto: 'La Estrella de la Tarde', concepto: 'Sacrificio',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Rivendel',
    rareza: 'epico', anio: 1954, color: '#6b3d8e',
    imagen: fp('Arwen Undomiel evenstar.jpg'),
    simbolo: 'El Evenstar y la bandera de Gondor',
    cita: '«Renuncio a la inmortalidad. Esta es mi elección»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'galadriel', nombre: 'Galadriel', epiteto: 'La Señora de Lothlórien', concepto: 'Sabiduría',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Lothlórien',
    rareza: 'epico', anio: 1954, color: '#87ceeb',
    imagen: fp('Galadriel Lady of Lorien.jpg'),
    simbolo: 'El Espejo de Galadriel y el anillo Nenya',
    cita: '«Incluso la oscuridad debe pasar. Un nuevo día llegará»',
    dorso: '/dorso-sda.png',
  },
  {
    id: 'eowyn', nombre: 'Éowyn', epiteto: 'La Doncella Escudera', concepto: 'Valor',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Rohan',
    rareza: 'epico', anio: 1954, color: '#c8a000',
    imagen: fp('Eowyn shieldmaiden of Rohan.jpg'),
    simbolo: 'La espada y el escudo del Rohan',
    cita: '«¡Soy ningún hombre!»',
    dorso: '/dorso-sda.png',
  },

  // LEGENDARIO SDA (3) — full-art
  {
    id: 'frodo-bolson', nombre: 'Frodo Bolsón', epiteto: 'El Portador del Anillo', concepto: 'Sacrificio',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'La Comarca',
    rareza: 'legendario', anio: 1954, color: '#7a5c2e',
    imagen: fp('Frodo Baggins ring bearer.jpg'),
    simbolo: 'El Anillo Único y la Luz de Eärendil',
    cita: '«¡Cargaré con el Anillo! Aunque no conozco el camino»',
    fullArt: true,
    dorso: '/dorso-sda.png',
  },
  {
    id: 'gandalf', nombre: 'Gandalf el Gris', epiteto: 'El Istari', concepto: 'Guía',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Valinor',
    rareza: 'legendario', anio: 1954, color: '#c0c0c0',
    imagen: fp('Gandalf the Grey wizard.jpg'),
    simbolo: 'El báculo de Gandalf y Glamdring',
    cita: '«¡No pasarás!»',
    fullArt: true,
    dorso: '/dorso-sda.png',
  },
  {
    id: 'saruman', nombre: 'Saruman el Blanco', epiteto: 'El Mago Traidor', concepto: 'Corrupción',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Isengard',
    rareza: 'legendario', anio: 1954, color: '#8a8a8a',
    imagen: fp('Saruman White Wizard Isengard.jpg'),
    simbolo: 'La vara de poder y la Torre de Orthanc',
    cita: '«El mundo cambia. El que tiene sabiduría cambia con él»',
    fullArt: true,
    dorso: '/dorso-sda.png',
  },

  // MÍTICO SDA (1) — full-art
  {
    id: 'sauron', nombre: 'Sauron', epiteto: 'El Señor Oscuro', concepto: 'Dominio',
    obra: 'El Señor de los Anillos', autor: 'J.R.R. Tolkien', origen: 'Mordor',
    rareza: 'mitico', anio: 1954, color: '#8b0000',
    imagen: fp('Sauron Dark Lord Mordor.jpg'),
    simbolo: 'El Ojo de Sauron y los Nueve Nazgûl',
    cita: '«Un Anillo para gobernarlos a todos, un Anillo para encontrarlos»',
    fullArt: true,
    dorso: '/dorso-sda.png',
  },

  // ── GAME OF THRONES ──────────────────────────────────────────────────────

  // COMÚN GOT (5)
  {
    id: 'bran-stark', nombre: 'Bran Stark', epiteto: 'El Cuervo de Tres Ojos', concepto: 'Visión',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Invernalia',
    rareza: 'comun', anio: 1996, color: '#2e4a6a',
    imagen: fp('Bran Stark.jpg'),
    simbolo: 'El cuervo de tres ojos y las runas de los niños del bosque',
    cita: '«No puedo ser el Señor de Invernalia. No puedo ser nada. Solo el Cuervo de Tres Ojos»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'davos-seaworth', nombre: 'Davos Seaworth', epiteto: 'El Caballero de la Cebolla', concepto: 'Lealtad',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Bahía del Aguasnegras',
    rareza: 'comun', anio: 1996, color: '#3a6a5a',
    imagen: fp('Davos Seaworth.jpg'),
    simbolo: 'Los dedos cortados y el amuleto de huesos',
    cita: '«No soy un lord, soy un contrabandista»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'samwell-tarly', nombre: 'Samwell Tarly', epiteto: 'Sam el Asesino de Blancos', concepto: 'Sabiduría',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Colina Cuerno',
    rareza: 'comun', anio: 1996, color: '#4a3a6a',
    imagen: fp('Samwell Tarly.jpg'),
    simbolo: 'Los libros de la Ciudadela y la obsidiana',
    cita: '«Los libros son como espejos: si un tonto mira dentro, no puede ver a un sabio»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'theon-greyjoy', nombre: 'Theon Greyjoy', epiteto: 'El Príncipe de las Islas', concepto: 'Redención',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Pyke',
    rareza: 'comun', anio: 1996, color: '#5a5a2e',
    imagen: fp('Theon Greyjoy.jpg'),
    simbolo: 'El kraken de Pyke y las cadenas de Reek',
    cita: '«Mi nombre es Theon Greyjoy»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'ygritte', nombre: 'Ygritte', epiteto: 'La Salvaje', concepto: 'Pasión',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Más allá del Muro',
    rareza: 'comun', anio: 1996, color: '#8b0000',
    imagen: fp('Ygritte wildling.jpg'),
    simbolo: 'El arco y la llama entre la nieve',
    cita: '«No sabes nada, Jon Nieve»',
    dorso: '/dorso-got.png',
  },

  // RARO GOT (5)
  {
    id: 'brienne-de-tarth', nombre: 'Brienne de Tarth', epiteto: 'La Doncella de Tarth', concepto: 'Honor',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Tarth',
    rareza: 'raro', anio: 1996, color: '#4a6a9a',
    imagen: fp('Brienne of Tarth.jpg'),
    simbolo: 'La espada Juramento y la armadura de doncella',
    cita: '«Juro por mi honor que encontraré a las hijas de Lady Stark»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'jorah-mormont', nombre: 'Jorah Mormont', epiteto: 'El Caballero Exiliado', concepto: 'Devoción',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'La Isla del Oso',
    rareza: 'raro', anio: 1996, color: '#1a4a7a',
    imagen: fp('Jorah Mormont.jpg'),
    simbolo: 'El medallón de la Guardia Real de Daenerys',
    cita: '«Daenerys, Protectora del Reino, yo moriría por vos»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'melisandre', nombre: 'Melisandre', epiteto: 'La Mujer Roja', concepto: 'Fe',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: "Asshai",
    rareza: 'raro', anio: 1996, color: '#c0392b',
    imagen: fp('Melisandre red woman.jpg'),
    simbolo: 'La llama de R\'hllor y el collar de rubí',
    cita: '«La noche es oscura y alberga horrores»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'petyr-baelish', nombre: 'Petyr Baelish', epiteto: 'Meñique', concepto: 'Ambición',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Los Dedos',
    rareza: 'raro', anio: 1996, color: '#7a5c2e',
    imagen: fp('Petyr Baelish Littlefinger.jpg'),
    simbolo: 'El puñal de Valyria y las monedas del caos',
    cita: '«El caos no es un pozo; es una escalera»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'sandor-clegane', nombre: 'Sandor Clegane', epiteto: 'El Perro', concepto: 'Brutalidad',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Roca Casterly',
    rareza: 'raro', anio: 1996, color: '#5a5a5a',
    imagen: fp('Sandor Clegane the Hound.jpg'),
    simbolo: 'El yelmo de perro y la cicatriz de fuego',
    cita: '«Pollo»',
    dorso: '/dorso-got.png',
  },

  // ÉPICO GOT (5)
  {
    id: 'arya-stark', nombre: 'Arya Stark', epiteto: 'Una Chica Sin Nombre', concepto: 'Venganza',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Invernalia',
    rareza: 'epico', anio: 1996, color: '#3a6a3a',
    imagen: fp('Arya Stark.jpg'),
    simbolo: 'La espada Aguja y la lista de nombres',
    cita: '«Una chica no tiene nombre. Una chica es nadie»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'cersei-lannister', nombre: 'Cersei Lannister', epiteto: 'La Reina Leona', concepto: 'Poder',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Roca Casterly',
    rareza: 'epico', anio: 1996, color: '#8b6914',
    imagen: fp('Cersei Lannister.jpg'),
    simbolo: 'La corona de la reina y el vino de Dorne',
    cita: '«Cuando jugás al juego de tronos, o ganás o morís»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'jaime-lannister', nombre: 'Jaime Lannister', epiteto: 'El Matarreyes', concepto: 'Redención',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Roca Casterly',
    rareza: 'epico', anio: 1996, color: '#c8a000',
    imagen: fp('Jaime Lannister Kingslayer.jpg'),
    simbolo: 'La mano de oro y la espada de acero valyrio',
    cita: '«Hay cosas que hacemos por amor»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'sansa-stark', nombre: 'Sansa Stark', epiteto: 'La Dama del Norte', concepto: 'Fortaleza',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Invernalia',
    rareza: 'epico', anio: 1996, color: '#6b3d8e',
    imagen: fp('Sansa Stark.jpg'),
    simbolo: 'La corona del Norte y la piel de lobo',
    cita: '«La vida no es una canción, pequeña. Aprenderás eso a tu propio dolor»',
    dorso: '/dorso-got.png',
  },
  {
    id: 'tyrion-lannister', nombre: 'Tyrion Lannister', epiteto: 'El Gnomo', concepto: 'Ingenio',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Roca Casterly',
    rareza: 'epico', anio: 1996, color: '#c8102e',
    imagen: fp('Tyrion Lannister.jpg'),
    simbolo: 'La copa de vino y el libro de la Mano del Rey',
    cita: '«Bebo y sé cosas»',
    dorso: '/dorso-got.png',
  },

  // LEGENDARIO GOT (2) — full-art
  {
    id: 'jon-snow', nombre: 'Jon Nieve', epiteto: 'El Rey del Norte', concepto: 'Deber',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Invernalia',
    rareza: 'legendario', anio: 1996, color: '#c0c0c0',
    imagen: fp('Jon Snow King of the North.jpg'),
    simbolo: 'La espada Garra y el lobo huargo Fantasma',
    cita: '«El invierno llegó»',
    fullArt: true,
    dorso: '/dorso-got.png',
  },
  {
    id: 'daenerys-targaryen', nombre: 'Daenerys Targaryen', epiteto: 'Madre de Dragones', concepto: 'Fuego',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Essos',
    rareza: 'legendario', anio: 1996, color: '#c8102e',
    imagen: fp('Daenerys Targaryen Mother of Dragons.jpg'),
    simbolo: 'Los tres dragones y las cadenas rotas',
    cita: '«Dracarys»',
    fullArt: true,
    dorso: '/dorso-got.png',
  },

  // MÍTICO GOT (1) — full-art
  {
    id: 'the-night-king', nombre: 'El Rey de la Noche', epiteto: 'El Señor de los Muertos', concepto: 'Muerte',
    obra: 'Game of Thrones', autor: 'George R.R. Martin', origen: 'Más allá del Muro',
    rareza: 'mitico', anio: 1996, color: '#87ceeb',
    imagen: fp('Night King Game of Thrones.jpg'),
    simbolo: 'El ejército de los Caminantes Blancos y el dragón de hielo',
    cita: '«…»',
    fullArt: true,
    dorso: '/dorso-got.png',
  },

  // ── EL PRINCIPITO ────────────────────────────────────────────────────────

  // COMÚN PRINCIPITO (3)
  {
    id: 'el-bebedor', nombre: 'El Bebedor', epiteto: 'El Avergonzado', concepto: 'Evasión',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'comun', anio: 1943, color: '#7a4a2e',
    imagen: fp('The Little Prince - bebedor.jpg'),
    simbolo: 'Las botellas vacías y la vergüenza',
    cita: '«Bebo para olvidar que me avergüenzo de beber»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'el-vanidoso', nombre: 'El Vanidoso', epiteto: 'El que Quiere ser Admirado', concepto: 'Vanidad',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'comun', anio: 1943, color: '#c8a000',
    imagen: fp('The Little Prince - vanidoso.jpg'),
    simbolo: 'El sombrero y los aplausos inexistentes',
    cita: '«¿Me admiras mucho, verdad?»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'el-baobab', nombre: 'Los Baobabs', epiteto: 'La Amenaza Silenciosa', concepto: 'Descuido',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'comun', anio: 1943, color: '#5a8a2a',
    imagen: fp('The Little Prince - baobab.jpg'),
    simbolo: 'Las raíces que devoran el planeta',
    cita: '«Es una cuestión de disciplina»',
    dorso: '/dorso-principito.png',
  },

  // RARO PRINCIPITO (3)
  {
    id: 'el-rey', nombre: 'El Rey', epiteto: 'El Monarca Sin Súbditos', concepto: 'Autoridad',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'raro', anio: 1943, color: '#c8102e',
    imagen: fp('The Little Prince - rey.jpg'),
    simbolo: 'La corona y el manto de armiño',
    cita: '«Ordeno que te vayas»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'el-farolero', nombre: 'El Farolero', epiteto: 'El Fiel a su Consigna', concepto: 'Deber',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'raro', anio: 1943, color: '#3d6b94',
    imagen: fp('The Little Prince - farolero.jpg'),
    simbolo: 'El farol y la noche que no termina',
    cita: '«Las consignas son las consignas»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'el-hombre-de-negocios', nombre: 'El Hombre de Negocios', epiteto: 'El Contador de Estrellas', concepto: 'Codicia',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'raro', anio: 1943, color: '#8b6914',
    imagen: fp('The Little Prince - hombre negocios.jpg'),
    simbolo: 'Los números y las estrellas contadas',
    cita: '«Yo poseo las estrellas porque nadie antes pensó en poseerlas»',
    dorso: '/dorso-principito.png',
  },

  // ÉPICO PRINCIPITO (3)
  {
    id: 'el-aviador', nombre: 'El Aviador', epiteto: 'El Narrador del Desierto', concepto: 'Nostalgia',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'epico', anio: 1943, color: '#c07830',
    imagen: fp('The Little Prince - aviador.jpg'),
    simbolo: 'El avión caído y el dibujo de la boa',
    cita: '«Todas las personas grandes fueron primero niños, aunque pocas lo recuerdan»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'el-geografo', nombre: 'El Geógrafo', epiteto: 'El Sabio Inmóvil', concepto: 'Conocimiento',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'epico', anio: 1943, color: '#1a4a7a',
    imagen: fp('The Little Prince - geografo.jpg'),
    simbolo: 'Los mapas y los libros sin actualizar',
    cita: '«Los geógrafos no van a contar las ciudades»',
    dorso: '/dorso-principito.png',
  },
  {
    id: 'la-serpiente', nombre: 'La Serpiente', epiteto: 'La que Sabe el Secreto', concepto: 'Misterio',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'epico', anio: 1943, color: '#2d5a27',
    imagen: fp('The Little Prince - serpiente.jpg'),
    simbolo: 'El anillo dorado en la arena del desierto',
    cita: '«Puedo devolverte a la tierra de donde viniste»',
    dorso: '/dorso-principito.png',
  },

  // LEGENDARIO PRINCIPITO (2) — full-art
  {
    id: 'el-zorro', nombre: 'El Zorro', epiteto: 'El que Enseña a Domesticar', concepto: 'Amistad',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'legendario', anio: 1943, color: '#c8a000',
    imagen: fp('The Little Prince - zorro.jpg'),
    simbolo: 'El trigo dorado y los vínculos del corazón',
    cita: '«Solo se ve bien con el corazón; lo esencial es invisible a los ojos»',
    fullArt: true,
    dorso: '/dorso-principito.png',
  },
  {
    id: 'la-rosa', nombre: 'La Rosa', epiteto: 'La Única en el Mundo', concepto: 'Amor',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'legendario', anio: 1943, color: '#c8102e',
    imagen: fp('The Little Prince - rosa.jpg'),
    simbolo: 'Los cuatro espinas y la campana de cristal',
    cita: '«Es el tiempo que le has dedicado a tu rosa lo que la hace tan importante»',
    fullArt: true,
    dorso: '/dorso-principito.png',
  },

  // MÍTICO PRINCIPITO (1) — full-art
  {
    id: 'el-principito', nombre: 'El Principito', epiteto: 'El Pequeño Príncipe', concepto: 'Inocencia',
    obra: 'El Principito', autor: 'Antoine de Saint-Exupéry', origen: 'Francia',
    rareza: 'mitico', anio: 1943, color: '#f4d03f',
    imagen: fp('The Little Prince.jpg'),
    simbolo: 'La estrella B-612 y la bufanda al viento',
    cita: '«Quizás al mirar el cielo de noche sentirás que todas las estrellas ríen»',
    fullArt: true,
    dorso: '/dorso-principito.png',
  },

  // ── LITERATURA CLÁSICA (continuación) ────────────────────────────────────

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
