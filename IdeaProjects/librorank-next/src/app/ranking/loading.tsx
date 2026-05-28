import Header from '@/components/Header'

function S({ w = '100%', h = 16, r = 8, className = '' }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return <div className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
}

export default function RankingLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          {/* Título */}
          <S w={260} h={36} r={8} className="mb-2" />
          <S w={200} h={16} r={6} className="mb-5" />

          {/* Tabs skeleton */}
          <div className="d-flex gap-2 mb-4">
            {[120, 100, 110].map((w, i) => (
              <div key={i} className="skel-dark" style={{ width: w, height: 38, borderRadius: 10 }} />
            ))}
          </div>

          {/* Filas de ranking */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: i < 3 ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i < 3 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 14,
                padding: '0.9rem 1.25rem',
                marginBottom: '0.6rem',
              }}
            >
              {/* Número */}
              <div className="skel" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
              {/* Avatar */}
              <div className="skel-circle" style={{ width: 44, height: 44 }} />
              {/* Nombre y nivel */}
              <div style={{ flex: 1 }}>
                <div className="skel-dark mb-1" style={{ width: '40%', height: 15, borderRadius: 5 }} />
                <div className="skel-dark"    style={{ width: '25%', height: 11, borderRadius: 4 }} />
              </div>
              {/* Puntos */}
              <div className="skel" style={{ width: 72, height: 22, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
