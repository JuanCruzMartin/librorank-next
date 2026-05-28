import Header from '@/components/Header'

function S({ w = '100%', h = 16, r = 8, className = '' }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return <div className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
}

export default function BibliotecaLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        {/* Library header skeleton */}
        <div className="library-header">
          <div className="container text-center">
            <S w={280} h={36} r={8} className="mx-auto mb-3" />
            <S w={180} h={16} r={6} className="mx-auto mb-4" />
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  background: 'rgba(212,175,55,0.05)',
                  border: '1px solid rgba(212,175,55,0.1)',
                  borderRadius: 12,
                  padding: '0.75rem 1.25rem',
                  minWidth: 90,
                }}>
                  <div className="skel mx-auto mb-1" style={{ width: 40, height: 22, borderRadius: 6 }} />
                  <div className="skel mx-auto"    style={{ width: 55, height: 11, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container pb-5">
          {/* Filtros skeleton */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {[80, 100, 90, 85, 95].map((w, i) => (
              <div key={i} className="skel-dark" style={{ width: w, height: 34, borderRadius: 20 }} />
            ))}
          </div>

          {/* Grid de libros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-2">
                {/* Portada */}
                <div className="skel-dark" style={{ aspectRatio: '2/3', borderRadius: 8, marginBottom: 10 }} />
                <S w="90%" h={13} r={4} className="mb-1" />
                <S w="65%" h={11} r={4} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
