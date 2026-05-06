// ============================================
// GeoQuiz Exploration Engine
// Phase 3, Milestone 3.1 — Fog of War
// ============================================

const EXP_KEY = 'geoquiz_exploration'
const CHECKIN_KEY = 'geoquiz_checkins'

// ── Explored spots ──
export function getExplored() {
  try { return JSON.parse(localStorage.getItem(EXP_KEY) || '[]') }
  catch { return [] }
}

function saveExplored(spots) {
  // Cap at 300 spots to keep localStorage lean
  const trimmed = spots.slice(-300)
  localStorage.setItem(EXP_KEY, JSON.stringify(trimmed))
}

// Mark a location as explored (called after correct quiz answer)
export function markExplored(lat, lng, label = '') {
  const spots = getExplored()
  // Don't add duplicate within 200m
  const already = spots.some(s => haversine(s.lat, s.lng, lat, lng) < 0.2)
  if (already) return
  spots.push({ lat, lng, label, date: new Date().toISOString() })
  saveExplored(spots)
}

// Lagos area bbox for percentage calculation
// Approximate: Lagos State spans ~3,577 km²
// We divide it into a grid and see what fraction is "lit"
const LAGOS_BBOX = { minLat: 6.35, maxLat: 6.70, minLng: 2.70, maxLng: 4.10 }
const GRID_CELLS = 200 // resolution

export function getExplorationPercent() {
  const spots = getExplored()
  if (spots.length === 0) return 0

  const cellW = (LAGOS_BBOX.maxLng - LAGOS_BBOX.minLng) / GRID_CELLS
  const cellH = (LAGOS_BBOX.maxLat - LAGOS_BBOX.minLat) / GRID_CELLS
  const exploredCells = new Set()
  const RADIUS_DEG = 0.018 // ≈ 2km

  spots.forEach(({ lat, lng }) => {
    const col0 = Math.floor((lng - RADIUS_DEG - LAGOS_BBOX.minLng) / cellW)
    const col1 = Math.ceil((lng + RADIUS_DEG - LAGOS_BBOX.minLng) / cellW)
    const row0 = Math.floor((lat - RADIUS_DEG - LAGOS_BBOX.minLat) / cellH)
    const row1 = Math.ceil((lat + RADIUS_DEG - LAGOS_BBOX.minLat) / cellH)
    for (let r = row0; r <= row1; r++) {
      for (let c = col0; c <= col1; c++) {
        if (r >= 0 && r < GRID_CELLS && c >= 0 && c < GRID_CELLS)
          exploredCells.add(`${r},${c}`)
      }
    }
  })

  // Lagos state is ~50% of the bounding box (the rest is water/neighbouring states)
  const LAGOS_CELLS_ESTIMATE = GRID_CELLS * GRID_CELLS * 0.5
  return Math.min(100, Math.round((exploredCells.size / LAGOS_CELLS_ESTIMATE) * 100))
}

export function getExploredCount() { return getExplored().length }

// ── Check-ins ──
export function getCheckIns() {
  try { return JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]') }
  catch { return [] }
}

function saveCheckIns(list) {
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(list.slice(-100)))
}

export function saveCheckIn(poi) {
  const list = getCheckIns()
  list.push({
    id: poi.id,
    name: poi.name,
    area: poi.area,
    category: poi.category,
    lat: poi.lat,
    lng: poi.lng,
    date: new Date().toISOString()
  })
  saveCheckIns(list)
  // Also mark as explored
  markExplored(poi.lat, poi.lng, poi.name)
}

export function hasCheckedIn(poiId) {
  return getCheckIns().some(c => c.id === poiId)
}

// ── Haversine (internal) ──
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function distanceTo(lat1, lng1, lat2, lng2) { return haversine(lat1, lng1, lat2, lng2) }
