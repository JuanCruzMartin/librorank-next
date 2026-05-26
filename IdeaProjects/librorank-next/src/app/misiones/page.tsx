import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { obtenerMisionesConProgreso } from '@/lib/dao/misionDAO'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import MisionesClient from './MisionesClient'

export default async function MisionesPage() {
  const auth = await getAuthUser()
  if (!auth) redirect('/login')

  const [misiones, usuario] = await Promise.all([
    obtenerMisionesConProgreso(auth.id),
    buscarPorId(auth.id),
  ])

  return <MisionesClient misionesIniciales={misiones} puntos={usuario?.puntos ?? 0} />
}
