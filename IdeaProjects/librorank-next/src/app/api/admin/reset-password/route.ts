import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne, execute } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { secret, email, newPassword } = await req.json()

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!email || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Email y contraseña (mín. 6 chars) requeridos' }, { status: 400 })
  }

  const usuario = await queryOne<{ id: number; email: string }>(
    'SELECT id, email FROM usuarios WHERE email = ?',
    [email.trim().toLowerCase()]
  )

  if (!usuario) {
    return NextResponse.json({ error: 'No existe un usuario con ese email' }, { status: 404 })
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, usuario.id])

  return NextResponse.json({ ok: true, mensaje: `Contraseña actualizada para ${email}` })
}
