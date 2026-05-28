import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta gratis',
  description: 'Unite a LibroRank gratis. Registrá tus libros, ganá puntos y competí con lectores de toda América Latina.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
