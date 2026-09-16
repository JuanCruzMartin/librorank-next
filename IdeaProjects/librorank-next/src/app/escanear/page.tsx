import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import EscanearClient from './EscanearClient'

export default async function EscanearPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const usuario = await buscarPorId(authUser.id)
  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <EscanearClient />
      <Footer />
    </>
  )
}
