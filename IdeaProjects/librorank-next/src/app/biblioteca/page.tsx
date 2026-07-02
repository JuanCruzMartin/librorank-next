import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { buscarPorUsuario, obtenerStatsPorUsuario, obtenerAutorMasLeido, obtenerMejorCalificado, sumarPaginasLeidas, obtenerConteoPorGenero, obtenerConteoPorMood } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BibliotecaClient from './BibliotecaClient'

export default async function BibliotecaPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const targetId = params.id ? Number(params.id) : authUser.id
  const soloLectura = targetId !== authUser.id

  const [authUsuario, targetUsuario, libros, stats, autorMasLeido, mejorCalificado, paginas, generoConteo, moodConteo] = await Promise.all([
    buscarPorId(authUser.id),
    buscarPorId(targetId),
    buscarPorUsuario(targetId),
    obtenerStatsPorUsuario(targetId),
    obtenerAutorMasLeido(targetId),
    obtenerMejorCalificado(targetId),
    sumarPaginasLeidas(targetId),
    obtenerConteoPorGenero(authUser.id),
    obtenerConteoPorMood(authUser.id),
  ])

  const topGeneros = Object.entries(generoConteo as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g)

  const moodFavorito = Object.entries(moodConteo as Record<string, number>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Relajado'

  if (!authUsuario) redirect('/login')
  if (!targetUsuario) redirect('/biblioteca')

  return (
    <>
      <Header user={authUsuario} />
      <main>
        <BibliotecaClient
          librosIniciales={libros}
          stats={stats}
          autorMasLeido={autorMasLeido}
          mejorCalificado={mejorCalificado}
          paginas={paginas}
          usuario={targetUsuario}
          soloLectura={soloLectura}
          topGeneros={topGeneros}
          moodFavorito={moodFavorito}
        />
      </main>
      <Footer />
    </>
  )
}
