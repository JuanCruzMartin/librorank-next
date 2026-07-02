import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'
import { obtenerRetosActivos } from '@/lib/dao/retoDAO'
import { obtenerBingo } from '@/lib/dao/bingoDAO'
import { buscarPorUsuario } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DesafiosClient from './DesafiosClient'

export default async function DesafiosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const tabInicial = (params.tab === 'retos' || params.tab === 'bingo') ? params.tab : 'misiones'

  const [usuario, misiones, retos, bingo, misLibros] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerMisionesConProgreso(authUser.id),
    obtenerRetosActivos(authUser.id),
    obtenerBingo(authUser.id),
    buscarPorUsuario(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <DesafiosClient
          tabInicial={tabInicial}
          misiones={misiones}
          puntos={usuario.puntos ?? 0}
          retos={retos}
          bingo={bingo}
          misLibros={misLibros}
          usuarioId={authUser.id}
        />
      </main>
      <Footer />
    </>
  )
}
