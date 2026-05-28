import React from 'react'
import Header from '@/components/Header'

function S({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
}
function SD({ w = '100%', h = 16, r = 8, style }: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) {
  return <div className="skel-dark" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
}

export default function PerfilLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          <div className="perfil-layout">

            {/* ── Sidebar ── */}
            <aside className="perfil-side">
              <div className="card p-4 text-center">
                {/* Avatar */}
                <div className="skel-circle" style={{ width: 140, height: 140, margin: '0 auto 1.5rem' }} />
                {/* Nombre */}
                <S w="70%" h={28} r={8} className="mx-auto mb-2" />
                <SD w="45%" h={15} r={6} className="mx-auto mb-3" />
                {/* Badge nivel */}
                <S w={130} h={28} r={50} className="mx-auto mb-4" />
                {/* Stats row */}
                <div className="d-flex justify-content-center gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="text-center">
                      <SD w={36} h={20} r={5} style={{ marginBottom: 4 }} />
                      <SD w={50} h={11} r={4} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio card */}
              <div className="card p-4">
                <S w={80} h={16} r={5} className="mb-3" />
                <SD w="100%" h={13} r={4} className="mb-2" />
                <SD w="80%"  h={13} r={4} className="mb-2" />
                <SD w="60%"  h={13} r={4} />
              </div>
            </aside>

            {/* ── Main ── */}
            <section>
              {/* Últimas lecturas */}
              <div className="card p-4 mb-4">
                <S w={180} h={20} r={6} className="mb-4" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="d-flex gap-3 mb-3 align-items-center">
                    <SD w={44} h={64} r={6} />
                    <div style={{ flex: 1 }}>
                      <SD w="60%" h={14} r={5} style={{ marginBottom: 6 }} />
                      <SD w="40%" h={11} r={4} style={{ marginBottom: 6 }} />
                      <SD w="30%" h={11} r={4} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Logros */}
              <div className="card p-4">
                <S w={120} h={20} r={6} className="mb-4" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skel-dark" style={{ height: 110, borderRadius: 14 }} />
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  )
}
