import Header from '@/components/Header'

export default function MisionesLoading() {
  return (
    <>
      <Header user={null} />
      <main>
        <div className="container py-5">
          {/* Título */}
          <div className="skel mb-2" style={{ width: 220, height: 34, borderRadius: 8 }} />
          <div className="skel mb-5" style={{ width: 160, height: 15, borderRadius: 5 }} />

          {/* Secciones de misiones */}
          {['Diarias', 'Semanales', 'Permanentes'].map(tipo => (
            <div key={tipo} className="mb-5">
              <div className="skel mb-3" style={{ width: 140, height: 20, borderRadius: 6 }} />
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: '1rem 1.25rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div className="skel" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel-dark mb-2" style={{ width: '55%', height: 15, borderRadius: 5 }} />
                    <div className="skel-dark mb-2" style={{ width: '70%', height: 11, borderRadius: 4 }} />
                    {/* Barra de progreso */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <div className="skel" style={{ width: `${30 + i * 20}%`, height: '100%', borderRadius: 99 }} />
                    </div>
                  </div>
                  <div className="skel" style={{ width: 60, height: 24, borderRadius: 6, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
