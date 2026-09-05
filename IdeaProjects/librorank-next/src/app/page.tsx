import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { obtenerRankingLectores, getNivelLector } from '@/lib/dao/usuarioDAO'
import { obtenerMasLeidos } from '@/lib/dao/libroGlobalDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AppPreview from '@/components/AppPreview'

export default async function LandingPage() {
  const user = await getAuthUser()
  if (user) redirect('/home')

  const [top3, masLeidos] = await Promise.all([
    obtenerRankingLectores(3),
    obtenerMasLeidos(12),
  ])

  return (
    <>
      <Header user={null} />
      <main>

        {/* ── HERO ── */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <div style={{
                display: 'inline-block',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.35)',
                borderRadius: 99,
                padding: '0.3rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#d4af37',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}>
                📚 La red social para lectores en español
              </div>
              <h1>Tu biblioteca personal,<br /><span>gamificada al máximo.</span></h1>
              <p style={{ maxWidth: 560, margin: '1rem auto 2rem', opacity: 0.75 }}>
                Registrá cada libro, ganá puntos, completá misiones y competí con amigos.
                LibroRank convierte tu hábito lector en una aventura épica.
              </p>
              <div className="hero-btns">
                <Link href="/signup" className="btn-main text-decoration-none">Empezar gratis →</Link>
                <Link href="#mas-leidos" className="btn-secondary text-decoration-none">Ver libros populares</Link>
              </div>

              {/* Señales de credibilidad */}
              <div style={{
                marginTop: '2.5rem',
                display: 'flex',
                gap: '2rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {[
                  { valor: '100%', label: 'Gratis' },
                  { valor: '12', label: 'Niveles de lector' },
                  { valor: '25', label: 'Desafíos de bingo' },
                  { valor: '∞', label: 'Libros por registrar' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d4af37', lineHeight: 1 }}>{s.valor}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── LIBROS MÁS LEÍDOS ── */}
        {masLeidos.length > 0 && (
          <div id="mas-leidos" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '3rem 0' }}>
            <div className="container">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  En la comunidad ahora
                </p>
                <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                  Los libros más leídos
                </h2>
              </div>
              <style>{`
                .libros-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
                @media (max-width: 768px) { .libros-grid { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 480px) { .libros-grid { grid-template-columns: repeat(3, 1fr); } }
              `}</style>
              <div className="libros-grid">
                {masLeidos.map(libro => {
                  const nota = libro.nota_media ? Math.round(Number(libro.nota_media) * 10) / 10 : null
                  return (
                    <Link key={libro.id} href={`/libro/${libro.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '2/3', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                        className="libro-landing-card">
                        <img
                          src={libro.portada_url!.replace('http://', 'https://')}
                          alt={libro.titulo}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div className="libro-landing-overlay">
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>
                            {libro.titulo.length > 40 ? libro.titulo.slice(0, 38) + '…' : libro.titulo}
                          </p>
                          {nota && <span style={{ fontSize: '0.6rem', color: '#d4af37' }}>⭐ {nota}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link href="/ranking" style={{ color: '#d4af37', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                  Ver ranking completo →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="container" id="mas-info">

          {/* ── ¿QUÉ INCLUYE? ── */}
          <section style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 className="fw-bold text-white" style={{ fontSize: '2rem' }}>Todo lo que un lector necesita</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem' }}>
                Una plataforma completa, sin nada de relleno.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              <style>{`
                .feature-tile { transition: transform 0.2s, border-color 0.2s; }
                .feature-tile:hover { transform: translateY(-4px); }
                .libro-landing-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
                .libro-landing-card:hover { transform: scale(1.04); box-shadow: 0 8px 32px rgba(212,175,55,0.25) !important; }
                .libro-landing-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); padding: 0.5rem 0.4rem 0.4rem; opacity: 0; transition: opacity 0.2s; }
                .libro-landing-card:hover .libro-landing-overlay { opacity: 1; }
              `}</style>
              {[
                {
                  icon: '📚',
                  titulo: 'Biblioteca personal',
                  desc: 'Registrá portadas, estado (leyendo/leído/pendiente), reseñas, estrellas y géneros. Todo en un solo lugar.',
                  color: '#4a9e7a',
                },
                {
                  icon: '🏆',
                  titulo: 'Ranking y ligas',
                  desc: 'Competí en ligas Bronce, Plata, Oro y Diamante según tus puntos. Subí de posición cada vez que leés.',
                  color: '#d4af37',
                },
                {
                  icon: '🎯',
                  titulo: 'Misiones diarias',
                  desc: 'Misiones mensuales, semanales y permanentes con recompensas en puntos. Siempre hay un objetivo nuevo.',
                  color: '#e91e8c',
                },
                {
                  icon: '🎲',
                  titulo: 'Bingo literario',
                  desc: '25 casillas con desafíos de lectura (un clásico, un libro de más de 500 páginas...). ¡Completá líneas y ganá!',
                  color: '#f39c12',
                },
                {
                  icon: '⚔️',
                  titulo: 'Retos con amigos',
                  desc: 'Desafiá a tus amigos a leer un libro o alcanzar una meta antes de una fecha. El primero en llegar gana.',
                  color: '#e74c3c',
                },
                {
                  icon: '📊',
                  titulo: 'Estadísticas anuales',
                  desc: 'Tu "Wrapped" literario: géneros favoritos, autores más leídos, mes más activo y tu libro del año.',
                  color: '#5dade2',
                },
                {
                  icon: '👥',
                  titulo: 'Comunidad',
                  desc: 'Seguí lectores, mirá su actividad en tu feed, descubrí qué están leyendo tus amigos ahora mismo.',
                  color: '#af7ac5',
                },
                {
                  icon: '🎖️',
                  titulo: 'Logros y trofeos',
                  desc: 'Más de 20 logros desbloqueables: primer libro, maratón de lectura, crítico experto, y muchos más.',
                  color: '#27ae60',
                },
                {
                  icon: '✍️',
                  titulo: 'Diario de lectura',
                  desc: 'Anotá citas, reflexiones y tu progreso página a página. Tu cuaderno de notas integrado en la plataforma.',
                  color: '#8e44ad',
                },
              ].map(f => (
                <div key={f.titulo} className="feature-tile" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${f.color}30`,
                  borderRadius: 14,
                  padding: '1.4rem',
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{f.icon}</div>
                  <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{f.titulo}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── PREVIEW DE LA APP ── */}
          <AppPreview />

          {/* ── ¿CÓMO FUNCIONA? ── */}
          <section id="como-funciona" style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 className="fw-bold text-white" style={{ fontSize: '2rem' }}>Así de simple</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem' }}>Empezás a ganar puntos desde el primer libro.</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
            }}>
              {[
                {
                  paso: '01',
                  titulo: 'Creá tu cuenta',
                  desc: 'Gratis, sin tarjeta. En menos de un minuto ya tenés tu perfil de lector.',
                  icon: '👤',
                },
                {
                  paso: '02',
                  titulo: 'Agregá tus libros',
                  desc: 'Buscá por título, seleccioná del catálogo de Google Books y organizá tu biblioteca.',
                  icon: '📚',
                },
                {
                  paso: '03',
                  titulo: 'Ganá puntos',
                  desc: 'Cada libro leído, reseña escrita o misión cumplida te da puntos y te sube en el ranking.',
                  icon: '⭐',
                },
                {
                  paso: '04',
                  titulo: 'Subí de nivel',
                  desc: 'De "Nuevo Lector" a "Oráculo Eterno" — hay 12 niveles para conquistar.',
                  icon: '🏆',
                },
              ].map((p, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 16,
                  padding: '1.75rem 1.5rem',
                  position: 'relative',
                  textAlign: 'center',
                }}>
                  <div style={{
                    position: 'absolute', top: -1, left: -1,
                    background: 'linear-gradient(135deg,#b8860b,#d4af37)',
                    borderRadius: '16px 0 12px 0',
                    padding: '0.2rem 0.7rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: '#000',
                    letterSpacing: 1,
                  }}>
                    {p.paso}
                  </div>
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>{p.icon}</div>
                  <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{p.titulo}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: 1.55, margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SALÓN DE LA FAMA ── */}
          <section style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 className="fw-bold text-white" style={{ fontSize: '2rem', margin: 0 }}>🏆 Salón de la Fama</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>Los lectores más dedicados de la plataforma.</p>
              </div>
              <Link href="/ranking" style={{ color: '#d4af37', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                Ver ranking completo →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {top3.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                  Aún no hay datos de ranking. ¡Sé el primero!
                </div>
              ) : top3.map((u, i) => {
                const nivel = getNivelLector(u.puntos ?? 0)
                const medallaColor = i === 0 ? '#d4af37' : i === 1 ? '#c0c0c0' : '#cd7f32'
                const medallaEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
                return (
                  <div key={u.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: i === 0
                      ? 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14,
                    padding: '1rem 1.25rem',
                  }}>
                    <span style={{ fontSize: '1.8rem', width: 40, textAlign: 'center', flexShrink: 0 }}>{medallaEmoji}</span>
                    <img
                      src={u.avatar_url || '/default-avatar.svg'}
                      alt={u.username}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${medallaColor}`, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>@{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{nivel.emoji} {nivel.titulo}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: '#d4af37', fontSize: '1.1rem' }}>⭐ {u.puntos ?? 0}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>puntos</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── CTA FINAL ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 20,
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📖</div>
              <h2 className="fw-bold text-white" style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>
                ¿Cuántos libros llevás este año?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 460, margin: '0 auto 2rem', lineHeight: 1.6 }}>
                Registrá tu biblioteca, ganate un lugar en el ranking y descubrí qué están leyendo tus amigos.
              </p>
              <Link href="/signup" className="btn-main text-decoration-none" style={{ fontSize: '1.05rem', padding: '0.8rem 2.5rem' }}>
                Crear mi cuenta gratis
              </Link>
              <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                Sin tarjeta de crédito · Sin publicidades · 100% gratis
              </p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}

