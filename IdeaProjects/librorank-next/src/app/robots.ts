import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ranking', '/perfil/'],
        disallow: [
          '/api/',
          '/biblioteca',
          '/home',
          '/misiones',
          '/bingo',
          '/retos',
          '/amigos',
          '/perfil',
          '/stats',
          '/diario',
          '/cuento',
          '/clubes',
          '/recomendaciones',
        ],
      },
    ],
    sitemap: 'https://librorank-next.vercel.app/sitemap.xml',
  }
}
