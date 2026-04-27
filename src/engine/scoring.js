// Haversine distance between two lat/lng points in kilometers
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

// Score based on distance (Lagos scale — city-level precision)
export function calculateScore(distanceKm) {
  if (distanceKm < 1) return 100;
  if (distanceKm < 3) return 80;
  if (distanceKm < 5) return 60;
  if (distanceKm < 10) return 40;
  if (distanceKm < 20) return 20;
  return 5;
}

export function getScoreClass(score) {
  if (score >= 80) return 'perfect';
  if (score >= 60) return 'good';
  if (score >= 40) return 'ok';
  return 'poor';
}

export function getGrade(totalScore, maxScore) {
  const pct = (totalScore / maxScore) * 100;
  if (pct >= 80) return { label: 'GIS Expert 🏆', cls: 'grade-expert' };
  if (pct >= 60) return { label: 'Solid Navigator 🧭', cls: 'grade-good' };
  if (pct >= 40) return { label: 'Getting There 📍', cls: 'grade-ok' };
  return { label: 'Keep Exploring 🗺️', cls: 'grade-poor' };
}

// Leaderboard (localStorage)
const LB_KEY = 'geoquiz_leaderboard';

export function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) || '[]');
  } catch { return []; }
}

export function saveToLeaderboard(entry) {
  const lb = getLeaderboard();
  lb.push({ ...entry, date: new Date().toISOString() });
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 50)));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
