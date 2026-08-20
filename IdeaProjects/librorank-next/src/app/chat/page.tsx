import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerAmigos } from '@/lib/dao/amigoDAO'
import { crearTabla, obtenerConversaciones } from '@/lib/dao/mensajeDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatClient from './ChatClient'

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ con?: string }> }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  await crearTabla()

  const params = await searchParams
  const conId = params.con ? Number(params.con) : null

  const [usuario, amigos, conversaciones] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerAmigos(authUser.id),
    obtenerConversaciones(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <ChatClient
          usuarioId={authUser.id}
          amigos={amigos.map(a => ({ id: a.id, nombre: a.nombre, username: a.username, avatar_url: a.avatar_url ?? null }))}
          conversacionesIniciales={conversaciones}
          conIdInicial={conId}
        />
      </main>
      <Footer />
    </>
  )
}
