import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId, obtenerRankingLectores, obtenerRankingSemanal } from '@/lib/dao/usuarioDAO'
import { obtenerIdsAmigos } from '@/lib/dao/amigoDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RankingClient from './RankingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ranking de Lectores',
  description: 'Mirá quiénes son los lectores más activos de LibroRank. Competí, subí de nivel y alcanzá la cima del ranking literario.',
}

export default async function RankingPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, rankingRaw, idsAmigos, rankingSemanalRaw] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerRankingLectores(200),
    obtenerIdsAmigos(authUser.id),
    obtenerRankingSemanal(100),
  ])

  if (!usuario) redirect('/login')

  const ranking = rankingRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    puntos: u.puntos ?? 0,
    total_leidos: u.total_leidos ?? 0,
    avatar_url: u.avatar_url ?? null,
    es_amigo: idsAmigos.includes(u.id),
    es_yo: u.id === authUser.id,
  }))

  const rankingSemanal = rankingSemanalRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    avatar_url: u.avatar_url ?? null,
    puntos: u.puntos ?? 0,
    libros_semana: u.libros_semana ?? 0,
    es_yo: u.id === authUser.id,
    es_amigo: idsAmigos.includes(u.id),
  }))

  return (
    <>
      <Header user={usuario} />
      <main>
        <RankingClient
          ranking={ranking}
          rankingSemanal={rankingSemanal}
          usuarioId={authUser.id}
          puntosUsuario={usuario.puntos ?? 0}
        />
      </main>
      <Footer />
    </>
  )
}
