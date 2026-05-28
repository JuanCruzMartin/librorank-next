import Header from '@/components/Header'

function S({ w = '100%', h = 16, r = 8, className = '' }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return (
    <div
      className={`skel ${className}`}
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }}
    />
  )
}

export default function HomeLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          <div className="row g-4">

            {/* ── Columna izquierda: perfil rápido ── */}
            <div className="col-lg-4">
              <div className="card p-4 text-center">
                {/* Avatar */}
                <div className="skel-circle" style={{ width: 100, height: 100, margin: '0 auto 1rem' }} />
                {/* Nombre */}
                <S w="60%" h={20} r={6} className="mx-auto mb-2" />
                <S w="40%" h={14} r={6} className="mx-auto mb-4" />

                {/* Stats */}
                <div className="d-flex justify-content-center gap-4">
                  <div className="text-center">
                    <S w={48} h={22} r={6} className="mx-auto mb-1" />
                    <S w={40} h={12} r={4} className="mx-auto" />
                  </div>
                  <div className="text-center">
                    <S w={48} h={22} r={6} className="mx-auto mb-1" />
                    <S w={40} h={12} r={4} className="mx-auto" />
                  </div>
                </div>

                <hr className="my-4 opacity-10" />

                {/* Cita del día */}
                <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px dashed rgba(212,175,55,0.2)', borderRadius: 10, padding: '1rem' }}>
                  <S w="100%" h={13} r={4} className="mb-2" />
                  <S w="85%"  h={13} r={4} className="mb-2" />
                  <S w="50%"  h={11} r={4} />
                </div>

                <hr className="my-4 opacity-10" />
                <S w="100%" h={40} r={8} className="mb-2" />
                <S w="100%" h={32} r={8} />
              </div>
            </div>

            {/* ── Columna derecha: feed ── */}
            <div className="col-lg-8">
              <S w={200} h={28} r={6} className="mb-4" />
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="card mb-3 p-3"
                  style={{ borderLeft: '4px solid rgba(212,175,55,0.15)' }}
                >
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="skel-circle" style={{ width: 40, height: 40 }} />
                    <div style={{ flex: 1 }}>
                      <S w="35%" h={14} r={4} className="mb-1" />
                      <S w="20%" h={11} r={4} />
                    </div>
                  </div>
                  <S w="100%" h={13} r={4} className="mb-2" />
                  <S w="70%"  h={13} r={4} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </>
  )
}
