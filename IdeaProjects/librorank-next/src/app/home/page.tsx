import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId } from '@/lib/dao/usuarioDAO'
import { obtenerFeedAmigos } from '@/lib/dao/actividadDAO'
import { obtenerCitaAleatoria } from '@/lib/dao/citaDAO'
import { obtenerLeyendoAhora, contarLeidosEsteAnio } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedClient from './FeedClient'


export default async function HomePage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const [usuario, feed, citaDelDia, librosLeyendo, leidosEsteAnio] = await Promise.all([
    buscarPorId(authUser.id),
    obtenerFeedAmigos(authUser.id),
    obtenerCitaAleatoria(authUser.id),
    obtenerLeyendoAhora(authUser.id),
    contarLeidosEsteAnio(authUser.id),
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
                    <div className="fw-bold text-gold">
                      🔥 {usuario.racha_actual}
                      {usuario.escudos_racha > 0 && (
                        <span
                          title={`${usuario.escudos_racha} escudo${usuario.escudos_racha > 1 ? 's' : ''} de racha`}
                          style={{ marginLeft: 4, fontSize: '0.85em' }}
                        >
                          {'🛡️'.repeat(usuario.escudos_racha)}
                        </span>
                      )}
                    </div>
                    <div className="small text-muted">Racha</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold" style={{ color: '#D4AF37' }}>⭐ {usuario.puntos}</div>
                    <div className="small text-muted">Puntos</div>
                  </div>
                </div>

                {/* Objetivo anual */}
                {usuario.objetivo_anual && usuario.objetivo_anual > 0 && (
                  <div className="mt-3 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Meta {new Date().getFullYear()}</span>
                      <span className="small fw-bold" style={{ color: '#d4af37' }}>
                        {leidosEsteAnio} / {usuario.objetivo_anual} 📚
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((leidosEsteAnio / usuario.objetivo_anual) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #b8860b, #d4af37, #f1c40f)',
                        borderRadius: 99,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Leyendo ahora */}
                {librosLeyendo.length > 0 && (
                  <>
                    <hr className="my-3 opacity-10" />
                    <div className="text-start">
                      <p className="small text-muted mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.8px', fontSize: '0.65rem' }}>
                        📖 Leyendo ahora
                      </p>
                      <div className="d-flex flex-column gap-2">
                        {librosLeyendo.map(libro => (
                          <div key={libro.id} className="d-flex gap-2 align-items-center">
                            {libro.portada_url ? (
                              <Image
                                src={libro.portada_url.replace('http://', 'https://')}
                                alt={libro.titulo}
                                width={32}
                                height={46}
                                style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: 32, height: 46, background: 'rgba(212,175,55,0.1)', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📚</div>
                            )}
                            <div className="text-start" style={{ minWidth: 0 }}>
                              <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.75rem' }}>{libro.titulo}</div>
                              <div className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>{libro.autor}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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
