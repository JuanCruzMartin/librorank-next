import { notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import {
  buscarPorId as buscarLibroGlobal,
  obtenerReviews,
  obtenerLectores,
  obtenerDistribucionEstrellas,
} from '@/lib/dao/libroGlobalDAO'
import { buscarPorId as buscarUsuario } from '@/lib/dao/usuarioDAO'
import { buscarPorUsuario as misLibros } from '@/lib/dao/libroDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import LibroDetalleClient from './LibroDetalleClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const libro = await buscarLibroGlobal(Number(id))
  if (!libro) return { title: 'Libro no encontrado — LibroRank' }
  return {
    title: `${libro.titulo} — LibroRank`,
    description: `Reseñas y opiniones de "${libro.titulo}" por ${libro.autor} en LibroRank.`,
  }
}

export default async function LibroPage({ params }: Props) {
  const { id } = await params
  const authUser = await getAuthUser()

  let libro, reviews, lectores, distribucion, usuario
  try {
    ;[libro, reviews, lectores, distribucion, usuario] = await Promise.all([
      buscarLibroGlobal(Number(id)),
      obtenerReviews(Number(id)),
      obtenerLectores(Number(id)),
      obtenerDistribucionEstrellas(Number(id)),
      authUser ? buscarUsuario(authUser.id) : Promise.resolve(null),
    ])
  } catch (err) {
    console.error('[LibroPage] Error en queries paralelas:', err)
    throw err
  }

  if (!libro) notFound()

  // Verificar si el usuario ya tiene este libro en su biblioteca
  let yaEnBiblioteca = false
  if (authUser) {
    try {
      const misL = await misLibros(authUser.id)
      yaEnBiblioteca = misL.some(l =>
        l.titulo.toLowerCase().trim() === (libro as NonNullable<typeof libro>).titulo.toLowerCase().trim()
      )
    } catch (err) {
      console.error('[LibroPage] Error en misLibros:', err)
    }
  }

  const notaMedia = libro.nota_media ? Math.round(Number(libro.nota_media) * 10) / 10 : null
  const totalLectores = Number(libro.total_lectores)
  const resenasConTexto = reviews.filter(r => r.resena?.trim())
  const totalCalificaciones = reviews.filter(r => Number(r.estrellas) > 0).length
  const maxDist = distribucion.reduce((max, d) => Math.max(max, Number(d.cantidad)), 1)

  const estadoColor = (estado: string) => {
    if (estado === 'LEIDO')    return { bg: '#4cd137', color: '#000', label: 'Leído' }
    if (estado === 'LEYENDO')  return { bg: '#f1c40f', color: '#000', label: 'Leyendo' }
    if (estado === 'PAUSA')    return { bg: '#5dade2', color: '#000', label: 'Pausa' }
    return { bg: 'rgba(255,255,255,0.2)', color: '#fff', label: 'Pendiente' }
  }

  return (
    <>
      <Header user={usuario} />
      <main>
        <div style={{ minHeight: '100vh' }}>

          {/* ── Hero ── */}
          <div style={{
            background: 'linear-gradient(135deg,#0a0a0a 0%,#151515 60%,#1a1208 100%)',
            borderBottom: '2px solid rgba(212,175,55,0.2)',
            padding: '3rem 0',
          }}>
            <div className="container">
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Portada */}
                <div style={{ flexShrink: 0 }}>
                  {libro.portada_url ? (
                    <img
                      src={libro.portada_url.replace('http://', 'https://')}
                      alt={libro.titulo}
                      style={{ width: 160, height: 240, objectFit: 'cover', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}
                    />
                  ) : (
                    <div style={{ width: 160, height: 240, background: '#25211e', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
                      📚
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 className="font-title" style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.3rem', lineHeight: 1.2 }}>
                    {libro.titulo}
                  </h1>
                  <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>
                    {libro.autor}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {libro.anio && (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>📅 {libro.anio}</span>
                    )}
                    {libro.paginas && (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>📄 {libro.paginas} páginas</span>
                    )}
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                      👥 {totalLectores} lector{totalLectores !== 1 ? 'es' : ''} en LibroRank
                    </span>
                  </div>

                  {/* Rating + distribución */}
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                    {notaMedia ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>
                          {notaMedia}
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', letterSpacing: 2 }}>
                            {'⭐'.repeat(Math.round(notaMedia))}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {totalCalificaciones} calificacion{totalCalificaciones !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                        Sin calificaciones aún
                      </div>
                    )}

                    {/* Distribución de estrellas */}
                    {distribucion.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
                        {[5, 4, 3, 2, 1].map(n => {
                          const d = distribucion.find(x => Number(x.estrellas) === n)
                          const cant = Number(d?.cantidad ?? 0)
                          const pct = Math.round((cant / maxDist) * 100)
                          return (
                            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', width: 14, textAlign: 'right' }}>{n}</span>
                              <span style={{ fontSize: '0.65rem' }}>⭐</span>
                              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#b8860b,#d4af37)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', width: 18 }}>{cant > 0 ? cant : ''}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Botón agregar — client component para interactividad */}
                  {authUser ? (
                    <LibroDetalleClient
                      libroGlobalId={libro.id}
                      titulo={libro.titulo}
                      autor={libro.autor}
                      portadaUrl={libro.portada_url}
                      anio={libro.anio}
                      paginas={libro.paginas}
                      yaEnBiblioteca={yaEnBiblioteca}
                    />
                  ) : (
                    <Link href="/login" style={{
                      display: 'inline-block', textDecoration: 'none',
                      padding: '0.6rem 1.6rem', borderRadius: 10,
                      background: 'linear-gradient(135deg,#d4af37,#f1c40f)',
                      fontWeight: 700, fontSize: '0.9rem', color: '#000',
                    }}>
                      + Agregar a mi biblioteca
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="container py-5">
            <div className="row g-5">

              {/* ── Lectores ── */}
              {lectores.length > 0 && (
                <div className="col-lg-4">
                  <h2 className="font-title h5 mb-3" style={{ color: '#fff' }}>
                    👥 Quiénes lo leyeron
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {lectores.map(l => {
                      const ec = estadoColor(l.estado)
                      return (
                        <Link key={l.username} href={`/perfil/${l.username}`}
                          className="lector-row"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', padding: '0.6rem 0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          {l.avatar_url ? (
                            <img src={l.avatar_url} alt={l.username} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).src = '/img/personajes/personaje_1.png' }} />
                          ) : (
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📚</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>@{l.username}</div>
                            {l.estrellas > 0 && (
                              <div style={{ fontSize: '0.6rem', letterSpacing: 1 }}>{'⭐'.repeat(l.estrellas)}</div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.58rem', fontWeight: 700, background: ec.bg, color: ec.color, borderRadius: 99, padding: '2px 6px', flexShrink: 0 }}>
                            {ec.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Reseñas ── */}
              <div className={lectores.length > 0 ? 'col-lg-8' : 'col-12'}>
                <h2 className="font-title h5 mb-1" style={{ color: '#fff' }}>
                  ✍️ Reseñas de la comunidad
                </h2>
                <p className="text-muted small mb-4">
                  {resenasConTexto.length > 0
                    ? `${resenasConTexto.length} reseña${resenasConTexto.length !== 1 ? 's' : ''} de lectores de LibroRank`
                    : 'Nadie escribió una reseña todavía.'}
                </p>

                {resenasConTexto.length === 0 ? (
                  <div className="card p-5 text-center">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <p className="text-muted mb-3">Sé el primero en dejar tu opinión.</p>
                    <Link href="/biblioteca" className="btn-gold" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.5rem 1.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
                      Ir a mi biblioteca
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {resenasConTexto.map((r, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 14, padding: '1.1rem 1.25rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <Link href={`/perfil/${r.username}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}>
                            @{r.username}
                          </Link>
                          {r.estrellas > 0 && (
                            <span style={{ fontSize: '0.8rem', letterSpacing: 1.5 }}>{'⭐'.repeat(r.estrellas)}</span>
                          )}
                        </div>
                        <p style={{
                          margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)',
                          fontStyle: 'italic', lineHeight: 1.7,
                          borderLeft: '2px solid rgba(212,175,55,0.3)',
                          paddingLeft: '0.85rem',
                        }}>
                          &ldquo;{r.resena}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
      <style>{`.lector-row:hover { background: rgba(255,255,255,0.07) !important; }`}</style>
      <Footer />
    </>
  )
}
