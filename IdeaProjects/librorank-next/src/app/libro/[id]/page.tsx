import { notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { buscarPorId as buscarLibroGlobal, obtenerReviews } from '@/lib/dao/libroGlobalDAO'
import { buscarPorId as buscarUsuario } from '@/lib/dao/usuarioDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

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

  const [libro, reviews, usuario] = await Promise.all([
    buscarLibroGlobal(Number(id)),
    obtenerReviews(Number(id)),
    authUser ? buscarUsuario(authUser.id) : Promise.resolve(null),
  ])

  if (!libro) notFound()

  const notaMedia = libro.nota_media ? Math.round(libro.nota_media * 10) / 10 : null
  const resenasConTexto = reviews.filter(r => r.resena && r.resena.trim())

  return (
    <>
      <Header user={usuario} />
      <main>
        <div style={{ minHeight: '100vh' }}>

          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg,#0a0a0a 0%,#151515 60%,#1a1208 100%)',
            borderBottom: '2px solid rgba(212,175,55,0.2)',
            padding: '3rem 0',
          }}>
            <div className="container">
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Portada */}
                <div style={{ flexShrink: 0 }}>
                  {libro.portada_url ? (
                    <img
                      src={libro.portada_url.replace('http://', 'https://')}
                      alt={libro.titulo}
                      style={{ width: 140, height: 210, objectFit: 'cover', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    />
                  ) : (
                    <div style={{ width: 140, height: 210, background: '#25211e', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      📚
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 className="font-title" style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.25rem', lineHeight: 1.2 }}>
                    {libro.titulo}
                  </h1>
                  <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1rem' }}>
                    {libro.autor}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {libro.anio && (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>📅 {libro.anio}</span>
                    )}
                    {libro.paginas && (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>📄 {libro.paginas} páginas</span>
                    )}
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                      👥 {libro.total_lectores} lector{libro.total_lectores !== 1 ? 'es' : ''} en LibroRank
                    </span>
                  </div>

                  {/* Rating */}
                  {notaMedia && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>
                        {notaMedia}
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', letterSpacing: 2 }}>
                          {'⭐'.repeat(Math.round(notaMedia))}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                          promedio de {reviews.filter(r => r.estrellas > 0).length} calificaciones
                        </div>
                      </div>
                    </div>
                  )}

                  <Link href="/biblioteca" className="btn-gold" style={{
                    display: 'inline-block', textDecoration: 'none',
                    padding: '0.55rem 1.5rem', borderRadius: 10,
                    fontWeight: 700, fontSize: '0.88rem',
                  }}>
                    + Agregar a mi biblioteca
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Reseñas */}
          <div className="container py-5">
            <h2 className="font-title h4 mb-1" style={{ color: '#fff' }}>
              ✍️ Reseñas de la comunidad
            </h2>
            <p className="text-muted small mb-4">
              {resenasConTexto.length > 0
                ? `${resenasConTexto.length} reseña${resenasConTexto.length !== 1 ? 's' : ''} de lectores de LibroRank`
                : 'Aún nadie escribió una reseña de este libro.'}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {resenasConTexto.map((r, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <Link href={`/perfil/${r.username}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}>
                        @{r.username}
                      </Link>
                      {r.estrellas > 0 && (
                        <span style={{ fontSize: '0.8rem', letterSpacing: 1.5 }}>{'⭐'.repeat(r.estrellas)}</span>
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)',
                      fontStyle: 'italic', lineHeight: 1.7,
                      borderLeft: '2px solid rgba(212,175,55,0.3)',
                      paddingLeft: '0.75rem',
                    }}>
                      &ldquo;{r.resena}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
