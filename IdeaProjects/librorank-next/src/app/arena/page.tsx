import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { crearTabla, obtenerSala, obtenerDueloActivo, obtenerHistorial, expirarDuelos, obtenerStatsGlobales, obtenerStatsPorRival } from '@/lib/dao/dueloDAO'
import { migrarLigasArena, obtenerEstadoLiga, obtenerRankingTodasLigas } from '@/lib/dao/ligaArenaDAO'
import { LIGAS_ARENA } from '@/lib/ligasArena'
import { obtenerColeccion } from '@/lib/dao/cartaDAO'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'
import { obtenerRetosActivos } from '@/lib/dao/retoDAO'
import { obtenerBingo } from '@/lib/dao/bingoDAO'
import { buscarPorUsuario } from '@/lib/dao/libroDAO'
import { CARTAS } from '@/lib/cartas'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArenaConTabs from './ArenaConTabs'

export const metadata = { title: 'Arena — LibroRank' }

type Tab = 'arena' | 'misiones' | 'retos' | 'bingo'

export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const params = await searchParams
  const tabParam = params.tab
  const tabInicial: Tab = (tabParam === 'misiones' || tabParam === 'retos' || tabParam === 'bingo') ? tabParam : 'arena'

  await crearTabla()
  await expirarDuelos()
  await migrarLigasArena()

  const [usuario, sala, activo, historial, coleccion, stats, statsPorRival, misiones, retos, bingo, misLibros, estadoLiga] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerSala(),
    obtenerDueloActivo(authUser.id),
    obtenerHistorial(authUser.id, 5),
    obtenerColeccion(authUser.id),
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
        />
      </main>
      <Footer />
    </>
  )
}
