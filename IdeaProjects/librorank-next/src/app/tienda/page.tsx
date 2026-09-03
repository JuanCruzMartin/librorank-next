import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TiendaClient from './TiendaClient'
import { ITEMS_TIENDA } from '@/lib/tienda'

export const metadata = { title: 'Tienda' }

export default async function TiendaPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const usuario = await buscarPorId(authUser.id)
  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main style={{ minHeight: 'calc(100vh - 128px)', padding: '2rem 1rem' }}>
        <TiendaClient items={ITEMS_TIENDA} puntosIniciales={usuario.puntos ?? 0} />
      </main>
      <Footer />
    </>
  )
}
