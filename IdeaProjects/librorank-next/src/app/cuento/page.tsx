import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerHistoriaCompleta, obtenerOIdUnicaHistoria, haEscritoYa } from '@/lib/dao/cuentoDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CuentoClient from './CuentoClient'

export default async function CuentoPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const usuario = await buscarPorId(authUser.id)
  if (!usuario) redirect('/login')

  const historiaId = await obtenerOIdUnicaHistoria()
  const [fragmentos, yaEscribio] = await Promise.all([
    obtenerHistoriaCompleta(historiaId),
    haEscritoYa(historiaId, authUser.id),
  ])

  return (
    <>
      <Header user={usuario} />
      <main>
        <CuentoClient fragmentos={fragmentos} yaEscribio={yaEscribio} usuarioId={authUser.id} />
      </main>
      <Footer />
    </>
  )
}
