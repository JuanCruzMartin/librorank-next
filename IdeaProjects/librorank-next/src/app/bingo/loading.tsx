import Header from '@/components/Header'

export default function BingoLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          {/* Hero skeleton */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.1)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div className="skel mb-3" style={{ width: 200, height: 28, borderRadius: 7 }} />
            <div className="d-flex gap-3 flex-wrap">
              {[1, 2, 3].map(i => (
                <div key={i} className="skel-dark" style={{ width: 120, height: 50, borderRadius: 10 }} />
              ))}
            </div>
          </div>

          {/* Grilla 5×5 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem',
            maxWidth: 750,
            margin: '0 auto',
          }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="skel-dark"
                style={{ aspectRatio: '1', borderRadius: 12, minHeight: 80 }}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
