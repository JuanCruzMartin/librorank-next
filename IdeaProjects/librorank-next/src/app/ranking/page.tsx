import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId, obtenerRankingLectores, getNivelLector } from '@/lib/dao/usuarioDAO'
import { obtenerIdsAmigos } from '@/lib/dao/amigoDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AgregarAmigoBtnClient } from './AgregarAmigo'

export default async function RankingPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, ranking, idsAmigos] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerRankingLectores(50),
    obtenerIdsAmigos(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <div className="container py-5">
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <h1 className="font-title display-5 mb-1">🏆 Ranking Global</h1>
              <p className="text-muted">Los lectores más épicos de LibroRank.</p>
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="table-landing w-100">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lector</th>
                    <th>⭐ Puntos</th>
                    <th>📚 Leídos</th>
                    <th>Nivel</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((u, i) => {
                    const esYo = u.id === authUser.id
                    const esAmigo = idsAmigos.includes(u.id)
                    return (
                      <tr key={u.id} className={esYo ? 'highlight' : ''}>
                        <td>
                          <span className={`rank-number ${i === 0 ? 'top-1' : ''}`}>#{i + 1}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Link href={`/perfil?id=${u.id}`} className="fw-bold text-white text-decoration-none">
                              @{u.username}
                            </Link>
                            {esYo && <span className="badge bg-warning text-dark small">Vos</span>}
                            {esAmigo && <span className="badge-cozy small">amigo</span>}
                          </div>
                          <div className="text-muted small">{u.nombre}</div>
                        </td>
                        <td className="fw-bold" style={{ color: '#D4AF37' }}>⭐ {u.puntos ?? 0}</td>
                        <td className="text-white">{u.total_leidos ?? 0} <small className="text-muted">libros</small></td>
                        <td>
                          {(() => { const n = getNivelLector(u.puntos ?? 0); return (
                            <span className="badge-cozy" title={`Nivel ${n.nivel} · ${n.puntosMin}–${n.puntosMax} pts`}>
                              {n.emoji} {n.titulo}
                            </span>
                          )})()}
                        </td>
                        <td>
                          {!esYo && !esAmigo && (
                            <AgregarAmigoBtn amigoId={u.id} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function AgregarAmigoBtn({ amigoId }: { amigoId: number }) {
  return <AgregarAmigoBtnClient amigoId={amigoId} />
}
