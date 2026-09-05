import { redirect } from 'next/navigation'

export const metadata = { title: 'Tienda — LibroRank' }

export default function TiendaPage() {
  redirect('/coleccion?tab=tienda')
}
