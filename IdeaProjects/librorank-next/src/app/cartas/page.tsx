import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartasClient from './CartasClient'

export const metadata = { title: 'Colección de Cartas — LibroRank' }

export default async function CartasPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, coleccion, tiradas] = await Promise.all([
    usuarioDAO.buscarPorId(authUser.id),
    cartaDAO.obtenerColeccion(authUser.id),
    cartaDAO.obtenerTiradas(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <CartasClient coleccion={coleccion} tiradas={tiradas} />
      </main>
      <Footer />
    </>
  )
}
