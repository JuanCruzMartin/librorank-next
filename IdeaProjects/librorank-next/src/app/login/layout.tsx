import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Ingresá a tu cuenta de LibroRank y continuá tu aventura lectora.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
