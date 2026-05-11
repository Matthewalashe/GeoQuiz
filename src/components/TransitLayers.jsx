// Transit overlay layers for the Explore map
// Renders BRT routes, BRT stops, and Rail lines from GeoJSON

import { useState, useEffect } from 'react'
import { GeoJSON, CircleMarker, Tooltip } from 'react-leaflet'

function useGeoJSON(url) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [url])
  return data
}

const BRT_STYLE = {
  color: '#E05A3A',
  weight: 3.5,
  opacity: 0.85,
  dashArray: '8 4',
}

const RAIL_STYLE = {
  color: '#3D348B',
  weight: 4,
  opacity: 0.9,
}

export default function TransitLayers({ showBRT = true, showRail = true }) {
  const brtRoutes = useGeoJSON('/data/brt_routes.geojson')
  const brtStops  = useGeoJSON('/data/brt_stops.geojson')
  const railData  = useGeoJSON('/data/rail_routes.geojson')

  // Separate rail lines from stations
  const railLines = railData ? {
    ...railData,
    features: railData.features.filter(f => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
  } : null

  const railStations = railData ? {
    ...railData,
    features: railData.features.filter(f => f.geometry?.type === 'Point')
  } : null

  return (
    <>
      {/* BRT Routes */}
      {showBRT && brtRoutes && (
        <GeoJSON
          key="brt-routes"
          data={brtRoutes}
          style={() => BRT_STYLE}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.route_name || 'BRT Route'
            layer.bindTooltip(`🚌 ${name}`, { sticky: true, className: 'transit-tooltip' })
          }}
        />
      )}

      {/* BRT Stops */}
      {showBRT && brtStops && brtStops.features.map((f, i) => {
        if (!f.geometry || f.geometry.type !== 'Point') return null
        const [lng, lat] = f.geometry.coordinates
        const name = f.properties?.stop_name || f.properties?.Name || 'BRT Stop'
        return (
          <CircleMarker
            key={`brt-stop-${i}`}
            center={[lat, lng]}
            radius={4}
            pathOptions={{ color: '#E05A3A', weight: 1.5, fillColor: '#fff', fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -5]} className="transit-tooltip">
              🚏 {name}
            </Tooltip>
          </CircleMarker>
        )
      })}

      {/* Rail Lines */}
      {showRail && railLines && railLines.features.length > 0 && (
        <GeoJSON
          key="rail-lines"
          data={railLines}
          style={(feature) => {
            const name = (feature.properties?.rail_name || '').toLowerCase()
            return {
              ...RAIL_STYLE,
              color: name.includes('blue') ? '#0061A4' : name.includes('red') ? '#BA1A1A' : '#3D348B',
            }
          }}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.rail_name || 'Rail Line'
            layer.bindTooltip(`🚆 ${name}`, { sticky: true, className: 'transit-tooltip' })
          }}
        />
      )}

      {/* Rail Stations */}
      {showRail && railStations && railStations.features.map((f, i) => {
        if (!f.geometry || f.geometry.type !== 'Point') return null
        const [lng, lat] = f.geometry.coordinates
        const name = f.properties?.Name || f.properties?.rail_name || 'Station'
        return (
          <CircleMarker
            key={`rail-stn-${i}`}
            center={[lat, lng]}
            radius={5}
            pathOptions={{ color: '#3D348B', weight: 2, fillColor: '#fff', fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]} className="transit-tooltip">
              🚉 {name}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}
