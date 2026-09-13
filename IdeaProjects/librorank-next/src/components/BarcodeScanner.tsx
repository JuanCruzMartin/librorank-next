'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface Props {
  onDetected: (isbn: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const detectedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current!,
      (result, err) => {
        if (result && !detectedRef.current) {
          const text = result.getText()
          // ISBNs son EAN-13 que empiezan con 978 o 979
          if (/^97[89]\d{10}$/.test(text)) {
            detectedRef.current = true
            setScanning(false)
            reader.reset()
            onDetected(text)
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn('Scanner error:', err)
        }
      }
    ).catch(e => {
      const msg = String(e?.message || e)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Necesitás dar permiso para usar la cámara.')
      } else if (msg.includes('NotFound') || msg.includes('Requested device')) {
        setError('No se encontró ninguna cámara trasera disponible.')
      } else {
        setError('No se pudo acceder a la cámara. Probá en otro navegador.')
      }
    })

    return () => {
      reader.reset()
    }
  }, [onDetected])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ color: '#d4af37', fontWeight: 800, fontSize: '1rem' }}>📷 Escanear código de barras</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 2 }}>
              Apuntá la cámara al código de barras del libro
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Visor de cámara */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#111' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', display: 'block', maxHeight: '60vh', objectFit: 'cover' }}
            playsInline
            muted
          />

          {/* Guía de escaneo */}
          {scanning && !error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{
                width: '75%', height: 90,
                border: '2px solid #d4af37',
                borderRadius: 8,
                boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)',
                position: 'relative',
              }}>
                {/* Esquinas animadas */}
                {['topleft','topright','bottomleft','bottomright'].map(pos => (
                  <div key={pos} style={{
                    position: 'absolute',
                    width: 18, height: 18,
                    borderColor: '#f1c40f',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    ...(pos.includes('top') ? { top: -2 } : { bottom: -2 }),
                    ...(pos.includes('left') ? { left: -2 } : { right: -2 }),
                    ...(pos.includes('top') && pos.includes('left') ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 } : {}),
                    ...(pos.includes('top') && pos.includes('right') ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 } : {}),
                    ...(pos.includes('bottom') && pos.includes('left') ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 } : {}),
                    ...(pos.includes('bottom') && pos.includes('right') ? { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 } : {}),
                  }} />
                ))}
                {/* Línea de escaneo animada */}
                <div style={{
                  position: 'absolute', left: 4, right: 4, height: 2,
                  background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                  animation: 'scan-line 1.8s ease-in-out infinite',
                }} />
              </div>
            </div>
          )}

          {/* Estado: buscando */}
          {scanning && !error && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
              Buscando código de barras...
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: 10, padding: '0.85rem 1rem',
            color: '#e74c3c', fontSize: '0.85rem', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '1rem', width: '100%',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '0.7rem',
            fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 6px; }
          50% { top: calc(100% - 8px); }
          100% { top: 6px; }
        }
      `}</style>
    </div>
  )
}
