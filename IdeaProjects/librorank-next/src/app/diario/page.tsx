import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId as buscarUsuario } from '@/lib/dao/usuarioDAO'
import { buscarPorId as buscarLibro, buscarPorUsuario } from '@/lib/dao/libroDAO'
import { obtenerPorLibro as obtenerEntradas } from '@/lib/dao/diarioDAO'
import { obtenerPorLibro as obtenerCitas } from '@/lib/dao/citaDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DiarioClient from './DiarioClient'

export default async function DiarioPage({ searchParams }: { searchParams: Promise<{ libroId?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const libroId = params.libroId ? Number(params.libroId) : null

  const [usuario, misLibros] = await Promise.all([
    buscarUsuario(authUser.id),
    buscarPorUsuario(authUser.id),
  ])

  if (!usuario) redirect('/login')

  let libro = null
  let entradas: Awaited<ReturnType<typeof obtenerEntradas>> = []
  let citas: Awaited<ReturnType<typeof obtenerCitas>> = []

  if (libroId) {
    ;[libro, entradas, citas] = await Promise.all([
      buscarLibro(libroId, authUser.id),
      obtenerEntradas(libroId, authUser.id),
      obtenerCitas(libroId, authUser.id),
    ])
  }

  return (
    <>
      <Header user={usuario} />
      <main>
        <DiarioClient
          libro={libro}
          entradas={entradas}
          citas={citas}
          misLibros={misLibros}
          libroIdActual={libroId}
        />
      </main>
      <Footer />
    </>
  )
}
