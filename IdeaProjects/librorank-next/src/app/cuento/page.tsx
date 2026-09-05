import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { migrarTablaCuentos, obtenerMisCuentos } from '@/lib/dao/cuentoPersonalDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CuentoClient from './CuentoClient'

export const metadata = { title: 'Mis Cuentos — LibroRank' }

export default async function CuentoPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  await migrarTablaCuentos()

  const usuario = await buscarPorId(authUser.id)
  if (!usuario) redirect('/login')
  const cuentos = await obtenerMisCuentos(authUser.id)

  return (
    <>
      <Header user={usuario} />
      <main style={{ minHeight: 'calc(100vh - 128px)', padding: '2rem 1rem', maxWidth: 860, margin: '0 auto' }}>
        <CuentoClient cuentosIniciales={cuentos} />
      </main>
      <Footer />
    </>
  )
}
