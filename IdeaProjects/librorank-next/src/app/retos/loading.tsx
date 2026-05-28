import Header from '@/components/Header'

export default function RetosLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          {/* Hero */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.1)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <div className="skel mb-2" style={{ width: 180, height: 28, borderRadius: 7 }} />
              <div className="skel-dark" style={{ width: 240, height: 14, borderRadius: 5 }} />
            </div>
            <div className="skel" style={{ width: 130, height: 40, borderRadius: 10 }} />
          </div>

          {/* Retos activos */}
          <div className="skel mb-3" style={{ width: 150, height: 18, borderRadius: 5 }} />
          {[1, 2].map(i => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="skel-circle" style={{ width: 44, height: 44 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel-dark mb-1" style={{ width: '50%', height: 15, borderRadius: 5 }} />
                  <div className="skel-dark"    style={{ width: '30%', height: 11, borderRadius: 4 }} />
                </div>
                <div className="skel" style={{ width: 80, height: 26, borderRadius: 20 }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div className="skel" style={{ width: `${40 + i * 25}%`, height: '100%', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
