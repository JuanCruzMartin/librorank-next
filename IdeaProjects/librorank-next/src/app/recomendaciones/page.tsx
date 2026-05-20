import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerConteoPorGenero, obtenerConteoPorMood } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RecomendacionesClient from './RecomendacionesClient'

export default async function RecomendacionesPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, generoConteo, moodConteo] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerConteoPorGenero(authUser.id),
    obtenerConteoPorMood(authUser.id),
  ])

  if (!usuario) redirect('/login')

  // Top géneros y mood más frecuente del usuario
  const topGeneros = Object.entries(generoConteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g)

  const moodFavorito = Object.entries(moodConteo)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Relajado'

  return (
    <>
      <Header user={usuario} />
      <main>
        <RecomendacionesClient
          moodFavorito={moodFavorito}
          topGeneros={topGeneros}
        />
      </main>
      <Footer />
    </>
  )
}
