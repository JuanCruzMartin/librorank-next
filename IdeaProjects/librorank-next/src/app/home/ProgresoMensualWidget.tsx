'use client'

const MESES = ['E','F','M','A','M','J','J','A','S','O','N','D']
const MESES_FULL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface Props {
  datos: { mes: number; total: number }[]
  anio: number
}

export default function ProgresoMensualWidget({ datos, anio }: Props) {
  const mesActual = new Date().getMonth() + 1
  const totales = Array.from({ length: 12 }, (_, i) => {
    const d = datos.find(d => d.mes === i + 1)
    return d?.total ?? 0
  })
  const max = Math.max(...totales, 1)
  const totalAnio = totales.reduce((a, b) => a + b, 0)

  if (totalAnio === 0) return null

  return (
    <div className="card p-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          Progreso {anio}
        </span>
        <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.85rem' }}>
          {totalAnio} libro{totalAnio !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 56 }}>
        {totales.map((val, i) => {
          const mes = i + 1
          const esActual = mes === mesActual
          const esFuturo = mes > mesActual
          const barHeight = val > 0 ? Math.round((val / max) * 48) + 8 : 4

          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div
                title={`${MESES_FULL[i]}: ${val} libro${val !== 1 ? 's' : ''}`}
                style={{
                  width: '100%',
                  height: barHeight,
                  borderRadius: 3,
                  background: esActual
                    ? 'linear-gradient(180deg, #f1c40f, #b8860b)'
                    : esFuturo || val === 0
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(212,175,55,0.35)',
                  border: esActual ? '1px solid rgba(212,175,55,0.6)' : 'none',
                  cursor: 'default',
                  transition: 'opacity 0.15s',
                }}
              />
              <span style={{
                fontSize: 9,
                lineHeight: 1,
                color: esActual ? '#d4af37' : 'rgba(255,255,255,0.25)',
                fontWeight: esActual ? 700 : 400,
              }}>
                {MESES[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
