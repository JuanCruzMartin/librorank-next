import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as logroDAO from '@/lib/dao/logroDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import { calcularPersonaje } from '@/lib/personaje'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PerfilClient from './PerfilClient'

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const targetId = params.id ? Number(params.id) : authUser.id

  const [usuario, usuarioTarget, stats, ultimasLecturas, logros, leidosEsteAnio, totalLeidos, topGeneros, resenasPublicas, paginasLeidas, librosDestacados, promedioEstrellas, totalResenas, generosDistintos, coleccionCartas, leyendoAhora] = await Promise.all([
    usuarioDAO.buscarPorId(authUser.id),
    usuarioDAO.buscarPorId(targetId),
    libroDAO.obtenerStatsPorUsuario(targetId),
    libroDAO.obtenerUltimasLecturas(targetId, 5),
    logroDAO.obtenerLogrosUsuario(targetId),
    libroDAO.contarLeidosEsteAnio(targetId),
    libroDAO.contarLeidosTotal(targetId),
    libroDAO.obtenerTopGeneros(targetId, 3),
    libroDAO.obtenerResenasPublicas(targetId, 10),
    libroDAO.sumarPaginasLeidas(targetId),
    libroDAO.obtenerLibrosFavoritos(targetId, 8),
    libroDAO.obtenerPromedioEstrellas(targetId),
    libroDAO.contarResenasTotal(targetId),
    libroDAO.contarGenerosDistintos(targetId),
    cartaDAO.obtenerColeccion(targetId),
    libroDAO.obtenerLeyendoAhora(targetId),
  ])

  if (!usuario || !usuarioTarget) redirect('/login')

  const esMiPerfil = targetId === authUser.id
  const personaje = calcularPersonaje(
    totalLeidos,
    totalResenas,
    usuarioTarget.racha_actual ?? 0,
    generosDistintos,
  )

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
          paginasLeidas={paginasLeidas}
          librosDestacados={librosDestacados}
          promedioEstrellas={promedioEstrellas}
          personaje={personaje}
          coleccionCartas={coleccionCartas}
          leyendoAhora={leyendoAhora}
        />
      </main>
      <Footer />
    </>
  )
}
