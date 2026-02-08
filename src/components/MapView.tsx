'use client'

import { useEffect, useState } from 'react'
import type { Recommendation } from './types'

interface MapViewProps {
  recommendations: Recommendation[]
}

export default function MapView({ recommendations }: MapViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="map-loading">Loading map…</div>

  return <MapInner recommendations={recommendations} />
}

function MapInner({ recommendations }: MapViewProps) {
  const [L, setL] = useState<any>(null)
  const [RL, setRL] = useState<any>(null)
  const [selected, setSelected] = useState<Recommendation | null>(null)

  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([leaflet, reactLeaflet]) => {
      setL(leaflet.default || leaflet)
      setRL(reactLeaflet)
    })
  }, [])

  if (!L || !RL) return <div className="map-loading">Loading map…</div>

  const { MapContainer, TileLayer, Marker, Popup } = RL

  const geoRecs = recommendations.filter(r => r.lat != null && r.lng != null)

  // Center on Japan
  const center: [number, number] = geoRecs.length > 0
    ? [geoRecs.reduce((s, r) => s + r.lat!, 0) / geoRecs.length, geoRecs.reduce((s, r) => s + r.lng!, 0) / geoRecs.length]
    : [36.2, 138.2]
  const zoom = geoRecs.length > 0 ? 6 : 5

  const categoryIcons: Record<string, string> = {
    restaurants: '🍜', bars: '🍶', activities: '⛩️', shopping: '🏬', tips: '💡',
  }

  const icon = (cat: string) => L.divIcon({
    html: `<div class="map-pin">${categoryIcons[cat] || '📍'}</div>`,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })

  return (
    <div className="map-wrapper">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoRecs.map((rec, i) => (
          <Marker key={i} position={[rec.lat!, rec.lng!]} icon={icon(rec.category)}
            eventHandlers={{ click: () => setSelected(rec) }}>
            <Popup>
              <div className="map-popup">
                <strong>{categoryIcons[rec.category]} {rec.name}</strong>
                {rec.area && <span className="popup-area">{rec.area} · {rec.city}</span>}
                <p>{rec.description}</p>
                {rec.link && <a href={rec.link} target="_blank" rel="noopener noreferrer">Visit →</a>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
