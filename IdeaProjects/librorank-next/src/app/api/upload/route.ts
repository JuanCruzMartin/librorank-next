import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest, setAuthCookie } from '@/lib/auth'
import { actualizarAvatarUrl, buscarPorId } from '@/lib/dao/usuarioDAO'

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('foto') as File | null

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo es demasiado grande (máx 5MB)' }, { status: 400 })
    }

    let avatarUrl: string

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob')
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `usuarios/${user.id}-${Date.now()}.${ext}`
      const blob = await put(filename, file, { access: 'public' })
      avatarUrl = blob.url
    } else {
      // Fallback para desarrollo: usa una URL de placeholder
      avatarUrl = `/img/usuarios/${user.id}.jpg`
    }

    await actualizarAvatarUrl(user.id, avatarUrl)

    const actualizado = await buscarPorId(user.id)
    if (actualizado) {
      await setAuthCookie({
        id: actualizado.id,
        username: actualizado.username,
        nombre: actualizado.nombre,
        email: actualizado.email,
        avatarUrl: actualizado.avatar_url,
      })
    }

    return NextResponse.json({ ok: true, avatarUrl })
  } catch (err) {
    console.error('Error subiendo foto:', err)
    return NextResponse.json({ error: 'Error al subir la foto' }, { status: 500 })
  }
}
