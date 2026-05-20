import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { registrar, buscarPorEmailOUsername } from '@/lib/dao/usuarioDAO'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, usuario: username, email, password, password2 } = body

    if (!nombre || !username || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (password !== password2) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const existing = await buscarPorEmailOUsername(email) || await buscarPorEmailOUsername(username)
    if (existing) {
      return NextResponse.json({ error: 'El email o usuario ya está registrado' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const ok = await registrar({ nombre, username, email, password_hash, avatar_url: '/img/personajes/personaje_1.png' })

    if (!ok) {
      return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 })
    }

    const nuevo = await buscarPorEmailOUsername(email)
    if (!nuevo) return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })

    await setAuthCookie({
      id: nuevo.id,
      username: nuevo.username,
      nombre: nuevo.nombre,
      email: nuevo.email,
      avatarUrl: nuevo.avatar_url,
    })

    return NextResponse.json({ ok: true, redirect: '/home' })
  } catch (err) {
    console.error('Error en signup:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
