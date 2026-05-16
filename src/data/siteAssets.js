// ============================================
// Site Image & Logo Mapping
// Maps POI IDs to their downloaded real-world photos and logos
// ============================================

// Discovery POI images (keyed by discovery.js `id`)
export const SITE_IMAGES = {
  // FOOD
  f1: ['/images/sites/f1_image_1.JPG'],
  f2: ['/images/sites/f2_image_1.jpg'],
  f3: ['/images/sites/f3_image_1.jpg'],
  f4: ['/images/sites/f4_image_1.jpg', '/images/sites/f4_image_2.jpg'],
  f5: ['/images/sites/f5_image_1.jpg'],
  f6: ['/images/sites/f6_image_1.jpg', '/images/sites/f6_image_2.jpg'],
  f7: ['/images/sites/f7_image_1.jpg', '/images/sites/f7_image_2.jpg'],

  // NIGHTLIFE
  n1: ['/images/sites/n1_image_1.jpg', '/images/sites/n1_image_2.jpg'],
  n2: ['/images/sites/n2_image_1.jpg', '/images/sites/n2_image_2.jpg'],
  n3: ['/images/sites/n3_image_1.jpg'],

  // BARS
  b2: ['/images/sites/b2_image_1.jpg', '/images/sites/b2_image_2.jpg'],
  b3: ['/images/sites/b3_image_1.jpg', '/images/sites/b3_image_2.jpg'],

  // BEACHES
  be1: ['/images/sites/be1_image_1.jpg', '/images/sites/be1_image_2.jpg'],
  be3: ['/images/sites/be3_image_1.jpg', '/images/sites/be3_image_2.png'],
  be4: ['/images/sites/be4_image_1.jpg'],

  // PARKS
  p1: ['/images/sites/p1_image_1.jpg', '/images/sites/p1_image_2.jpg'],
  p2: ['/images/sites/p2_image_1.jpg', '/images/sites/p2_image_2.jpg'],
  p3: ['/images/sites/p3_image_1.jpg'],
  p4: ['/images/sites/p4_image_1.jpg'],

  // CINEMA
  c1: ['/images/sites/c1_image_1.jpg'],
  c2: ['/images/sites/c2_image_2.jpg'],

  // ART & CULTURE
  a1: ['/images/sites/a1_image_1.jpg', '/images/sites/a1_image_2.jpg'],
  a2: ['/images/sites/a2_image_1.png'],
  a3: ['/images/sites/a3_image_1.jpg', '/images/sites/a3_image_2.jpg'],
  a4: ['/images/sites/a4_image_1.jpg', '/images/sites/a4_image_2.jpg'],
  a5: ['/images/sites/a5_image_1.jpg'],

  // FITNESS
  fi1: ['/images/sites/fi1_image_1.jpg'],

  // SHOPPING
  s1: ['/images/sites/s1_image_1.JPG', '/images/sites/s1_image_2.jpg'],
  s4: ['/images/sites/s4_image_1.jpg'],

  // HOTELS
  h1: ['/images/sites/h1_image_1.jpg', '/images/sites/h1_image_2.jpg'],
  h2: ['/images/sites/h2_image_1.JPG', '/images/sites/h2_image_2.jpg'],
  h4: ['/images/sites/h4_image_1.png'],

  // SPORTS
  sp2: ['/images/sites/sp2_image_1.jpg', '/images/sites/sp2_image_2.jpg'],

  // KIDS
  k1: ['/images/sites/k1_image_1.jpg'],

  // TRANSIT
  t1: ['/images/sites/t1_image_1.jpg'],
  t2: ['/images/sites/t2_image_1.jpg', '/images/sites/t2_image_2.jpg'],
  t3: ['/images/sites/t3_image_1.jpg', '/images/sites/t3_image_2.png'],

  // WIFI
  w1: ['/images/sites/w1_image_1.png'],
  w2: ['/images/sites/w2_image_1.jpg'],
  w3: ['/images/sites/w3_image_1.jpg'],
}

