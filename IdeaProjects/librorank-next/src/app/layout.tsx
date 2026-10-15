import type { Metadata } from 'next'
import './globals.css'
import PreguntaDiariaWidget from './home/PreguntaDiariaWidget'
import ChatFab from './home/ChatFab'
import BannerSugerenciasFlotante from '@/components/BannerSugerenciasFlotante'
import OnboardingTour from '@/components/OnboardingTour'
import { getAuthUser } from '@/lib/auth'

const BASE_URL = 'https://libroranking.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'LibroRanking — Gamifica tu hábito de lectura',
    template: '%s — LibroRanking',
  },
  description:
    'Registrá tus libros, ganá puntos, completá misiones y competí con amigos. LibroRanking convierte tu hábito lector en una aventura épica.',
  keywords: ['libros', 'lectura', 'ranking', 'gamificación', 'biblioteca', 'lectores', 'reseñas'],
  authors: [{ name: 'LibroRanking' }],
  creator: 'LibroRanking',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: BASE_URL,
    siteName: 'LibroRanking',
    title: 'LibroRanking — Gamifica tu hábito de lectura',
    description:
      'Registrá tus libros, ganá puntos, completá misiones y competí con amigos. LibroRanking convierte tu hábito lector en una aventura épica.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LibroRanking — La red social para lectores en español',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LibroRanking — Gamifica tu hábito de lectura',
    description:
      'Registrá tus libros, ganá puntos y competí con amigos. La red social para lectores en español.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'QWjQkesj2J-e4TK7VuoVTk2h-Y3_5Cf91M-6q4Jgp0o',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="/css/styles.css" />
      </head>
      <body>
        {children}
        {user && (
          <>
            <OnboardingTour />
            <PreguntaDiariaWidget />
            <ChatFab />
            <BannerSugerenciasFlotante />
          </>
        )}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          async
        />
      </body>
    </html>
  )
}
