import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import AdminCartasClient from './AdminCartasClient'

export default async function AdminCartasPage() {
  if (process.env.NODE_ENV === 'production') redirect('/coleccion')

  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')
  const usuario = await usuarioDAO.buscarPorId(authUser.id)
  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <AdminCartasClient />
      </main>
      <Footer />
    </>
  )
}
