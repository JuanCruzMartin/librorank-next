import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import SignupClient from './SignupClient'

export default async function SignupPage() {
  const user = await getAuthUser()
  if (user) redirect('/home')
  return <SignupClient />
}
