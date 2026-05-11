/**
 * Fix GeoJSON files: convert UTM Zone 31N coordinates to WGS84 (EPSG:4326)
 * 
 * UTM Zone 31N: EPSG:32631
 * Central Meridian: 3°E, Scale Factor: 0.9996
 * 
 * Uses simplified Karney inverse projection (sufficient accuracy for web maps)
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'public', 'data')

// UTM Zone 31N parameters
const UTM_ZONE = 31
const FALSE_EASTING = 500000
const FALSE_NORTHING = 0
const SCALE_FACTOR = 0.9996
const SEMI_MAJOR = 6378137.0 // WGS84
const FLATTENING = 1 / 298.257223563
const SEMI_MINOR = SEMI_MAJOR * (1 - FLATTENING)
const E = Math.sqrt(1 - (SEMI_MINOR * SEMI_MINOR) / (SEMI_MAJOR * SEMI_MAJOR))
const E_PRIME_SQ = (E * E) / (1 - E * E)
const CENTRAL_MERIDIAN = (UTM_ZONE - 1) * 6 - 180 + 3 // = 3° for Zone 31

function utmToLatLng(easting, northing) {
  const x = easting - FALSE_EASTING
  const y = northing - FALSE_NORTHING

  const M = y / SCALE_FACTOR
  const mu = M / (SEMI_MAJOR * (1 - E * E / 4 - 3 * E ** 4 / 64 - 5 * E ** 6 / 256))

  const e1 = (1 - Math.sqrt(1 - E * E)) / (1 + Math.sqrt(1 - E * E))

  const phi1 = mu +
    (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)

  const N1 = SEMI_MAJOR / Math.sqrt(1 - E * E * Math.sin(phi1) ** 2)
  const T1 = Math.tan(phi1) ** 2
  const C1 = E_PRIME_SQ * Math.cos(phi1) ** 2
  const R1 = SEMI_MAJOR * (1 - E * E) / (1 - E * E * Math.sin(phi1) ** 2) ** 1.5
  const D = x / (N1 * SCALE_FACTOR)

  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
    D * D / 2 -
    (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * E_PRIME_SQ) * D ** 4 / 24 +
    (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * E_PRIME_SQ - 3 * C1 * C1) * D ** 6 / 720
  )

  const lng = (D -
    (1 + 2 * T1 + C1) * D ** 3 / 6 +
    (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * E_PRIME_SQ + 24 * T1 * T1) * D ** 5 / 120
  ) / Math.cos(phi1)

  const latDeg = lat * 180 / Math.PI
  const lngDeg = lng * 180 / Math.PI + CENTRAL_MERIDIAN

  return [lngDeg, latDeg]
}

function isUTM(coord) {
  // UTM coordinates are typically > 100000 for easting and > 100000 for northing
  // WGS84 lng is between -180 and 180, lat between -90 and 90
  // Lagos area: lng ~3, lat ~6  vs  UTM easting ~540000, northing ~715000
  return Math.abs(coord[0]) > 1000 || Math.abs(coord[1]) > 1000
}

function convertCoord(coord) {
  if (isUTM(coord)) {
    const [lng, lat] = utmToLatLng(coord[0], coord[1])
    return [parseFloat(lng.toFixed(7)), parseFloat(lat.toFixed(7))]
  }
  return coord
}

function convertCoords(coords, type) {
  if (type === 'Point') {
    return convertCoord(coords)
  }
  if (type === 'LineString') {
    return coords.map(c => convertCoord(c))
  }
  if (type === 'MultiLineString' || type === 'Polygon') {
    return coords.map(ring => ring.map(c => convertCoord(c)))
  }
  if (type === 'MultiPolygon') {
    return coords.map(poly => poly.map(ring => ring.map(c => convertCoord(c))))
  }
  return coords
}

function fixGeoJSON(filePath) {
  console.log(`\n🔧 Processing: ${filePath}`)
  const raw = readFileSync(filePath, 'utf8')
  const geojson = JSON.parse(raw)

  let fixedCount = 0
  let okCount = 0

  for (const feature of geojson.features) {
    if (!feature.geometry) continue
    const { type, coordinates } = feature.geometry

    // Check if first coordinate is UTM
    let firstCoord
    if (type === 'Point') firstCoord = coordinates
    else if (type === 'LineString') firstCoord = coordinates[0]
    else if (type === 'MultiLineString') firstCoord = Array.isArray(coordinates[0][0]) ? coordinates[0][0] : coordinates[0]
    
    if (firstCoord && isUTM(firstCoord)) {
      feature.geometry.coordinates = convertCoords(coordinates, type)
      fixedCount++
      
      // Also normalize property keys for BRT routes
      if (feature.properties) {
        if (feature.properties.Route_Name && !feature.properties.route_name) {
          feature.properties.route_name = feature.properties.Route_Name
          delete feature.properties.Route_Name
        }
        if (feature.properties.Name && !feature.properties.route_name && type !== 'Point') {
          feature.properties.route_name = feature.properties.Name
        }
      }
      
      console.log(`  ✅ Converted UTM→WGS84: ${feature.properties?.route_name || feature.properties?.Name || feature.properties?.stop_name || '?'}`)
    } else {
      okCount++
      // Still normalize property keys
      if (feature.properties) {
        if (feature.properties.Route_Name && !feature.properties.route_name) {
          feature.properties.route_name = feature.properties.Route_Name
          delete feature.properties.Route_Name
        }
        if (feature.properties.Name && !feature.properties.route_name && type !== 'Point') {
          feature.properties.route_name = feature.properties.Name
        }
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(geojson, null, 2), 'utf8')
  console.log(`  📊 Fixed: ${fixedCount}, Already OK: ${okCount}, Total: ${geojson.features.length}`)
}

// Fix all three GeoJSON files
fixGeoJSON(join(DATA_DIR, 'brt_routes.geojson'))
fixGeoJSON(join(DATA_DIR, 'brt_stops.geojson'))
fixGeoJSON(join(DATA_DIR, 'rail_routes.geojson'))

// Verify the output
console.log('\n🔍 Verification:')
for (const file of ['brt_routes.geojson', 'brt_stops.geojson', 'rail_routes.geojson']) {
  const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'))
  let allWGS84 = true
  for (const f of data.features) {
    if (!f.geometry) continue
    let first
    const t = f.geometry.type
    const c = f.geometry.coordinates
    if (t === 'Point') first = c
    else if (t === 'LineString') first = c[0]
    else if (t === 'MultiLineString') first = Array.isArray(c[0][0]) ? c[0][0] : c[0]
    if (first && isUTM(first)) {
      allWGS84 = false
      console.log(`  ❌ ${file}: ${f.properties?.route_name || f.properties?.Name} still has UTM coords: ${first}`)
    }
  }
  if (allWGS84) console.log(`  ✅ ${file}: All ${data.features.length} features in WGS84`)
}
