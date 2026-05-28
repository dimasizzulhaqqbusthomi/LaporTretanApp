'use client'

import dynamic from 'next/dynamic'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'

// Dynamically import the actual map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./ReportMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
      <p className="text-xs font-bold text-slate-400">Memuat peta...</p>
    </div>
  ),
})

interface ReportMapProps {
  latitude: number | null
  longitude: number | null
  address?: string | null
  title?: string | null
}

export default function ReportMap({ latitude, longitude, address, title }: ReportMapProps) {
  if (!latitude || !longitude) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-500">Lokasi tidak tersedia</p>
        <p className="text-xs text-slate-400 mt-1">Pelapor tidak melampirkan koordinat GPS</p>
      </div>
    )
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`

  return (
    <div className="space-y-3">
      {/* Interactive Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <MapInner latitude={latitude} longitude={longitude} address={address} title={title} />
        <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm border border-slate-100 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-700">Lokasi Kejadian</span>
        </div>
      </div>

      {/* Coordinates + Navigation */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Koordinat GPS</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-100 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latitude</p>
            <p className="text-sm font-black text-slate-800 font-mono">{latitude.toFixed(6)}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Longitude</p>
            <p className="text-sm font-black text-slate-800 font-mono">{longitude.toFixed(6)}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black py-2.5 rounded-xl transition-colors"
          >
            <Navigation className="w-3 h-3" />
            Navigasi Waze
          </a>
        </div>
      </div>
    </div>
  )
}
