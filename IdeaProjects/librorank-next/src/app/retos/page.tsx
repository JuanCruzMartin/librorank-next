import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerRetosActivos } from '@/lib/dao/retoDAO'
import { buscarPorUsuario } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RetosClient from './RetosClient'

export default async function RetosPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, retos, misLibros] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerRetosActivos(authUser.id),
    buscarPorUsuario(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <RetosClient retos={retos} misLibros={misLibros} usuarioId={authUser.id} />
      </main>
      <Footer />
    </>
  )
}
