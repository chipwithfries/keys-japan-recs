'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Recommendation } from './types'
import L from 'leaflet'

interface MapViewProps {
  recommendations: Recommendation[]
  onMarkerClick?: (rec: Recommendation) => void
  highlightedRec?: string | null
}

const categoryIcons: Record<string, string> = {
  restaurants: '🍜', bars: '🍶', activities: '⛩️', shopping: '🏬', tips: '💡',
}

export default function MapView({ recommendations, onMarkerClick, highlightedRec }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    markersRef.current.clear()

    const geoRecs = recommendations.filter(r => r.lat != null && r.lng != null)

    const center: [number, number] = geoRecs.length > 0
      ? [
          geoRecs.reduce((s, r) => s + r.lat!, 0) / geoRecs.length,
          geoRecs.reduce((s, r) => s + r.lng!, 0) / geoRecs.length,
        ]
      : [36.2, 138.2]
    const zoom = geoRecs.length > 0 ? 12 : 5

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom)
    mapInstanceRef.current = map

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map)

    geoRecs.forEach(rec => {
      const isHighlighted = highlightedRec === rec.name
      const icon = L.divIcon({
        html: `<div class="map-pin ${isHighlighted ? 'map-pin-active' : ''}">${categoryIcons[rec.category] || '📍'}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([rec.lat!, rec.lng!], { icon }).addTo(map)
      markersRef.current.set(rec.name, marker)

      marker.bindPopup(`
        <div class="map-popup">
          <strong>${categoryIcons[rec.category] || ''} ${rec.name}</strong>
          ${rec.area ? `<br><span style="color:#888;font-size:0.85em">${rec.area}${rec.city ? ' · ' + rec.city : ''}</span>` : ''}
          <p style="margin:6px 0;font-size:0.9em">${rec.description}</p>
          ${rec.link ? `<a href="${rec.link}" target="_blank" rel="noopener noreferrer">Visit →</a>` : ''}
        </div>
      `)

      marker.on('click', () => {
        onMarkerClick?.(rec)
      })
    })

    if (geoRecs.length > 1) {
      const bounds = L.latLngBounds(geoRecs.map(r => [r.lat!, r.lng!]))
      map.fitBounds(bounds, { padding: [60, 60] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
  }, [recommendations, onMarkerClick, highlightedRec])

  // Pan to highlighted rec
  useEffect(() => {
    if (!highlightedRec || !mapInstanceRef.current) return
    const marker = markersRef.current.get(highlightedRec)
    if (marker) {
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.4 })
    }
  }, [highlightedRec])

  return <div ref={mapRef} className="map-fullscreen" />
}
