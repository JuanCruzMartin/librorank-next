import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { queryOne, execute } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://librorank-next.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    // Buscar usuario — respuesta genérica para no revelar si el email existe
    const usuario = await queryOne<{ id: number; nombre: string }>(
      'SELECT id, nombre FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    )

    if (usuario) {
      // Invalidar tokens anteriores
      await execute(
        'UPDATE password_reset_tokens SET usado=1 WHERE usuario_id=? AND usado=0',
        [usuario.id]
      )

      // Generar token seguro
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

      await execute(
        'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
        [usuario.id, token, expires]
      )

      const link = `${BASE_URL}/reset-password?token=${token}`

      await resend.emails.send({
        from: 'LibroRank <onboarding@resend.dev>',
        to: email.trim(),
        subject: '🔐 Recuperá tu contraseña — LibroRank',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#0f0d0b;font-family:'Segoe UI',sans-serif;">
            <div style="max-width:520px;margin:40px auto;background:#1a1614;border:1px solid rgba(212,175,55,0.3);border-radius:16px;overflow:hidden;">

              <div style="height:6px;background:linear-gradient(90deg,#b8860b,#d4af37,#f1c40f);"></div>

              <div style="padding:40px 36px;">
                <div style="font-size:2rem;margin-bottom:8px;">📚</div>
                <h1 style="color:#d4af37;font-size:1.4rem;margin:0 0 8px;">LibroRank</h1>
                <h2 style="color:#fff;font-size:1.1rem;font-weight:600;margin:0 0 24px;">Recuperá tu contraseña</h2>

                <p style="color:rgba(255,255,255,0.65);font-size:0.92rem;line-height:1.6;margin:0 0 28px;">
                  Hola <strong style="color:#fff;">${usuario.nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
                </p>

                <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#d4af37,#f1c40f);color:#000;font-weight:800;font-size:0.95rem;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
                  Restablecer contraseña →
                </a>

                <p style="color:rgba(255,255,255,0.35);font-size:0.78rem;line-height:1.6;margin:0 0 8px;">
                  Este link expira en <strong style="color:rgba(255,255,255,0.55);">1 hora</strong>. Si no pediste este cambio, ignorá este email — tu contraseña no cambiará.
                </p>

                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">

                <p style="color:rgba(255,255,255,0.2);font-size:0.72rem;margin:0;">
                  Si el botón no funciona, copiá este link:<br>
                  <span style="color:rgba(212,175,55,0.5);word-break:break-all;">${link}</span>
                </p>
              </div>

              <div style="height:4px;background:linear-gradient(90deg,#b8860b,#d4af37,#f1c40f);"></div>
            </div>
          </body>
          </html>
        `,
      })
    }

    // Siempre respuesta exitosa (no revelar si el email existe)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en forgot-password:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
