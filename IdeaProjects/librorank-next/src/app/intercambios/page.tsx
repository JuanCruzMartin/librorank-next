import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import * as amigoDAO from '@/lib/dao/amigoDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import IntercambiosClient from './IntercambiosClient'

export const metadata = { title: 'Intercambios — LibroRank' }

export default async function IntercambiosPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, coleccion, amigos] = await Promise.all([
    usuarioDAO.buscarPorId(authUser.id),
    cartaDAO.obtenerColeccion(authUser.id),
    amigoDAO.obtenerAmigos(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <IntercambiosClient
          usuarioId={authUser.id}
          miColeccion={coleccion}
          amigos={amigos.map(a => ({ id: a.id, nombre: a.nombre, avatar: a.avatar_url ?? null }))}
        />
      </main>
      <Footer />
    </>
  )
}
