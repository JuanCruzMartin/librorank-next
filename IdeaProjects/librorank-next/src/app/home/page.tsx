import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerFeedAmigos } from '@/lib/dao/actividadDAO'
import { obtenerCitaAleatoria } from '@/lib/dao/citaDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedClient from './FeedClient'


export default async function HomePage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, feed, citaDelDia] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerFeedAmigos(authUser.id),
    obtenerCitaAleatoria(authUser.id),
  ])

  if (!usuario) redirect('/login')

  return (
    <>
      <Header user={usuario} />
      <main>
        <div className="container py-5">
          <div className="row g-4">
            {/* Columna Izquierda: Perfil Rápido */}
            <div className="col-lg-4">
              <div className="card p-4 text-center">
                <div className="user-avatar" style={{ width: 100, height: 100, margin: '0 auto' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={usuario.avatar_url || '/img/personajes/personaje_1.png'}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h2 className="h4 mb-1">Hola, {usuario.nombre}!</h2>
                <p className="text-muted small mb-3">@{usuario.username}</p>

                <div className="d-flex justify-content-center gap-3 mt-2">
                  <div className="text-center">
                    <div className="fw-bold text-gold">🔥 {usuario.racha_actual}</div>
                    <div className="small text-muted">Racha</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold" style={{ color: '#D4AF37' }}>⭐ {usuario.puntos}</div>
                    <div className="small text-muted">Puntos</div>
                  </div>
                </div>

                {citaDelDia && (
                  <>
                    <hr className="my-4 opacity-10" />
                    <div className="p-3 rounded text-start" style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed var(--accent-gold)' }}>
                      <p className="mb-2 text-white" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                        &ldquo;{citaDelDia.texto}&rdquo;
                      </p>
                      <div className="text-gold" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        — {citaDelDia.titulo_libro}
                      </div>
                    </div>
                  </>
                )}

                <hr className="my-4 opacity-10" />
                <Link href="/biblioteca" className="btn btn-gold w-100 mb-2">Mi Biblioteca</Link>
                <Link href="/stats" className="btn btn-outline-secondary w-100 btn-sm">Ver mis stats</Link>
              </div>
            </div>

            {/* Columna Derecha: Feed Social */}
            <div className="col-lg-8">
              <h2 className="font-title h3 mb-4">Muro de Actividad</h2>
              <FeedClient
                feedInicial={feed}
                usuarioId={authUser.id}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
