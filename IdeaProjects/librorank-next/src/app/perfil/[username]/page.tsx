import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as logroDAO from '@/lib/dao/logroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PerfilClient from '../PerfilClient'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const usuario = await usuarioDAO.buscarPorUsername(username)
  if (!usuario) return { title: 'Usuario no encontrado — LibroRank' }
  return {
    title: `@${usuario.username} — LibroRank`,
    description: usuario.bio ?? `Mirá la biblioteca de ${usuario.nombre} en LibroRank.`,
  }
}

export default async function PerfilUsernamePage({ params }: Props) {
  const { username } = await params

  const authUser = await getAuthUser()

  // Si el username es el propio usuario logueado, redirigir a /perfil
  if (authUser && authUser.username === username) {
    redirect('/perfil')
  }

  const usuarioTarget = await usuarioDAO.buscarPorUsername(username)
  if (!usuarioTarget) notFound()

  const [authUsuario, stats, ultimasLecturas, logros, leidosEsteAnio, totalLeidos] = await Promise.all([
    authUser ? usuarioDAO.buscarPorId(authUser.id) : Promise.resolve(null),
    libroDAO.obtenerStatsPorUsuario(usuarioTarget.id),
    libroDAO.obtenerUltimasLecturas(usuarioTarget.id, 5),
    logroDAO.obtenerLogrosUsuario(usuarioTarget.id),
    libroDAO.contarLeidosEsteAnio(usuarioTarget.id),
    libroDAO.contarLeidosTotal(usuarioTarget.id),
  ])

  return (
    <>
      <Header user={authUsuario} />
      <main>
        <PerfilClient
          usuario={usuarioTarget}
          stats={stats}
          ultimasLecturas={ultimasLecturas}
          logros={logros}
          leidosEsteAnio={leidosEsteAnio}
          totalLeidos={totalLeidos}
          nivelInfo={usuarioDAO.getNivelLector(usuarioTarget.puntos ?? 0)}
          esMiPerfil={false}
        />
      </main>
      <Footer />
    </>
  )
}
