import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne, execute } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Buscar token válido (no usado, no expirado)
    const resetToken = await queryOne<{ id: number; usuario_id: number }>(
      `SELECT id, usuario_id FROM password_reset_tokens
       WHERE token=? AND usado=0 AND expires_at > NOW()`,
      [token]
    )

    if (!resetToken) {
      return NextResponse.json({ error: 'El link es inválido o ya expiró. Pedí uno nuevo.' }, { status: 400 })
    }

    // Actualizar contraseña
    const hash = await bcrypt.hash(password, 12)
    await execute('UPDATE usuarios SET password_hash=? WHERE id=?', [hash, resetToken.usuario_id])

    // Marcar token como usado
    await execute('UPDATE password_reset_tokens SET usado=1 WHERE id=?', [resetToken.id])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en reset-password:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
