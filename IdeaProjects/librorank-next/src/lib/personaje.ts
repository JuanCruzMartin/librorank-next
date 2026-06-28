export type ClasePersonaje = 'El Erudito' | 'El Cronista' | 'El Guardián' | 'El Explorador' | 'El Sabio'

export interface AtributosPersonaje {
  sabiduria: number
  elocuencia: number
  constancia: number
  amplitud: number
}

export interface Personaje {
  clase: ClasePersonaje
  emoji: string
  nivel: number
  atributos: AtributosPersonaje
  descripcion: string
  colorPrincipal: string
}

const CAP_SABIDURIA  = 100  // libros leídos para llegar a max
const CAP_ELOCUENCIA = 50   // reseñas escritas
const CAP_CONSTANCIA = 60   // días de racha
const CAP_AMPLITUD   = 10   // géneros distintos

function normalizar(valor: number, cap: number): number {
  return Math.min(Math.round((valor / cap) * 100), 100)
}

export function calcularPersonaje(
  totalLeidos: number,
  totalResenas: number,
  rachaActual: number,
  generosDistintos: number,
): Personaje {
  const sabiduria  = normalizar(totalLeidos,      CAP_SABIDURIA)
  const elocuencia = normalizar(totalResenas,     CAP_ELOCUENCIA)
  const constancia = normalizar(rachaActual,      CAP_CONSTANCIA)
  const amplitud   = normalizar(generosDistintos, CAP_AMPLITUD)

  const nivel = Math.round((sabiduria + elocuencia + constancia + amplitud) / 4)

  // Clase según atributo dominante
  const attrs = { sabiduria, elocuencia, constancia, amplitud }
  const max = Math.max(...Object.values(attrs))
  const dominante = Object.entries(attrs).find(([, v]) => v === max)?.[0]

  const todosIguales = new Set(Object.values(attrs)).size <= 2 &&
    Math.max(...Object.values(attrs)) - Math.min(...Object.values(attrs)) < 15

  let clase: ClasePersonaje
  let emoji: string
  let colorPrincipal: string
  let descripcion: string

  if (todosIguales || dominante === undefined) {
    clase = 'El Sabio'
    emoji = '✨'
    colorPrincipal = '#d4af37'
    descripcion = 'Un lector equilibrado que cultiva todas las virtudes por igual.'
  } else if (dominante === 'sabiduria') {
    clase = 'El Erudito'
    emoji = '📚'
    colorPrincipal = '#9b59b6'
    descripcion = 'Devora libros sin parar. Su conocimiento no tiene límites.'
  } else if (dominante === 'elocuencia') {
    clase = 'El Cronista'
    emoji = '🖊️'
    colorPrincipal = '#3498db'
    descripcion = 'Sus reseñas son tan buenas como los libros que lee.'
  } else if (dominante === 'constancia') {
    clase = 'El Guardián'
    emoji = '⚔️'
    colorPrincipal = '#e74c3c'
    descripcion = 'Lee todos los días sin excepción. La constancia es su superpoder.'
  } else {
    clase = 'El Explorador'
    emoji = '🌍'
    colorPrincipal = '#27ae60'
    descripcion = 'No hay género que no haya explorado. Su curiosidad no tiene fronteras.'
  }

  return {
    clase,
    emoji,
    nivel,
    atributos: { sabiduria, elocuencia, constancia, amplitud },
    descripcion,
    colorPrincipal,
  }
}
