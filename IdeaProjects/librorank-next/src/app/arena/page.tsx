import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { crearTabla, obtenerSala, obtenerDueloActivo, obtenerHistorial, expirarDuelos, obtenerStatsGlobales, obtenerStatsPorRival } from '@/lib/dao/dueloDAO'
import { obtenerColeccion } from '@/lib/dao/cartaDAO'
import { CARTAS } from '@/lib/cartas'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArenaClient from './ArenaClient'

export default async function ArenaPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  await crearTabla()
  await expirarDuelos()

  const [usuario, sala, activo, historial, coleccion, stats, statsPorRival] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerSala(),
    obtenerDueloActivo(authUser.id),
    obtenerHistorial(authUser.id, 5),
    obtenerColeccion(authUser.id),
    obtenerStatsGlobales(authUser.id),
    obtenerStatsPorRival(authUser.id),
  ])

  if (!usuario) redirect('/login')

  const salaFiltrada = sala.filter(d => d.retador_id !== authUser.id)
  const cartasMap = Object.fromEntries(CARTAS.map(c => [c.id, c]))
  const misCartas = CARTAS.filter(c => coleccion.includes(c.id))

  return (
    <>
      <Header user={usuario} />
      <main>
        <div className="container py-5">
          <ArenaClient
            usuarioId={authUser.id}
            salaInicial={salaFiltrada}
            dueloActivoInicial={activo}
            historialInicial={historial}
            misCartas={misCartas}
            cartasMap={cartasMap}
            statsIniciales={stats}
            statsPorRivalIniciales={statsPorRival}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
