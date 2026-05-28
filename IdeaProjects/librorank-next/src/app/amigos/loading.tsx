import Header from '@/components/Header'

export default function AmigosLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          {/* Tabs */}
          <div className="d-flex gap-2 mb-4">
            <div className="skel"      style={{ width: 150, height: 44, borderRadius: 10 }} />
            <div className="skel-dark" style={{ width: 170, height: 44, borderRadius: 10 }} />
          </div>

          {/* Cards de usuarios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14,
                  padding: '1.25rem',
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="skel-circle" style={{ width: 48, height: 48 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel-dark mb-1" style={{ width: '65%', height: 15, borderRadius: 5 }} />
                    <div className="skel-dark"    style={{ width: '45%', height: 11, borderRadius: 4 }} />
                  </div>
                </div>
                <div className="skel-dark mb-3" style={{ width: '80%', height: 11, borderRadius: 4 }} />
                <div className="skel" style={{ width: '100%', height: 36, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
