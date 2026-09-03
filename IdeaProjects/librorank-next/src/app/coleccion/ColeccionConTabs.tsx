'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ColeccionClient from './ColeccionClient'
import IntercambiosClient from '../intercambios/IntercambiosClient'

const SS_INTERCAMBIOS = 'lr_banner_intercambios_visto'

interface Amigo { id: number; nombre: string; avatar: string | null }

interface Props {
  coleccion: string[]
  cantidades: Record<string, number>
  tiradas: number
  usuarioId: number
  amigos: Amigo[]
  tabInicial: 'coleccion' | 'intercambios'
}

const TABS = [
  { id: 'coleccion',    label: '🎴 Mi Colección' },
  { id: 'intercambios', label: '🔄 Intercambios' },
] as const

type Tab = typeof TABS[number]['id']

export default function ColeccionConTabs({ coleccion, cantidades, tiradas, usuarioId, amigos, tabInicial }: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial)
  const [bannerVisible, setBannerVisible] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!sessionStorage.getItem(SS_INTERCAMBIOS)) {
      setBannerVisible(true)
    }
  }, [])

  function cambiarTab(t: Tab) {
    setTab(t)
    if (t === 'intercambios') {
      sessionStorage.setItem(SS_INTERCAMBIOS, '1')
      setBannerVisible(false)
    }
    const url = t === 'intercambios' ? `${pathname}?tab=intercambios` : pathname
    router.replace(url, { scroll: false })
  }

  function cerrarBanner() {
    setBannerVisible(false)
    sessionStorage.setItem(SS_INTERCAMBIOS, '1')
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, padding: '0.75rem 1rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => cambiarTab(t.id)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: '0.85rem',
              background: tab === t.id
                ? 'rgba(139,92,246,0.2)'
                : 'transparent',
              color: tab === t.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
              borderBottom: tab === t.id
                ? '2px solid #7c3aed'
                : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Banner de descubrimiento — solo en pestaña colección */}
      {tab === 'coleccion' && bannerVisible && (
        <div style={{
          margin: '0.75rem 1rem 0',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)',
          border: '1px solid rgba(139,92,246,0.35)',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          position: 'relative',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔄</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, color: '#c4b5fd', fontWeight: 700, fontSize: '0.85rem' }}>
              ¿Tenés cartas duplicadas?
            </p>
            <p style={{ margin: '0.15rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.4 }}>
              Podés intercambiarlas con tus amigos y completar tu colección más rápido.
            </p>
          </div>
          <button
            onClick={() => cambiarTab('intercambios')}
            style={{
              padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            Ver intercambios →
          </button>
          <button
            onClick={cerrarBanner}
            style={{
              position: 'absolute', top: 8, right: 10,
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      {/* Contenido */}
      {tab === 'coleccion' && (
        <ColeccionClient coleccion={coleccion} cantidades={cantidades} tiradas={tiradas} />
      )}
      {tab === 'intercambios' && (
        <IntercambiosClient
          usuarioId={usuarioId}
          miColeccion={coleccion}
          amigos={amigos}
        />
      )}
    </div>
  )
}
