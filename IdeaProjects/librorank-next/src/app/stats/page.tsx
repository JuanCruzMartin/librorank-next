import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StatsClient from './StatsClient'

export default async function StatsPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, generos, moods, paginas, autorMasLeido, mejorCalificado, stats] = await Promise.all([
    buscarPorId(authUser.id),
    libroDAO.obtenerConteoPorGenero(authUser.id),
    libroDAO.obtenerConteoPorMood(authUser.id),
    libroDAO.sumarPaginasLeidas(authUser.id),
    libroDAO.obtenerAutorMasLeido(authUser.id),
    libroDAO.obtenerMejorCalificado(authUser.id),
    libroDAO.obtenerStatsPorUsuario(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <StatsClient
          generos={generos}
          moods={moods}
          paginas={paginas}
          autorMasLeido={autorMasLeido}
          mejorCalificado={mejorCalificado}
          stats={stats}
        />
      </main>
      <Footer />
    </>
  )
}
