import { redirect } from 'next/navigation'

export default async function ColeccionPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const subtab = params.tab
  const dest = subtab && subtab !== 'coleccion'
    ? `/arena?tab=coleccion&ctab=${subtab}`
    : '/arena?tab=coleccion'
  redirect(dest)
}
