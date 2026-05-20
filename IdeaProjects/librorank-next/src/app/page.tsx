import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { obtenerRankingLectores, getNivelLector } from '@/lib/dao/usuarioDAO'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function LandingPage() {
  const user = await getAuthUser()
  if (user) redirect('/home')

  const top3 = await obtenerRankingLectores(3)

  return (
    <>
      <Header user={null} />
      <main>

        {/* ── HERO ── */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1>Tu hábito de lectura <span>ahora es un juego.</span></h1>
              <p>La plataforma definitiva para lectores. Registra tus libros, compite con amigos y alcanza la cima del ranking literario.</p>
              <div className="hero-btns">
                <Link href="/signup" className="btn-main text-decoration-none">Crea tu cuenta gratis</Link>
                <Link href="#mas-info" className="btn-secondary text-decoration-none">Explorar más</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <div className="container" id="mas-info">
          <div className="features-grid mb-5 pb-5">
            <div className="feature-card">
              <span className="feature-icon">📜</span>
              <h3>Crónica Personal</h3>
              <p>Lleva un registro detallado de cada mundo que visitas a través de las páginas.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🏆</span>
              <h3>Logros Legendarios</h3>
              <p>Desbloquea trofeos únicos a medida que devoras capítulos y completas desafíos.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🏛️</span>
              <h3>Comunidad</h3>
              <p>Mídete con los mejores lectores y escala posiciones en el ranking legendario.</p>
            </div>
          </div>

          {/* ── SALÓN DE LA FAMA ── */}
          <div className="mb-5 pb-5">
            <div className="d-flex justify-content-between align-items-end mb-5">
              <div>
                <h2 className="display-5 fw-bold text-white m-0">Salón de la Fama</h2>
                <p className="text-muted m-0 mt-2">Los lectores más dedicados.</p>
              </div>
              <Link href="/ranking" className="text-gold fw-bold text-decoration-none pb-2">Ver todo el ranking →</Link>
            </div>

            <div className="table-responsive">
              <table className="table-landing w-100">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Lector</th>
                    <th>Libros</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {top3.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted py-5">Aún no hay datos de ranking.</td></tr>
                  ) : top3.map((u, i) => (
                    <tr key={u.id}>
                      <td><span className={`rank-number ${i === 0 ? 'top-1' : ''}`}>#{i + 1}</span></td>
                      <td className="fw-bold fs-5 text-white">{u.username}</td>
                      <td className="fw-bold" style={{ color: '#D4AF37' }}>⭐ {u.puntos ?? 0}</td>
                      <td>{(() => { const n = getNivelLector(u.puntos ?? 0); return <span className="badge-cozy">{n.emoji} {n.titulo}</span> })()}</td>
                    </tr>
                  ))}
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
