// Fetches official Lagos State boundary from geoBoundaries (GRID3/CC-BY-4.0)
// Source: https://www.geoboundaries.org/ — Nigeria ADM1 (State boundaries)

const GEOBOUNDARIES_URL = 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson';

let cachedData = null;

export async function fetchNigeriaStates() {
  if (cachedData) return cachedData;
  try {
    const res = await fetch(GEOBOUNDARIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedData = await res.json();
    return cachedData;
  } catch (err) {
    console.warn('Failed to fetch state boundaries:', err);
    return null;
  }
}

export async function fetchLagosFeature() {
  const data = await fetchNigeriaStates();
  if (!data) return null;
  const feature = data.features.find(f =>
    f.properties.shapeName?.toLowerCase() === 'lagos' ||
    f.properties.statename?.toLowerCase() === 'lagos' ||
    f.properties.admin1Name?.toLowerCase() === 'lagos' ||
    f.properties.NAME_1?.toLowerCase() === 'lagos' ||
    JSON.stringify(f.properties).toLowerCase().includes('lagos')
  );
  return feature || null;
}

export async function fetchNeighborStates() {
  const data = await fetchNigeriaStates();
  if (!data) return [];
  // Ogun borders Lagos to the north/east
  return data.features.filter(f => {
    const name = (f.properties.shapeName || f.properties.statename || f.properties.NAME_1 || '').toLowerCase();
    return name === 'ogun';
  });
}
