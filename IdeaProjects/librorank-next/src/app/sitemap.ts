import type { MetadataRoute } from 'next'
import { obtenerRankingLectores } from '@/lib/dao/usuarioDAO'

const BASE = 'https://librorank-next.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas públicas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE}/login`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/signup`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // Perfiles públicos de usuarios
  try {
    const usuarios = await obtenerRankingLectores(100)
    const perfilRoutes: MetadataRoute.Sitemap = usuarios.map(u => ({
      url: `${BASE}/perfil/${u.username}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    return [...staticRoutes, ...perfilRoutes]
  } catch {
    return staticRoutes
  }
}
