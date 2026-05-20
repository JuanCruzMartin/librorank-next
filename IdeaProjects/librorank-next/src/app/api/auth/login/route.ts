import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { buscarPorEmailOUsername, actualizarPasswordHash } from '@/lib/dao/usuarioDAO'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identificador, password } = body

    if (!identificador || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const usuario = await buscarPorEmailOUsername(identificador)
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    const hash = usuario.password_hash ?? ''
    let valid = false

    if (hash.startsWith('$2')) {
      valid = await bcrypt.compare(password, hash)
    } else {
      // Contraseña en texto plano — migrar a bcrypt
      if (hash === password) {
        valid = true
        const nuevoHash = await bcrypt.hash(password, 12)
        await actualizarPasswordHash(usuario.id, nuevoHash)
      }
    }

    if (!valid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    await setAuthCookie({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      email: usuario.email,
      avatarUrl: usuario.avatar_url,
    })

    return NextResponse.json({ ok: true, redirect: '/home' })
  } catch (err) {
    console.error('Error en login:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