// Discovery POI logos (keyed by discovery.js `id`)
export const SITE_LOGOS = {
  f1: '/images/logos/f1_logo.JPG',
  f2: '/images/logos/f2_logo.png',
  n3: '/images/logos/n3_logo.jpg',
  n4: '/images/logos/n4_logo.jpg',
  b3: '/images/logos/b3_logo.png',
  be1: '/images/logos/be1_logo.jpg',
  be4: '/images/logos/be4_logo.jpg',
  p2: '/images/logos/p2_logo.jpg',
  c1: '/images/logos/c1_logo.png',
  a4: '/images/logos/a4_logo.jpg',
  a5: '/images/logos/a5_logo.jpg',
  s1: '/images/logos/s1_logo.jpg',
  s4: '/images/logos/s4_logo.jpg',
  h1: '/images/logos/h1_logo.png',
  sp2: '/images/logos/sp2_logo.jpg',
  t1: '/images/logos/t1_logo.jpg',
  k1: '/images/logos/k1_logo.jpg',
  w1: '/images/logos/w1_logo.png',
}

// Listing images (keyed by listings.jsx slug `id`)
export const LISTING_IMAGES = {
  'nok-vi': [],
  'terra-kulture': ['/images/sites/terra-kulture_image_1.png'],
  'bungalow-ikoyi': ['/images/sites/bungalow-ikoyi_image_1.jpg'],
  'mama-cass': ['/images/sites/mama-cass_image_1.jpg'],
  'hardrock': ['/images/sites/hardrock_image_1.png'],
  'bukka-hut': [],
  'craft-gourmet': ['/images/sites/craft-gourmet_image_1.jpg', '/images/sites/craft-gourmet_image_2.jpg'],
  'sky-restaurant': ['/images/sites/sky-restaurant_image_1.jpg'],
  'eko-hotel': ['/images/sites/eko-hotel_image_1.jpg'],
  'radisson-blu': ['/images/sites/radisson-blu_image_1.JPG'],
  'wheatbaker': ['/images/sites/wheatbaker_image_1.jpg'],
  'oriental-hotel': ['/images/sites/oriental-hotel_image_1.jpg', '/images/sites/oriental-hotel_image_2.jpg'],
  'southern-sun': ['/images/sites/southern-sun_image_1.jpg', '/images/sites/southern-sun_image_2.jpg'],
  'bogobiri': [],
  'nike-art': ['/images/sites/nike-art_image_1.jpg', '/images/sites/nike-art_image_2.jpg'],
  'lekki-conservation': ['/images/sites/lekki-conservation_image_1.jpg', '/images/sites/lekki-conservation_image_2.jpg'],
  'national-theatre': ['/images/sites/national-theatre_image_1.jpg', '/images/sites/national-theatre_image_2.jpg'],
  'freedom-park': ['/images/sites/freedom-park_image_1.jpg', '/images/sites/freedom-park_image_2.jpg'],
  'new-afrika-shrine': ['/images/sites/new-afrika-shrine_image_1.jpg', '/images/sites/new-afrika-shrine_image_2.jpg'],
  'olumo-rock': ['/images/sites/olumo-rock_image_1.jpg', '/images/sites/olumo-rock_image_2.jpg'],
  'badagry-heritage': ['/images/sites/badagry-heritage_image_1.PNG', '/images/sites/badagry-heritage_image_2.jpg'],
  'tarkwa-bay': ['/images/sites/tarkwa-bay_image_1.jpg', '/images/sites/tarkwa-bay_image_2.jpg'],
  'club-quilox': ['/images/sites/club-quilox_image_1.jpg'],
  'hard-rock-live': ['/images/sites/hard-rock-live_image_1.png'],
  'shiro-lagos': [],
  'cactus-restaurant': ['/images/sites/cactus-restaurant_image_1.jpg'],
  'jhalobia-park': [],
  'muri-okunola': ['/images/sites/muri-okunola_image_1.jpg', '/images/sites/muri-okunola_image_2.jpg'],
  'ikoyi-golf': ['/images/sites/ikoyi-golf_image_1.jpg', '/images/sites/ikoyi-golf_image_2.jpg'],
  'eleko-beach': ['/images/sites/eleko-beach_image_1.jpg', '/images/sites/eleko-beach_image_2.png'],
  'terra-gallery': ['/images/sites/terra-kulture_image_1.png'],
  'thought-pyramid': ['/images/sites/thought-pyramid_image_1.jpg', '/images/sites/thought-pyramid_image_2.png'],
  'red-door-gallery': ['/images/sites/red-door-gallery_image_1.jpg', '/images/sites/red-door-gallery_image_2.jpg'],
  'national-museum': ['/images/sites/national-museum_image_1.jpg', '/images/sites/national-museum_image_2.jpg'],
  'inagbe-resort': ['/images/sites/inagbe-resort_image_1.jpg', '/images/sites/inagbe-resort_image_2.jpg'],
  'lekki-market': ['/images/sites/lekki-market_image_1.jpg', '/images/sites/lekki-market_image_2.jpg'],
  'kalakuta-museum': ['/images/sites/kalakuta-museum_image_1.jpg'],
  'boat-cruise': ['/images/sites/boat-cruise_image_1.jpg'],
  'cooking-class': ['/images/sites/cooking-class_image_1.png'],
  'palms-lekki': ['/images/sites/s1_image_1.JPG', '/images/sites/s1_image_2.jpg'],
  'ikeja-city-mall': ['/images/sites/ikeja-city-mall_image_1.jpg', '/images/sites/ikeja-city-mall_image_2.jpg'],
  'alaba-market': ['/images/sites/alaba-market_image_1.jpg', '/images/sites/alaba-market_image_2.jpg'],
  'balogun-market': ['/images/sites/balogun-market_image_1.jpg', '/images/sites/balogun-market_image_2.jpg'],
  'computer-village': ['/images/sites/computer-village_image_1.jpg'],
  'elegushi-beach': ['/images/sites/elegushi-beach_image_1.jpg', '/images/sites/elegushi-beach_image_2.jpg'],
  'landmark-centre': ['/images/sites/landmark-centre_image_1.jpg'],
}

