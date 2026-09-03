import type { Serie } from './cartas'

export type TipoSobre = 'general' | Serie | 'premium'

export interface ItemTienda {
  id: string
  nombre: string
  descripcion: string
  imagen: string
  precio: number
  tipo: TipoSobre
  color: string
  colorSecundario: string
}

export const ITEMS_TIENDA: ItemTienda[] = [
  {
    id: 'sobre-general',
    nombre: 'Sobre General',
    descripcion: '5 cartas aleatorias de cualquier colección',
    imagen: '/sobres/sobre-general.jpg',
    precio: 500,
    tipo: 'general',
    color: '#c9a227',
    colorSecundario: '#6b4f1a',
  },
  {
    id: 'sobre-got',
    nombre: 'Sobre Game of Thrones',
    descripcion: '5 cartas garantizadas de Juego de Tronos',
    imagen: '/sobres/sobre-GOT.jpg',
    precio: 900,
    tipo: 'got',
    color: '#8b1a1a',
    colorSecundario: '#3a0a0a',
  },
  {
    id: 'sobre-sda',
    nombre: 'Sobre Señor de los Anillos',
    descripcion: '5 cartas garantizadas de El Señor de los Anillos',
    imagen: '/sobres/sobre-SDLA.jpg',
    precio: 900,
    tipo: 'sda',
    color: '#3a6b2a',
    colorSecundario: '#1a3a10',
  },
  {
    id: 'sobre-hp',
    nombre: 'Sobre Harry Potter',
    descripcion: '5 cartas garantizadas de Harry Potter',
    imagen: '/sobres/sobre-HP.jpg',
    precio: 900,
    tipo: 'hp',
    color: '#4a2a8b',
    colorSecundario: '#1a0a3a',
  },
  {
    id: 'sobre-principito',
    nombre: 'Sobre El Principito',
    descripcion: '5 cartas garantizadas de El Principito',
    imagen: '/sobres/sobre-PRINCIPITO.jpg',
    precio: 900,
    tipo: 'principito',
    color: '#c9a227',
    colorSecundario: '#2a4a6b',
  },
  {
    id: 'sobre-premium',
    nombre: 'Sobre Premium',
    descripcion: '5 cartas con probabilidad ×3 de Épico o superior',
    imagen: '/sobres/sobre-premium.jpg',
    precio: 1500,
    tipo: 'premium',
    color: '#9b59b6',
    colorSecundario: '#4a1a6b',
  },
]
