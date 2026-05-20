import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerBingo } from '@/lib/dao/bingoDAO'
import { buscarPorUsuario } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BingoClient from './BingoClient'

export default async function BingoPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, bingo, misLibros] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerBingo(authUser.id),
    buscarPorUsuario(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <BingoClient bingo={bingo} misLibros={misLibros} />
      </main>
      <Footer />
    </>
  )
}
