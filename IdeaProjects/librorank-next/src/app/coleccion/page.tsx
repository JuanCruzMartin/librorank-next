import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import * as amigoDAO from '@/lib/dao/amigoDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ColeccionConTabs from './ColeccionConTabs'

export const metadata = { title: 'Colección — LibroRank' }

export default async function ColeccionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  await cartaDAO.migrarCantidadCartas()

  const params = await searchParams
  const tabInicial = params.tab === 'intercambios' ? 'intercambios' : 'coleccion'

  const [usuario, coleccion, cantidades, tiradas, amigos] = await Promise.all([
    usuarioDAO.buscarPorId(authUser.id),
    cartaDAO.obtenerColeccion(authUser.id),
    cartaDAO.obtenerCantidades(authUser.id),
    cartaDAO.obtenerTiradas(authUser.id),
    amigoDAO.obtenerAmigos(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <ColeccionConTabs
          coleccion={coleccion}
          cantidades={cantidades}
          tiradas={tiradas}
          usuarioId={authUser.id}
          amigos={amigos.map(a => ({ id: a.id, nombre: a.nombre, avatar: a.avatar_url ?? null }))}
          tabInicial={tabInicial}
        />
      </main>
      <Footer />
    </>
  )
}
