import { getAuthUser } from '@/lib/auth'
import { buscarPorId, obtenerRankingLectores, obtenerRankingSemanal, obtenerRankingAutores } from '@/lib/dao/usuarioDAO'
import { obtenerIdsAmigos } from '@/lib/dao/amigoDAO'
import { getLiga } from '@/lib/ligas'
import { ensureResetSemanal } from '@/lib/dao/ligaCompDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RankingClient from './RankingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ranking de Lectores',
  description: 'Mirá quiénes son los lectores más activos de LibroRank. Competí, subí de liga y alcanzá la cima del ranking literario.',
}

export default async function RankingPage() {
  const authUser = await getAuthUser()

  await ensureResetSemanal().catch(() => {})

  const [usuario, rankingRaw, idsAmigos, rankingSemanalRaw, rankingAutores] = await Promise.all([
    authUser ? buscarPorId(authUser.id) : Promise.resolve(null),
    obtenerRankingLectores(200),
    authUser ? obtenerIdsAmigos(authUser.id) : Promise.resolve([] as number[]),
    obtenerRankingSemanal(100),
    obtenerRankingAutores(30),
  ])

  const ranking = rankingRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    puntos: u.puntos ?? 0,
    total_leidos: u.total_leidos ?? 0,
    total_paginas: u.total_paginas ?? 0,
    avatar_url: u.avatar_url ?? null,
    es_amigo: idsAmigos.includes(u.id),
    es_yo: authUser ? u.id === authUser.id : false,
  }))

  const rankingSemanal = rankingSemanalRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    avatar_url: u.avatar_url ?? null,
    puntos: u.puntos ?? 0,
    libros_semana: u.libros_semana ?? 0,
    es_yo: authUser ? u.id === authUser.id : false,
    es_amigo: idsAmigos.includes(u.id),
  }))

  return (
    <>
      <Header user={usuario ?? null} />
      <main>
        <RankingClient
          ranking={ranking}
          rankingSemanal={rankingSemanal}
          rankingAutores={rankingAutores}
          usuarioId={authUser?.id ?? null}
          puntosUsuario={usuario?.puntos ?? null}
        />
      </main>
      <Footer />
    </>
  )
}
