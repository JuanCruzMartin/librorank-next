import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return new Response('No autorizado', { status: 401 })

    const uid = user.id
    const anio = new Date().getFullYear()

    const [resumen, generos, mejorLibro] = await Promise.all([
      queryOne<{ total: number; paginas: number; promedio: number }>(`
        SELECT COUNT(*) AS total,
               COALESCE(SUM(paginas), 0) AS paginas,
               COALESCE(ROUND(AVG(NULLIF(estrellas, 0)), 1), 0) AS promedio
        FROM libros_usuario
        WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO') AND YEAR(fecha_registro)=?
      `, [uid, anio]),

      query<{ genero: string; total: number }>(`
        SELECT genero, COUNT(*) AS total FROM libros_usuario
        WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')
          AND genero IS NOT NULL AND genero != '' AND YEAR(fecha_registro)=?
        GROUP BY genero ORDER BY total DESC LIMIT 1
      `, [uid, anio]),

      queryOne<{ titulo: string; autor: string }>(`
        SELECT titulo, autor FROM libros_usuario
        WHERE usuario_id=? AND UPPER(estado) IN ('LEIDO','LEÍDO')
          AND estrellas=5 AND YEAR(fecha_registro)=?
        ORDER BY fecha_registro DESC LIMIT 1
      `, [uid, anio]),
    ])

    const totalLibros = resumen?.total ?? 0
    const totalPaginas = (resumen?.paginas ?? 0).toLocaleString('es-AR')
    const promedio = resumen?.promedio ?? 0
    const generoFav = generos[0]?.genero ?? null

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0f0d0b',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Barra dorada superior */}
          <div style={{ height: 10, background: 'linear-gradient(90deg,#b8860b,#d4af37,#f1c40f)', width: '100%', display: 'flex' }} />

          {/* Cuerpo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 80px', gap: 0 }}>

            {/* Encabezado */}
            <div style={{ fontSize: 18, letterSpacing: 8, textTransform: 'uppercase', color: 'rgba(212,175,55,0.65)', marginBottom: 10, display: 'flex' }}>
              TU AÑO EN LIBROS
            </div>
            <div style={{ fontSize: 130, fontWeight: 900, color: '#d4af37', lineHeight: 1, marginBottom: 18, display: 'flex' }}>
              {anio}
            </div>
            <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.45)', marginBottom: 64, display: 'flex' }}>
              @{user.username}
            </div>

            {/* Stats principales */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 40, width: '100%' }}>
              {[
                { valor: String(totalLibros), label: 'LIBROS\nLEÍDOS', color: '#d4af37', bg: 'rgba(212,175,55,0.08)' },
                { valor: totalPaginas,        label: 'PÁGINAS\nLEÍDAS', color: '#4cd137', bg: 'rgba(76,209,55,0.08)' },
                { valor: promedio > 0 ? `${promedio} ★` : '—', label: 'RATING\nPROMEDIO', color: '#f39c12', bg: 'rgba(243,156,18,0.08)' },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: s.bg,
                  border: `1.5px solid ${s.color}40`,
                  borderRadius: 20, padding: '32px 20px', flex: 1, gap: 10,
                }}>
                  <div style={{ fontSize: 62, fontWeight: 900, color: s.color, lineHeight: 1, display: 'flex' }}>{s.valor}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, textAlign: 'center', display: 'flex', whiteSpace: 'pre' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Fila inferior: género + mejor libro */}
            <div style={{ display: 'flex', gap: 20, width: '100%' }}>

              {/* Género favorito */}
              {generoFav && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(212,175,55,0.06)',
                  border: '1.5px solid rgba(212,175,55,0.3)',
                  borderRadius: 20, padding: '28px 32px', flex: 1, gap: 10,
                }}>
                  <div style={{ fontSize: 13, color: 'rgba(212,175,55,0.6)', letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
                    GÉNERO FAVORITO
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', textAlign: 'center', display: 'flex' }}>{generoFav}</div>
                </div>
              )}

              {/* Mejor libro */}
              {mejorLibro && (
                <div style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '28px 32px', flex: generoFav ? 1 : 2, gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
                    MEJOR LIBRO
                  </div>
                  <div style={{ fontSize: 22, display: 'flex' }}>⭐⭐⭐⭐⭐</div>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: '#fff', display: 'flex',
                    overflow: 'hidden',
                    maxWidth: '100%',
                  }}>
                    {mejorLibro.titulo.length > 30 ? mejorLibro.titulo.slice(0, 28) + '…' : mejorLibro.titulo}
                  </div>
                  <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>{mejorLibro.autor}</div>
                </div>
              )}

              {/* Si no hay datos: mensaje motivador */}
              {!generoFav && !mejorLibro && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(212,175,55,0.04)',
                  border: '1.5px dashed rgba(212,175,55,0.2)',
                  borderRadius: 20, padding: '32px', flex: 1, gap: 12,
                }}>
                  <div style={{ fontSize: 48, display: 'flex' }}>📚</div>
                  <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', display: 'flex' }}>
                    ¡El año recién empieza!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '22px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid rgba(212,175,55,0.12)',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#d4af37', display: 'flex' }}>📚 LibroRank</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>librorank-next.vercel.app</div>
          </div>

          {/* Barra dorada inferior */}
          <div style={{ height: 10, background: 'linear-gradient(90deg,#b8860b,#d4af37,#f1c40f)', width: '100%', display: 'flex' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  } catch (err) {
    console.error('Error generando wrapped image:', err)
    return new Response('Error interno', { status: 500 })
  }
}
