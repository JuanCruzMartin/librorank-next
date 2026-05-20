import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { buscarPorUsuario, obtenerStatsPorUsuario, obtenerAutorMasLeido, obtenerMejorCalificado, sumarPaginasLeidas } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BibliotecaClient from './BibliotecaClient'

export default async function BibliotecaPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, libros, stats, autorMasLeido, mejorCalificado, paginas] = await Promise.all([
    buscarPorId(authUser.id),
    buscarPorUsuario(authUser.id),
    obtenerStatsPorUsuario(authUser.id),
    obtenerAutorMasLeido(authUser.id),
    obtenerMejorCalificado(authUser.id),
    sumarPaginasLeidas(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <BibliotecaClient
          librosIniciales={libros}
          stats={stats}
          autorMasLeido={autorMasLeido}
          mejorCalificado={mejorCalificado}
          paginas={paginas}
          usuario={usuario}
        />
      </main>
      <Footer />
    </>
  )
}
