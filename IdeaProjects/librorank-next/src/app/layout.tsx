import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LibroRank — Gamifica tu hábito de lectura',
  description: 'La plataforma definitiva para lectores. Registra tus libros, compite con amigos y alcanza la cima del ranking literario.',
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
