import { redirect } from 'next/navigation'

export default async function DesafiosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab === 'retos' ? 'retos' : params.tab === 'bingo' ? 'bingo' : 'misiones'
  redirect(`/arena?tab=${tab}`)
}
