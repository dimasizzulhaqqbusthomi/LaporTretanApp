'use client'

import { useEffect, useRef } from 'react'

interface InteractiveMapProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

export default function InteractiveMap({ lat, lng, onChange }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Default coordinate (Bangkalan center)
  const defaultLat = -7.025
  const defaultLng = 112.74

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically load leaflet and its styles
    let isMounted = true
    let L: any = null

    const initMap = async () => {
      // Import leaflet dynamically
      L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (!isMounted) return

      // Fix default marker icon assets
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      const centerLat = lat || defaultLat
      const centerLng = lng || defaultLng

      // Create map
      const map = L.map(mapRef.current).setView([centerLat, centerLng], 14)
      mapInstanceRef.current = map

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map)

      // Add draggable marker
      const marker = L.marker([centerLat, centerLng], { draggable: true }).addTo(map)
      markerRef.current = marker

      // Handle marker drag end
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        onChange(position.lat, position.lng)
      })

      // Handle map click
      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        marker.setLatLng([clickLat, clickLng])
        onChange(clickLat, clickLng)
      })
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map view and marker when coordinates change externally (e.g. from GPS photo)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !lat || !lng) return

    const newLatLng = [lat, lng]
    markerRef.current.setLatLng(newLatLng)
    mapInstanceRef.current.setView(newLatLng, 16, { animate: true })
  }, [lat, lng])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapRef} className="w-full h-64 z-10" />
      <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-500 shadow border border-slate-100/50">
        📍 Geser pin atau ketuk peta untuk mengubah lokasi
      </div>
    </div>
  )
}
