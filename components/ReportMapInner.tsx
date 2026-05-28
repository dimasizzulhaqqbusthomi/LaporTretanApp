'use client'

import { useEffect, useRef } from 'react'

interface Props {
  latitude: number
  longitude: number
  address?: string | null
  title?: string | null
}

export default function ReportMapInner({ latitude, longitude, address, title }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    let isUnmounted = false
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      if (isUnmounted) return
      if (!mapRef.current) return
      if (mapInstanceRef.current) return

      // Double check if the DOM node has already been initialized by Leaflet
      const container = mapRef.current
      if (container.classList.contains('leaflet-container')) {
        return
      }

      // Fix default marker icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(container, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([latitude, longitude]).addTo(map)

      if (title || address) {
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.6;max-width:180px;padding:2px;">
            ${title ? `<strong style="color:#1e293b;display:block;margin-bottom:2px;">${title}</strong>` : ''}
            ${address ? `<span style="color:#64748b;">${address}</span>` : ''}
          </div>`
        ).openPopup()
      }

      mapInstanceRef.current = map
    })

    return () => {
      isUnmounted = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, title, address])

  return <div ref={mapRef} className="w-full h-56" />
}
