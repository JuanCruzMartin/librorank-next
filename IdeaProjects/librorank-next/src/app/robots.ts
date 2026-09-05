import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/libro/', '/perfil/', '/ranking'],
        disallow: ['/api/', '/biblioteca', '/coleccion', '/arena', '/amigos', '/cuento'],
      },
    ],
    sitemap: 'https://librorank-next.vercel.app/sitemap.xml',
  }
}
