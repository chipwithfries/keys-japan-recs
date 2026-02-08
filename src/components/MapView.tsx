'use client'

import { useEffect, useRef } from 'react'
import type { Recommendation } from './types'
import L from 'leaflet'

interface MapViewProps {
  recommendations: Recommendation[]
}

const categoryIcons: Record<string, string> = {
  restaurants: '🍜', bars: '🍶', activities: '⛩️', shopping: '🏬', tips: '💡',
}

export default function MapView({ recommendations }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const geoRecs = recommendations.filter(r => r.lat != null && r.lng != null)

    const center: [number, number] = geoRecs.length > 0
      ? [
          geoRecs.reduce((s, r) => s + r.lat!, 0) / geoRecs.length,
          geoRecs.reduce((s, r) => s + r.lng!, 0) / geoRecs.length,
        ]
      : [36.2, 138.2]
    const zoom = geoRecs.length > 0 ? 12 : 5

    const map = L.map(mapRef.current).setView(center, zoom)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    geoRecs.forEach(rec => {
      const icon = L.divIcon({
        html: `<div class="map-pin">${categoryIcons[rec.category] || '📍'}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([rec.lat!, rec.lng!], { icon }).addTo(map)
      marker.bindPopup(`
        <div class="map-popup">
          <strong>${categoryIcons[rec.category] || ''} ${rec.name}</strong>
          ${rec.area ? `<br><span style="color:#888;font-size:0.85em">${rec.area}${rec.city ? ' · ' + rec.city : ''}</span>` : ''}
          <p style="margin:6px 0;font-size:0.9em">${rec.description}</p>
          ${rec.link ? `<a href="${rec.link}" target="_blank" rel="noopener noreferrer">Visit →</a>` : ''}
        </div>
      `)
    })

    // Fit bounds if we have markers
    if (geoRecs.length > 1) {
      const bounds = L.latLngBounds(geoRecs.map(r => [r.lat!, r.lng!]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [recommendations])

  return <div ref={mapRef} className="map-wrapper" style={{ height: '500px', width: '100%' }} />
}
