import { redirect, notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerClub, obtenerMiembros, obtenerPosts } from '@/lib/dao/clubDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ClubClient from './ClubClient'

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const { id } = await params
  const clubId = Number(id)

  const [usuario, club, miembros, posts] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerClub(clubId, authUser.id),
    obtenerMiembros(clubId),
    obtenerPosts(clubId),
  ])

  if (!usuario) redirect('/login')
  if (!club) notFound()

  return (
    <>
      <Header user={usuario} />
      <main>
        <ClubClient
          club={club}
          miembrosIniciales={miembros}
          postsIniciales={posts}
          usuarioId={authUser.id}
        />
      </main>
      <Footer />
    </>
  )
}