export const LISTING_LOGOS = {
  'eko-hotel': '/images/logos/eko-hotel_logo.png',
  'radisson-blu': '/images/logos/radisson-blu_logo.jpg',
  'oriental-hotel': '/images/logos/oriental-hotel_logo.jpg',
  'southern-sun': '/images/logos/southern-sun_logo.jpg',
  'nike-art': '/images/logos/nike-art_logo.jpg',
  'lekki-conservation': '/images/logos/lekki-conservation_logo.jpg',
  'national-theatre': '/images/logos/national-theatre_logo.jpg',
  'freedom-park': [],
  'new-afrika-shrine': [],
  'badagry-heritage': '/images/logos/badagry-heritage_logo.jpg',
  'club-quilox': '/images/logos/club-quilox_logo.jpg',
  'hard-rock-live': '/images/logos/hard-rock-live_logo.jpg',
  'cactus-restaurant': '/images/logos/cactus-restaurant_logo.jpg',
  'ikoyi-golf': '/images/logos/ikoyi-golf_logo.jpg',
  'national-museum': '/images/logos/national-museum_logo.jpg',
  'inagbe-resort': '/images/logos/inagbe-resort_logo.jpg',
  'lekki-market': '/images/logos/lekki-market_logo.jpg',
  'kalakuta-museum': '/images/logos/kalakuta-museum_logo.jpg',
  'boat-cruise': '/images/logos/boat-cruise_logo.jpg',
  'ikeja-city-mall': '/images/logos/ikeja-city-mall_logo.jpg',
  'elegushi-beach': '/images/logos/elegushi-beach_logo.jpg',
  'landmark-centre': '/images/logos/landmark-centre_logo.jpg',
  'sky-restaurant': '/images/logos/sky-restaurant_logo.jpg',
  'tarkwa-bay': '/images/logos/tarkwa-bay_logo.jpg',
  'red-door-gallery': '/images/logos/red-door-gallery_logo.JPG',
  'alaba-market': '/images/logos/alaba-market_logo.png',
  'balogun-market': '/images/logos/balogun-market_logo.png',
  'computer-village': '/images/logos/computer-village_logo.png',
}

// Helper: get first image for a POI (discovery or listing)
export function getSiteImage(id) {
  return SITE_IMAGES[id]?.[0] || LISTING_IMAGES[id]?.[0] || null
}

export function getSiteLogo(id) {
  return SITE_LOGOS[id] || LISTING_LOGOS[id] || null
}

export function getSiteImages(id) {
  return SITE_IMAGES[id] || LISTING_IMAGES[id] || []
}
