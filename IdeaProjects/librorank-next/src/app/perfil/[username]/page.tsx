import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import * as usuarioDAO from '@/lib/dao/usuarioDAO'
import * as libroDAO from '@/lib/dao/libroDAO'
import * as logroDAO from '@/lib/dao/logroDAO'
import * as cartaDAO from '@/lib/dao/cartaDAO'
import * as amigoDAO from '@/lib/dao/amigoDAO'
import { migrarTablaCuentos, obtenerCuentosPublicos } from '@/lib/dao/cuentoPersonalDAO'
import { calcularPersonaje } from '@/lib/personaje'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PerfilClient from '../PerfilClient'

interface Props {
  params: Promise<{ username: string }>
}

const BASE = 'https://librorank-next.vercel.app'

export async function generateMetadata({ params }: Props) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)
  const usuario = await usuarioDAO.buscarPorUsername(username)
  if (!usuario) return { title: 'Usuario no encontrado — LibroRank' }

  const title = `@${usuario.username} en LibroRank`
  const description = usuario.bio
    ? usuario.bio
    : `Mirá los libros, reseñas y colección de cartas de ${usuario.nombre} en LibroRank.`
  const url = `${BASE}/perfil/${encodeURIComponent(usuario.username)}`
  const image = usuario.avatar_url ?? `${BASE}/og-default.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'LibroRank',
      type: 'profile',
      images: [{ url: image, width: 400, height: 400, alt: usuario.nombre }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  }
}

export default async function PerfilUsernamePage({ params }: Props) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  const authUser = await getAuthUser()

  if (authUser && authUser.username === username) {
    redirect('/perfil')
  }

  const usuarioTarget = await usuarioDAO.buscarPorUsername(username)
  if (!usuarioTarget) notFound()

  await migrarTablaCuentos()

  const [authUsuario, stats, ultimasLecturas, logros, leidosEsteAnio, totalLeidos, topGeneros, resenasPublicas, paginasLeidas, librosDestacados, promedioEstrellas, totalResenas, generosDistintos, coleccionCartas, leyendoAhora, totalAmigos, cuentosPublicos] = await Promise.all([
    authUser ? usuarioDAO.buscarPorId(authUser.id) : Promise.resolve(null),
    libroDAO.obtenerStatsPorUsuario(usuarioTarget.id),
    libroDAO.obtenerUltimasLecturas(usuarioTarget.id, 5),
    logroDAO.obtenerLogrosUsuario(usuarioTarget.id),
    libroDAO.contarLeidosEsteAnio(usuarioTarget.id),
    libroDAO.contarLeidosTotal(usuarioTarget.id),
    libroDAO.obtenerTopGeneros(usuarioTarget.id, 3),
    libroDAO.obtenerResenasPublicas(usuarioTarget.id, 10),
    libroDAO.sumarPaginasLeidas(usuarioTarget.id),
    libroDAO.obtenerLibrosFavoritos(usuarioTarget.id, 8),
    libroDAO.obtenerPromedioEstrellas(usuarioTarget.id),
    libroDAO.contarResenasTotal(usuarioTarget.id),
    libroDAO.contarGenerosDistintos(usuarioTarget.id),
    cartaDAO.obtenerColeccion(usuarioTarget.id),
    libroDAO.obtenerLeyendoAhora(usuarioTarget.id),
    amigoDAO.contarAmigos(usuarioTarget.id),
    obtenerCuentosPublicos(usuarioTarget.id),
  ])

  const personaje = calcularPersonaje(
    totalLeidos,
    totalResenas,
    usuarioTarget.racha_actual ?? 0,
    generosDistintos,
  )

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
          topGeneros={topGeneros}
          resenasPublicas={resenasPublicas}
          paginasLeidas={paginasLeidas}
          librosDestacados={librosDestacados}
          promedioEstrellas={promedioEstrellas}
          personaje={personaje}
          coleccionCartas={coleccionCartas}
          leyendoAhora={leyendoAhora}
          totalAmigos={totalAmigos}
          cuentos={cuentosPublicos}
        />
      </main>
      <Footer />
    </>
  )
}
