import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId, obtenerRankingLectores, obtenerRankingSemanal, obtenerRankingAutores, getNivelLector } from '@/lib/dao/usuarioDAO'
import { obtenerIdsAmigos } from '@/lib/dao/amigoDAO'
import { getLiga } from '@/lib/ligas'
import { ensureResetSemanal, getLigaCompUsuario, getRankingLigaComp } from '@/lib/dao/ligaCompDAO'
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
  if (!authUser) redirect('/login')

  // Dispara el reset semanal lazy (no-op si ya se corrió esta semana)
  await ensureResetSemanal().catch(() => {})

  const [usuario, rankingRaw, idsAmigos, rankingSemanalRaw, rankingAutores] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerRankingLectores(200),
    obtenerIdsAmigos(authUser.id),
    obtenerRankingSemanal(100),
    obtenerRankingAutores(30),
  ])

  if (!usuario) redirect('/login')

  const ligaActual    = getLiga(usuario.puntos ?? 0)
  const ligaCompKey   = await getLigaCompUsuario(authUser.id)
  const ligaCompRaw   = await getRankingLigaComp(ligaCompKey)

  const ranking = rankingRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    puntos: u.puntos ?? 0,
    total_leidos: u.total_leidos ?? 0,
    total_paginas: u.total_paginas ?? 0,
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

  const ligaSemanal = ligaCompRaw.map(u => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    avatar_url: u.avatar_url ?? null,
    puntos: u.puntos ?? 0,
    libros_semana: Number(u.libros_semana ?? 0),
    es_yo: u.id === authUser.id,
    es_amigo: idsAmigos.includes(u.id),
    nivel: getNivelLector(u.puntos ?? 0),
  }))

  return (
    <>
      <Header user={usuario} />
      <main>
        <RankingClient
          ranking={ranking}
          rankingSemanal={rankingSemanal}
          ligaSemanal={ligaSemanal}
          rankingAutores={rankingAutores}
          ligaActualKey={ligaActual.key}
          ligaCompKey={ligaCompKey}
          usuarioId={authUser.id}
          puntosUsuario={usuario.puntos ?? 0}
        />
      </main>
      <Footer />
    </>
  )
}
