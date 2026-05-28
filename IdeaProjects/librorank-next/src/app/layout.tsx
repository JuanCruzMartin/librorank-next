import type { Metadata } from 'next'
import './globals.css'

const BASE_URL = 'https://librorank-next.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'LibroRank — Gamifica tu hábito de lectura',
    template: '%s — LibroRank',
  },
  description:
    'Registrá tus libros, ganá puntos, completá misiones y competí con amigos. LibroRank convierte tu hábito lector en una aventura épica.',
  keywords: ['libros', 'lectura', 'ranking', 'gamificación', 'biblioteca', 'lectores', 'reseñas'],
  authors: [{ name: 'LibroRank' }],
  creator: 'LibroRank',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: BASE_URL,
    siteName: 'LibroRank',
    title: 'LibroRank — Gamifica tu hábito de lectura',
    description:
      'Registrá tus libros, ganá puntos, completá misiones y competí con amigos. LibroRank convierte tu hábito lector en una aventura épica.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LibroRank — La red social para lectores en español',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LibroRank — Gamifica tu hábito de lectura',
    description:
      'Registrá tus libros, ganá puntos y competí con amigos. La red social para lectores en español.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="/css/styles.css" />
      </head>
      <body>
        {children}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          async
        />
      </body>
    </html>
  )
}
