import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function AmigosLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')
  const usuario = await buscarPorId(authUser.id)

  return (
    <>
      <Header user={usuario} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
