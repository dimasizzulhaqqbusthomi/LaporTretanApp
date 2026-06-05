'use client'

import { useEffect, useRef } from 'react'
import { Report } from '@/lib/types'
import { getStatusLabel } from '@/lib/utils'

interface Props {
  reports: Report[]
}

export default function BangkalanReportsMapInner({ reports }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersGroupRef = useRef<any>(null)

  useEffect(() => {
    let isUnmounted = false
    if (!mapRef.current) return

    let L: any = null

    // Load leaflet dynamically to prevent SSR issues
    const loadMap = async () => {
      L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (isUnmounted || !mapRef.current) return

      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Check if map is already initialized
      if (mapInstanceRef.current) return

      // Bangkalan Center coordinates
      const defaultLat = -7.025
      const defaultLng = 112.74

      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Create a layer group for markers to manage updates easily
      const markersGroup = L.layerGroup().addTo(map)
      markersGroupRef.current = markersGroup

      mapInstanceRef.current = map

      // Render markers for reports
      updateMarkers(L)
    }

    loadMap()

    return () => {
      isUnmounted = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersGroupRef.current = null
      }
    }
  }, [])

  // Update markers whenever the reports list changes (due to filtering, searching, etc.)
  useEffect(() => {
    if (mapInstanceRef.current) {
      import('leaflet').then((L) => {
        updateMarkers(L)
      })
    }
  }, [reports])

  function updateMarkers(L: any) {
    if (!markersGroupRef.current || !mapInstanceRef.current) return

    // Clear previous markers
    markersGroupRef.current.clearLayers()

    // Filter reports with valid coordinates
    const reportsWithCoordinates = reports.filter(
      (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
    )

    reportsWithCoordinates.forEach((report) => {
      const lat = report.latitude!
      const lng = report.longitude!

      // Select pin color based on status
      let statusColor = '#3b82f6' // verified / default blue
      if (report.status === 'completed') statusColor = '#10b981' // green
      else if (report.status === 'in_progress') statusColor = '#f97316' // orange
      else if (report.status === 'waiting_verification') statusColor = '#eab308' // amber/yellow
      else if (report.status === 'rejected') statusColor = '#ef4444' // red
      else if (report.status === 'need_evidence') statusColor = '#d97706' // dark amber
      else if (report.status === 'assigned') statusColor = '#8b5cf6' // purple

      // Custom colored dot marker
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${statusColor}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); pointer-events: none;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(markersGroupRef.current)

      // Premium Popup
      const statusLabel = getStatusLabel(report.status)
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.5; padding: 2px; max-width: 220px;">
          ${report.photo_urls && report.photo_urls.length > 0
            ? `<div style="margin-bottom: 8px; border-radius: 8px; overflow: hidden; height: 85px; background-color: #f1f5f9;">
                 <img src="${report.photo_urls[0]}" style="width: 100%; height: 100%; object-fit: cover;" />
               </div>`
            : ''
          }
          <div style="margin-bottom: 6px;">
            <span style="font-size: 8px; font-weight: 800; color: white; background-color: ${statusColor}; padding: 2.5px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${statusLabel}
            </span>
          </div>
          <strong style="color: #0f172a; display: block; font-size: 13px; font-weight: 800; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${report.title}
          </strong>
          <div style="color: #64748b; font-size: 11px; display: flex; align-items: center; gap: 4px; margin-bottom: 2px; font-weight: 600;">
            📂 ${report.category_name}
          </div>
          <div style="color: #64748b; font-size: 11px; display: flex; align-items: center; gap: 4px; margin-bottom: 10px; font-weight: 600;">
            📍 Kec. ${report.kecamatan || 'Bangkalan'}
          </div>
          <a href="/reports/${report.id}" style="display: block; text-align: center; background-color: #2563eb; color: white; font-weight: 800; padding: 7px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; box-shadow: 0 1px 3px rgba(37,99,235,0.2); transition: background-color 0.2s;">
            Lihat Detail &rarr;
          </a>
        </div>
      `
      marker.bindPopup(popupHtml)
    })

    // Auto-adjust view:
    // If only 1 marker, pan to it. If multiple, fit bounds so they all display nicely.
    if (reportsWithCoordinates.length === 1) {
      const single = reportsWithCoordinates[0]
      mapInstanceRef.current.setView([single.latitude!, single.longitude!], 14, { animate: true })
    } else if (reportsWithCoordinates.length > 1) {
      const bounds = L.latLngBounds(reportsWithCoordinates.map(r => [r.latitude!, r.longitude!]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
    }
  }

  return <div ref={mapRef} className="w-full h-72 z-10" />
}
