'use client'

import { useEffect, useRef } from 'react'
import type { PerfilStats } from '@/lib/dao/libroDAO'

interface Props {
  generos: Record<string, number>
  moods: Record<string, number>
  paginas: number
  autorMasLeido: string
  mejorCalificado: string
  stats: PerfilStats
}

export default function StatsClient({ generos, moods, paginas, autorMasLeido, mejorCalificado, stats }: Props) {
  const chartGenero = useRef<HTMLCanvasElement>(null)
  const chartMood = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js' as never).catch(() => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js'
      document.head.appendChild(script)
      script.onload = renderCharts
    })

    function renderCharts() {
      const Chart = ((window as unknown) as { Chart: new (...args: unknown[]) => unknown }).Chart
      if (!Chart) return

      const baseOpts = {
        responsive: true,
        plugins: { legend: { labels: { color: '#e0d9d5' } } },
      }

      if (chartGenero.current && Object.keys(generos).length > 0) {
        new Chart(chartGenero.current, {
          type: 'doughnut',
          data: {
            labels: Object.keys(generos),
            datasets: [{ data: Object.values(generos), backgroundColor: ['#d4af37','#4cd137','#ff5e57','#5dade2','#af7ac5','#52be80','#f39c12'] }],
          },
          options: baseOpts,
        })
      }

      if (chartMood.current && Object.keys(moods).length > 0) {
        new Chart(chartMood.current, {
          type: 'bar',
          data: {
            labels: Object.keys(moods),
            datasets: [{ label: 'Libros', data: Object.values(moods), backgroundColor: 'rgba(212,175,55,0.6)', borderColor: '#d4af37', borderWidth: 1 }],
          },
          options: { ...baseOpts, scales: { y: { ticks: { color: '#e0d9d5' } }, x: { ticks: { color: '#e0d9d5' } } } },
        })
      }
    }

    const timer = setTimeout(renderCharts, 500)
    return () => clearTimeout(timer)
  }, [generos, moods])

  return (
    <div className="container py-5">
      <h1 className="font-title display-5 mb-5">📊 Mis Estadísticas</h1>

      <div className="row g-4 mb-5">
        {[
          { label: 'Total libros', value: stats.total, icon: '📚' },
          { label: 'Libros leídos', value: stats.leidos, icon: '✅' },
          { label: 'Páginas leídas', value: paginas.toLocaleString(), icon: '📄' },
          { label: 'Autor favorito', value: autorMasLeido, icon: '✍️' },
          { label: 'Mejor libro', value: mejorCalificado, icon: '⭐' },
          { label: 'Leyendo ahora', value: stats.leyendo, icon: '📖' },
        ].map(s => (
          <div key={s.label} className="col-sm-6 col-md-4">
            <div className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card p-4">
            <h5 className="font-title mb-4">Por Género</h5>
            {Object.keys(generos).length > 0 ? (
              <canvas ref={chartGenero} />
            ) : (
              <p className="text-muted">No hay datos de géneros aún.</p>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-4">
            <h5 className="font-title mb-4">Por Mood</h5>
            {Object.keys(moods).length > 0 ? (
              <canvas ref={chartMood} />
            ) : (
              <p className="text-muted">No hay datos de mood aún.</p>
            )}
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" async />
    </div>
  )
}
