// ============================================
// Map Skins — Cosmetic Unlocks (Milestone 2.6)
// ============================================

export const MAP_SKINS = [
  {
    id: 'default',
    name: 'Voyager',
    emoji: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB © OpenStreetMap',
    unlock: 'free',
    unlockLabel: 'Free',
    unlocked: true,
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    emoji: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB © OpenStreetMap',
    unlock: 'level',
    unlockValue: 5,
    unlockLabel: 'Level 5',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    emoji: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri',
    unlock: 'level',
    unlockValue: 10,
    unlockLabel: 'Level 10',
  },
  {
    id: 'vintage',
    name: 'Vintage Sepia',
    emoji: '📜',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
    attr: '© Stamen Design',
    unlock: 'streak',
    unlockValue: 50,
    unlockLabel: '50-day streak',
    filter: 'sepia(0.4) contrast(1.1)',
  },
  {
    id: 'topo',
    name: 'Topographic',
    emoji: '🏔️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© OpenTopoMap',
    unlock: 'level',
    unlockValue: 15,
    unlockLabel: 'Level 15',
  },
  {
    id: 'light',
    name: 'Minimal White',
    emoji: '⬜',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB © OpenStreetMap',
    unlock: 'level',
    unlockValue: 3,
    unlockLabel: 'Level 3',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    emoji: '🔥',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB © OpenStreetMap',
    unlock: 'special',
    unlockLabel: 'Win 10 duels',
    filter: 'hue-rotate(330deg) saturate(2) brightness(0.9)',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    emoji: '🌈',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB © OpenStreetMap',
    unlock: 'special',
    unlockLabel: 'Perfect blitz game',
    filter: 'hue-rotate(180deg) saturate(1.5) brightness(1.1)',
  },
]

const SKIN_KEY = 'geoquiz_skin'

export function getActiveSkin() {
  return localStorage.getItem(SKIN_KEY) || 'default'
}

export function setActiveSkin(id) {
  localStorage.setItem(SKIN_KEY, id)
}

export function isSkinUnlocked(skin, xpData) {
  if (skin.unlock === 'free') return true
  if (skin.unlock === 'level') return (xpData.level || 1) >= skin.unlockValue
  if (skin.unlock === 'streak') return (xpData.streakDays || 0) >= skin.unlockValue
  if (skin.id === 'inferno') return (xpData.badges || []).includes('duel-10')
  if (skin.id === 'rainbow') return (xpData.badges || []).includes('perfect-blitz')
  return false
}

export function getSkinById(id) {
  return MAP_SKINS.find(s => s.id === id) || MAP_SKINS[0]
}
