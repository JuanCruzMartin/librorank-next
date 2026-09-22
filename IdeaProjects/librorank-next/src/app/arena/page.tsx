import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { crearTabla, obtenerSala, obtenerDueloActivo, obtenerHistorial, expirarDuelos, obtenerStatsGlobales, obtenerStatsPorRival } from '@/lib/dao/dueloDAO'
import { migrarLigasArena, obtenerEstadoLiga, obtenerRankingTodasLigas } from '@/lib/dao/ligaArenaDAO'
import { LIGAS_ARENA } from '@/lib/ligasArena'
import { obtenerColeccion, obtenerCantidades, obtenerTiradas, migrarCantidadCartas } from '@/lib/dao/cartaDAO'
import { obtenerAmigos } from '@/lib/dao/amigoDAO'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'
import { obtenerRetosActivos } from '@/lib/dao/retoDAO'
import { obtenerBingo } from '@/lib/dao/bingoDAO'
import { buscarPorUsuario } from '@/lib/dao/libroDAO'
import { CARTAS } from '@/lib/cartas'
import { ITEMS_TIENDA } from '@/lib/tienda'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArenaConTabs from './ArenaConTabs'

export const metadata = { title: 'Arena — LibroRank' }

type Tab = 'arena' | 'misiones' | 'retos' | 'bingo' | 'coleccion'

export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ tab?: string; ctab?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const tabParam = params.tab
  const ctabParam = params.ctab
  const tabInicial: Tab =
    tabParam === 'misiones' ? 'misiones' :
    tabParam === 'retos'    ? 'retos'    :
    tabParam === 'bingo'    ? 'bingo'    :
    tabParam === 'coleccion'? 'coleccion':
    'arena'

  await crearTabla()
  await expirarDuelos()
  await migrarLigasArena()
  await migrarCantidadCartas()

  const [usuario, sala, activo, historial, coleccion, cantidades, tiradas, amigos, stats, statsPorRival, misiones, retos, bingo, misLibros, estadoLiga] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerSala(),
    obtenerDueloActivo(authUser.id),
    obtenerHistorial(authUser.id, 5),
    obtenerColeccion(authUser.id),
    obtenerCantidades(authUser.id),
    obtenerTiradas(authUser.id),
    obtenerAmigos(authUser.id),
    obtenerStatsGlobales(authUser.id),
    obtenerStatsPorRival(authUser.id),
    obtenerMisionesConProgreso(authUser.id),
    obtenerRetosActivos(authUser.id),
    obtenerBingo(authUser.id),
    buscarPorUsuario(authUser.id),
    obtenerEstadoLiga(authUser.id),
  ])

  const rankingLiga = await obtenerRankingTodasLigas(10)

  if (!usuario) redirect('/login')

  const salaFiltrada = sala.filter(d => d.retador_id !== authUser.id)
  const cartasMap = Object.fromEntries(CARTAS.map(c => [c.id, c]))
  const misCartas = CARTAS.filter(c => coleccion.includes(c.id))

  return (
    <>
      <Header user={usuario} />
      <main>
        <ArenaConTabs
          tabInicial={tabInicial}
          ctabInicial={
            ctabParam === 'intercambios' ? 'intercambios' :
            ctabParam === 'tienda'       ? 'tienda'       :
            'coleccion'
          }
          usuarioId={authUser.id}
          salaInicial={salaFiltrada}
          dueloActivoInicial={activo}
          historialInicial={historial}
          misCartas={misCartas}
          cartasMap={cartasMap}
          statsIniciales={stats}
          statsPorRivalIniciales={statsPorRival}
          misiones={misiones}
          puntos={usuario.puntos ?? 0}
          retos={retos}
          bingo={bingo}
          misLibros={misLibros}
          estadoLiga={estadoLiga}
          rankingLiga={rankingLiga}
          todasLasLigas={LIGAS_ARENA}
          coleccion={coleccion}
          cantidades={cantidades}
          tiradas={tiradas}
          itemsTienda={ITEMS_TIENDA}
          amigos={amigos.map(a => ({ id: a.id, nombre: a.nombre, avatar: a.avatar_url ?? null }))}
        />
      </main>
      <Footer />
    </>
  )
}
