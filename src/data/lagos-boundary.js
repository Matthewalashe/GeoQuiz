// Fetches official Lagos State boundary from geoBoundaries (GRID3/CC-BY-4.0)
// Source: https://www.geoboundaries.org/ — Nigeria ADM1 (State boundaries)

// jsDelivr CDN mirrors GitHub and has proper CORS headers
const URLS = [
  'https://cdn.jsdelivr.net/gh/wmgeolab/geoBoundaries@9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson',
  'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson',
];

let cachedData = null;

export async function fetchNigeriaStates() {
  if (cachedData) return cachedData;
  for (const url of URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      cachedData = await res.json();
      return cachedData;
    } catch { continue; }
  }
  console.warn('Could not fetch state boundaries from any source');
  return null;
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
