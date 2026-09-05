import { MetadataRoute } from 'next'
import { obtenerTodosParaSitemap } from '@/lib/dao/libroGlobalDAO'
import { query } from '@/lib/db'

const BASE = 'https://librorank-next.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [libros, usuarios] = await Promise.all([
    obtenerTodosParaSitemap(),
    query<{ username: string }>(`SELECT username FROM usuarios WHERE username IS NOT NULL LIMIT 2000`),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const libroRoutes: MetadataRoute.Sitemap = libros.map(l => ({
    url: `${BASE}/libro/${l.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const perfilRoutes: MetadataRoute.Sitemap = usuarios.map(u => ({
    url: `${BASE}/perfil/${encodeURIComponent(u.username)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...libroRoutes, ...perfilRoutes]
}
