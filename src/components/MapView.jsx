import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, GeoJSON, Tooltip, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchLagosFeature } from '../data/lagos-boundary.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = L.divIcon({ className: 'pin-marker', iconSize: [30, 30], iconAnchor: [15, 30] })
const correctIcon = L.divIcon({ className: 'correct-marker', iconSize: [24, 24], iconAnchor: [12, 12] })

const TILES = {
  topo: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', attr: '© CartoDB © OpenStreetMap' },
  terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
}

const LAGOS_CENTER = [6.52, 3.40]
const LAGOS_ZOOM = 11

function ClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng) } })
  return null
}

function ResetView({ trigger }) {
  const map = useMap()
  const prev = useRef(trigger)
  useEffect(() => {
    if (trigger !== prev.current) { map.setView(LAGOS_CENTER, LAGOS_ZOOM); prev.current = trigger }
  }, [trigger, map])
  return null
}

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function LagosBoundary() {
  const [feature, setFeature] = useState(null)
  useEffect(() => {
    fetchLagosFeature().then(f => { if (f) setFeature(f) })
  }, [])
  if (!feature) return null
  return (
    <GeoJSON
      data={feature}
      style={{ color: '#008751', weight: 2, fillColor: '#008751', fillOpacity: 0.05, dashArray: '6 3' }}
    />
  )
}

export default function MapView({ onMapClick, userPin, correctPin, activeLayers, referenceDots = [], unlabeledDots = [], distanceKm }) {
  const baseLayer = activeLayers.find(l => ['topo', 'terrain', 'satellite'].includes(l)) || 'topo'
  const tile = TILES[baseLayer]

  return (
    <MapContainer center={LAGOS_CENTER} zoom={LAGOS_ZOOM} className="game-map" zoomControl={true} attributionControl={false}>
      <TileLayer url={tile.url} attribution={tile.attr} key={baseLayer} />
      <ClickHandler onClick={onMapClick} />
      <ResetView trigger={correctPin ? 'fb' : 'place'} />

      {/* Official Lagos State boundary */}
      <LagosBoundary />

      {/* Labeled LGA reference points */}
      {referenceDots.map((dot, i) => (
        <CircleMarker key={`ref-${i}`} center={[dot.lat, dot.lng]} radius={4}
          pathOptions={{ color: '#333', weight: 1.5, fillColor: '#555', fillOpacity: 0.7 }}>
          <Tooltip permanent direction="right" offset={[6, 0]} className="ref-label">
            {dot.name}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Unlabeled spatial guide dots */}
      {unlabeledDots.map((dot, i) => (
        <CircleMarker key={`unl-${i}`} center={[dot.lat, dot.lng]} radius={3}
          pathOptions={{ color: '#888', weight: 1, fillColor: '#aaa', fillOpacity: 0.45 }} />
      ))}

      {userPin && <Marker position={[userPin.lat, userPin.lng]} icon={userIcon} />}

      {correctPin && (
        <>
          <Marker position={[correctPin.lat, correctPin.lng]} icon={correctIcon}>
            {distanceKm !== undefined && (
              <Tooltip permanent direction="top" offset={[0, -14]} className="dist-tooltip">
                {formatDist(distanceKm)} off
              </Tooltip>
            )}
          </Marker>
          {userPin && (
            <Polyline
              positions={[[userPin.lat, userPin.lng], [correctPin.lat, correctPin.lng]]}
              pathOptions={{ color: '#D62828', weight: 2, dashArray: '8 4' }}
            />
          )}
        </>
      )}
    </MapContainer>
  )
}

export function ResultsMap({ results }) {
  return (
    <MapContainer center={LAGOS_CENTER} zoom={LAGOS_ZOOM} style={{ width: '100%', height: '100%' }} zoomControl={true} attributionControl={false}>
      <TileLayer url={TILES.topo.url} attribution={TILES.topo.attr} />
      <LagosBoundary />
      {results.map((r, i) => (
        <Marker key={`u-${i}`} position={[r.userPin.lat, r.userPin.lng]} icon={userIcon} />
      ))}
      {results.map((r, i) => (
        <Marker key={`c-${i}`} position={[r.question.answer.lat, r.question.answer.lng]} icon={correctIcon} />
      ))}
      {results.map((r, i) => (
        <Polyline key={`l-${i}`}
          positions={[[r.userPin.lat, r.userPin.lng], [r.question.answer.lat, r.question.answer.lng]]}
          pathOptions={{ color: '#D62828', weight: 1.5, dashArray: '6 4', opacity: 0.6 }} />
      ))}
    </MapContainer>
  )
}
