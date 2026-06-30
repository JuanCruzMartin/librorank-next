import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const OVERRIDES_PATH = path.join(process.cwd(), 'src', 'data', 'cartas-overrides.json')

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Solo disponible en desarrollo local' }, { status: 403 })
  }

  const { id, imagen, fondo, posicionX, posicionY } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const raw = await fs.readFile(OVERRIDES_PATH, 'utf-8').catch(() => '{}')
  const overrides = JSON.parse(raw)

  overrides[id] = {
    ...(overrides[id] ?? {}),
    ...(imagen !== undefined ? { imagen } : {}),
    ...(fondo !== undefined ? { fondo } : {}),
    ...(posicionX !== undefined ? { posicionX } : {}),
    ...(posicionY !== undefined ? { posicionY } : {}),
  }

  await fs.writeFile(OVERRIDES_PATH, JSON.stringify(overrides, null, 2))

  return NextResponse.json({ ok: true })
}
