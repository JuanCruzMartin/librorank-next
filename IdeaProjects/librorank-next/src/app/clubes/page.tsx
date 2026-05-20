import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { listarClubes } from '@/lib/dao/clubDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ClubesClient from './ClubesClient'

export default async function ClubesPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, clubes] = await Promise.all([
    buscarPorId(authUser.id),
    listarClubes(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <ClubesClient clubesIniciales={clubes} />
      </main>
      <Footer />
    </>
  )
}
