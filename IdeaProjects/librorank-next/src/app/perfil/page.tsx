import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as logroDAO from '@/lib/dao/logroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PerfilClient from './PerfilClient'

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const targetId = params.id ? Number(params.id) : authUser.id

  const [usuario, usuarioTarget, stats, ultimasLecturas, logros, leidosEsteAnio, totalLeidos, topGeneros, resenasPublicas] = await Promise.all([
    usuarioDAO.buscarPorId(authUser.id),
    usuarioDAO.buscarPorId(targetId),
    libroDAO.obtenerStatsPorUsuario(targetId),
    libroDAO.obtenerUltimasLecturas(targetId, 5),
    logroDAO.obtenerLogrosUsuario(targetId),
    libroDAO.contarLeidosEsteAnio(targetId),
    libroDAO.contarLeidosTotal(targetId),
    libroDAO.obtenerTopGeneros(targetId, 3),
    libroDAO.obtenerResenasPublicas(targetId, 10),
  ])

  if (!usuario || !usuarioTarget) redirect('/login')

  const esMiPerfil = targetId === authUser.id

  return (
    <>
      <Header user={usuario} />
      <main>
        <PerfilClient
          usuario={usuarioTarget}
          stats={stats}
          ultimasLecturas={ultimasLecturas}
          logros={logros}
          leidosEsteAnio={leidosEsteAnio}
          totalLeidos={totalLeidos}
          nivelInfo={usuarioDAO.getNivelLector(usuarioTarget.puntos ?? 0)}
          esMiPerfil={esMiPerfil}
          topGeneros={topGeneros}
          resenasPublicas={resenasPublicas}
        />
      </main>
      <Footer />
    </>
  )
}
