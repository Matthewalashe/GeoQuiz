// ============================================
// City Discovery POI Dataset — Lagos
// Phase 3, Milestone 3.3
// ============================================



export const DISCOVERY_CATEGORIES = [
  { id: 'all',        icon: '🗺️',  label: 'All' },
  { id: 'food',       icon: '🍽️',  label: 'Food' },
  { id: 'nightlife',  icon: '🎉',  label: 'Nightlife' },
  { id: 'bars',       icon: '🍻',  label: 'Bars' },
  { id: 'beaches',    icon: '🏖️',  label: 'Beaches' },
  { id: 'parks',      icon: '🌳',  label: 'Parks' },
  { id: 'cinema',     icon: '🎬',  label: 'Cinema' },
  { id: 'art',        icon: '🎭',  label: 'Art & Culture' },
  { id: 'fitness',    icon: '🏋️',  label: 'Fitness' },
  { id: 'shopping',   icon: '🛍️',  label: 'Shopping' },
  { id: 'hotels',     icon: '🏨',  label: 'Hotels' },
  { id: 'coworking',  icon: '💻',  label: 'Co-working' },
  { id: 'sports',     icon: '⚽',  label: 'Sports' },
  { id: 'kids',       icon: '🧒',  label: 'Kids' },
  { id: 'transport',  icon: '🚌',  label: 'Transit' },
  { id: 'wifi',       icon: '📶',  label: 'Free WiFi' },
]

export const DISCOVERY_POIS = [
  // ── FOOD ──
  { id: 'f1', name: 'Nkoyo Restaurant', category: 'food', lat: 6.4285, lng: 3.4232, area: 'VI', rating: 4.6, description: 'Upscale contemporary Nigerian cuisine in Victoria Island.', sponsored: true, cta: 'View Menu', mapUrl: 'https://maps.google.com/?q=Nkoyo+Restaurant+Victoria+Island+Lagos' },
  { id: 'f2', name: 'The Place Restaurant', category: 'food', lat: 6.4350, lng: 3.5189, area: 'Lekki', rating: 4.3, description: 'Affordable local & continental meals with multiple branches.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=The+Place+Restaurant+Lekki+Lagos' },
  { id: 'f3', name: 'Bungalow Restaurant', category: 'food', lat: 6.4350, lng: 3.5180, area: 'Lekki', rating: 4.5, description: 'Trendy Afropop dining spot loved by Lagos socialites.', sponsored: true, cta: 'Book a Table', mapUrl: 'https://maps.google.com/?q=Bungalow+Restaurant+Lekki+Lagos' },
  { id: 'f4', name: 'Cactus Restaurant', category: 'food', lat: 6.4281, lng: 3.4260, area: 'VI', rating: 4.2, description: 'Iconic Lagos restaurant on Victoria Island since the 90s.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Cactus+Restaurant+Victoria+Island' },
  { id: 'f5', name: 'Mama Cass', category: 'food', lat: 6.4298, lng: 3.4210, area: 'VI', rating: 4.0, description: 'Famous local food chain — pepper soup, egusi, amala.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Mama+Cass+Victoria+Island+Lagos' },
  { id: 'f6', name: 'Yellow Chilli', category: 'food', lat: 6.6010, lng: 3.3510, area: 'Ikeja', rating: 4.4, description: 'Modern Nigerian restaurant famous for their asun and pepper soup.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Yellow+Chilli+Ikeja+Lagos' },
  { id: 'f7', name: 'Craft Grill', category: 'food', lat: 6.4320, lng: 3.4240, area: 'VI', rating: 4.5, description: 'Wood-fired grills and craft cocktails on the island.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Craft+Grill+Victoria+Island+Lagos' },

  // ── NIGHTLIFE ──
  { id: 'n1', name: 'Quilox Club', category: 'nightlife', lat: 6.4291, lng: 3.4216, area: 'VI', rating: 4.5, description: 'Lagos\' most famous high-energy nightclub on Victoria Island.', sponsored: true, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Quilox+Club+Victoria+Island+Lagos' },
  { id: 'n2', name: 'Club 57', category: 'nightlife', lat: 6.4450, lng: 3.4630, area: 'Oniru', rating: 4.3, description: 'Exclusive members-style club in Oniru Estate.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Club+57+Oniru+Lagos' },
  { id: 'n3', name: 'Cubana Nightclub', category: 'nightlife', lat: 6.4277, lng: 3.4198, area: 'VI', rating: 4.2, description: 'Big-name DJs, bottle service, Lagos\'s elite crowd.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Cubana+Victoria+Island+Lagos' },
  { id: 'n4', name: 'Hard Rock Cafe Lagos', category: 'nightlife', lat: 6.4295, lng: 3.4225, area: 'VI', rating: 4.4, description: 'International franchise with live music on weekends.', sponsored: true, cta: 'Book a Table', mapUrl: 'https://maps.google.com/?q=Hard+Rock+Cafe+Lagos' },
  { id: 'n5', name: 'Shiro Lagos', category: 'nightlife', lat: 6.4340, lng: 3.4275, area: 'VI', rating: 4.6, description: 'Pan-Asian restaurant by day, Lagos hottest club by night.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Shiro+Lagos+Victoria+Island' },

  // ── BARS ──
  { id: 'b1', name: 'Sky Bar (Eko Hotel)', category: 'bars', lat: 6.4283, lng: 3.4211, area: 'VI', rating: 4.5, description: 'Rooftop bar with panoramic Lagos skyline views.', sponsored: true, cta: 'Reserve a Spot', mapUrl: 'https://maps.google.com/?q=Eko+Hotel+Sky+Bar+Lagos' },
  { id: 'b2', name: 'Rufus & Bee', category: 'bars', lat: 6.4498, lng: 3.4545, area: 'Lekki Phase 1', rating: 4.4, description: 'Craft cocktails and artisan snacks in Lekki.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Rufus+and+Bee+Lekki+Lagos' },
  { id: 'b3', name: 'The Lighthouse Bar', category: 'bars', lat: 6.4302, lng: 3.4252, area: 'VI', rating: 4.3, description: 'Nautical-themed waterfront bar on the Lagos lagoon.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Lighthouse+Bar+Victoria+Island+Lagos' },
  { id: 'b4', name: 'Tsakani Lounge', category: 'bars', lat: 6.4600, lng: 3.3650, area: 'Ikoyi', rating: 4.2, description: 'Sophisticated lounge with old-money Ikoyi vibes.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Tsakani+Lounge+Ikoyi+Lagos' },

  // ── BEACHES ──
  { id: 'be1', name: 'Elegushi Beach', category: 'beaches', lat: 6.4497, lng: 3.5601, area: 'Lekki', rating: 4.1, description: 'Most popular Lagos beach — bar, music, and volleyball.', sponsored: true, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Elegushi+Beach+Lekki+Lagos' },
  { id: 'be2', name: 'Tarkwa Bay Beach', category: 'beaches', lat: 6.4016, lng: 3.3854, area: 'Lagos Island', rating: 4.5, description: 'Hidden gem accessible only by boat — calm waters, no waves.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Tarkwa+Bay+Beach+Lagos' },
  { id: 'be3', name: 'Alpha Beach', category: 'beaches', lat: 6.4350, lng: 3.5800, area: 'Lekki', rating: 3.9, description: 'Laid-back beach with buka food and suya stalls.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Alpha+Beach+Lekki+Lagos' },
  { id: 'be4', name: 'La Campagne Tropicana', category: 'beaches', lat: 6.5192, lng: 4.0320, area: 'Ibeju-Lekki', rating: 4.8, description: 'Luxury eco-resort hidden in Ibeju-Lekki — treehouse lodges.', sponsored: true, cta: 'Book a Stay', mapUrl: 'https://maps.google.com/?q=La+Campagne+Tropicana+Ibeju-Lekki' },

  // ── PARKS ──
  { id: 'p1', name: 'Freedom Park', category: 'parks', lat: 6.4541, lng: 3.3916, area: 'Lagos Island', rating: 4.4, description: 'Historic park built on the site of a colonial prison — live concerts on weekends.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Freedom+Park+Lagos+Island' },
  { id: 'p2', name: 'Lekki Conservation Centre', category: 'parks', lat: 6.4477, lng: 3.5486, area: 'Lekki', rating: 4.6, description: 'Natural reserve with Africa\'s longest canopy walkway (401m).', sponsored: true, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Lekki+Conservation+Centre+Lagos' },
  { id: 'p3', name: 'Ikoyi Park', category: 'parks', lat: 6.4523, lng: 3.4398, area: 'Ikoyi', rating: 4.0, description: 'Serene green space popular with joggers and families.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Ikoyi+Park+Lagos' },
  { id: 'p4', name: 'Muri Okunola Park', category: 'parks', lat: 6.4295, lng: 3.4253, area: 'VI', rating: 4.2, description: 'Open amphitheatre used for concerts, corporate events, and exhibitions.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Muri+Okunola+Park+Victoria+Island' },

  // ── CINEMA ──
  { id: 'c1', name: 'Genesis Cinemas (The Palms)', category: 'cinema', lat: 6.4487, lng: 3.5419, area: 'Lekki', rating: 4.4, description: 'Flagship Genesis Cinemas — biggest screens in Lagos.', sponsored: true, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Genesis+Cinemas+The+Palms+Lekki' },
  { id: 'c2', name: 'Filmhouse Cinemas (Surulere)', category: 'cinema', lat: 6.4960, lng: 3.3562, area: 'Surulere', rating: 4.3, description: 'Beloved cinema in the heart of Surulere.', sponsored: false, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Filmhouse+Cinemas+Surulere+Lagos' },
  { id: 'c3', name: 'Silver Bird Cinemas (Ikeja)', category: 'cinema', lat: 6.6028, lng: 3.3502, area: 'Ikeja', rating: 4.1, description: 'Multiplex cinema at Ikeja City Mall with IMAX screen.', sponsored: false, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Silverbird+Cinemas+Ikeja+City+Mall' },
  { id: 'c4', name: 'Viva Cinema (Lekki)', category: 'cinema', lat: 6.4400, lng: 3.5700, area: 'Lekki', rating: 4.0, description: 'Modern cinema in Circle Mall Lekki.', sponsored: false, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Viva+Cinema+Lekki' },

  // ── ART & CULTURE ──
  { id: 'a1', name: 'Nike Art Gallery', category: 'art', lat: 6.4506, lng: 3.4474, area: 'Lekki', rating: 4.7, description: 'Four-floor gallery with 8,000+ original artworks by Nike Davies-Okundaye.', sponsored: false, cta: 'Plan a Visit', mapUrl: 'https://maps.google.com/?q=Nike+Art+Gallery+Lekki+Lagos' },
  { id: 'a2', name: 'Terra Kulture', category: 'art', lat: 6.4301, lng: 3.4262, area: 'VI', rating: 4.5, description: 'Premier cultural centre — theatre, gallery, language classes, and restaurant.', sponsored: true, cta: 'View Events', mapUrl: 'https://maps.google.com/?q=Terra+Kulture+Victoria+Island+Lagos' },
  { id: 'a3', name: 'Afrika Shrine', category: 'art', lat: 6.5774, lng: 3.3212, area: 'Ikeja', rating: 4.6, description: 'Fela Kuti\'s legendary shrine — live afrobeat every Sunday.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Afrika+Shrine+Ikeja+Lagos' },
  { id: 'a4', name: 'National Museum Lagos', category: 'art', lat: 6.4553, lng: 3.3959, area: 'Lagos Island', rating: 4.2, description: 'Houses Benin Bronzes, ancient artifacts, and Nigeria\'s first car.', sponsored: false, cta: 'Plan a Visit', mapUrl: 'https://maps.google.com/?q=National+Museum+Lagos+Island' },
  { id: 'a5', name: 'MUSON Centre', category: 'art', lat: 6.4545, lng: 3.3945, area: 'Lagos Island', rating: 4.4, description: 'Music Society of Nigeria — orchestral concerts and world-class performances.', sponsored: false, cta: 'View Events', mapUrl: 'https://maps.google.com/?q=MUSON+Centre+Lagos+Island' },

  // ── FITNESS ──
  { id: 'fi1', name: 'Body Perfect Fitness', category: 'fitness', lat: 6.4310, lng: 3.4270, area: 'VI', rating: 4.2, description: 'Full-service gym with personal trainers and group classes.', sponsored: true, cta: 'Book a Session', mapUrl: 'https://maps.google.com/?q=Body+Perfect+Fitness+Victoria+Island' },
  { id: 'fi2', name: 'Fitness Plus (Ikeja)', category: 'fitness', lat: 6.6040, lng: 3.3510, area: 'Ikeja', rating: 4.0, description: 'Affordable gym chains across Lagos.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Fitness+Plus+Ikeja+Lagos' },
  { id: 'fi3', name: 'Ikoyi Club (Tennis & Sports)', category: 'fitness', lat: 6.4612, lng: 3.4312, area: 'Ikoyi', rating: 4.6, description: 'Historic private sports club — tennis, swimming, squash.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Ikoyi+Club+1938+Lagos' },

  // ── SHOPPING ──
  { id: 's1', name: 'The Palms Shopping Mall', category: 'shopping', lat: 6.4487, lng: 3.5419, area: 'Lekki', rating: 4.3, description: 'Lekki\'s premier mall — brands, cinema, food court.', sponsored: true, cta: 'Explore Mall', mapUrl: 'https://maps.google.com/?q=The+Palms+Shopping+Mall+Lekki' },
  { id: 's2', name: 'Balogun Market', category: 'shopping', lat: 6.4558, lng: 3.3965, area: 'Lagos Island', rating: 4.1, description: 'Lagos\'s largest open market — fabrics, electronics, fashion.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Balogun+Market+Lagos+Island' },
  { id: 's3', name: 'Computer Village', category: 'shopping', lat: 6.6028, lng: 3.3502, area: 'Ikeja', rating: 4.2, description: 'Africa\'s largest tech market — phones, laptops, accessories.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Computer+Village+Ikeja+Lagos' },
  { id: 's4', name: 'Ikeja City Mall', category: 'shopping', lat: 6.6045, lng: 3.3498, area: 'Ikeja', rating: 4.4, description: 'Modern mall with international retailers, cinema and food court.', sponsored: true, cta: 'Explore Mall', mapUrl: 'https://maps.google.com/?q=Ikeja+City+Mall+Lagos' },

  // ── HOTELS ──
  { id: 'h1', name: 'Eko Hotel & Suites', category: 'hotels', lat: 6.4283, lng: 3.4211, area: 'VI', rating: 4.5, description: 'Lagos\'s iconic 5-star hotel with multiple towers and facilities.', sponsored: true, cta: 'Book a Room', mapUrl: 'https://maps.google.com/?q=Eko+Hotel+Suites+Victoria+Island' },
  { id: 'h2', name: 'Radisson Blu Lagos', category: 'hotels', lat: 6.4315, lng: 3.4278, area: 'VI', rating: 4.6, description: 'International luxury hotel in the heart of Victoria Island.', sponsored: false, cta: 'Book a Room', mapUrl: 'https://maps.google.com/?q=Radisson+Blu+Anchorage+Hotel+Lagos' },
  { id: 'h3', name: 'Lagos Continental Hotel', category: 'hotels', lat: 6.4302, lng: 3.4244, area: 'VI', rating: 4.3, description: 'Formerly InterContinental — Lagos landmark hotel.', sponsored: false, cta: 'Book a Room', mapUrl: 'https://maps.google.com/?q=Lagos+Continental+Hotel' },
  { id: 'h4', name: 'Four Points by Sheraton', category: 'hotels', lat: 6.4319, lng: 3.4265, area: 'VI', rating: 4.4, description: 'Business-friendly hotel with rooftop pool.', sponsored: false, cta: 'Book a Room', mapUrl: 'https://maps.google.com/?q=Four+Points+Sheraton+Victoria+Island+Lagos' },

  // ── CO-WORKING ──
  { id: 'cw1', name: 'CcHUB', category: 'coworking', lat: 6.4969, lng: 3.3715, area: 'Yaba', rating: 4.7, description: 'Nigeria\'s pioneer tech hub — home to 400+ startups since 2011.', sponsored: false, cta: 'Visit CcHUB', mapUrl: 'https://maps.google.com/?q=CcHUB+Yaba+Lagos' },
  { id: 'cw2', name: 'LeadSpace', category: 'coworking', lat: 6.4320, lng: 3.4270, area: 'VI', rating: 4.4, description: 'Premium co-working space in Victoria Island.', sponsored: false, cta: 'Book a Desk', mapUrl: 'https://maps.google.com/?q=LeadSpace+Victoria+Island+Lagos' },
  { id: 'cw3', name: 'Venia Business Hub', category: 'coworking', lat: 6.6050, lng: 3.3540, area: 'Ikeja', rating: 4.3, description: 'Affordable co-working with event space in Ikeja.', sponsored: false, cta: 'Book a Desk', mapUrl: 'https://maps.google.com/?q=Venia+Business+Hub+Ikeja+Lagos' },
  { id: 'cw4', name: 'The Hive Lagos', category: 'coworking', lat: 6.4485, lng: 3.4518, area: 'Lekki', rating: 4.2, description: 'Creative co-working space on the Lekki corridor.', sponsored: true, cta: 'Book a Desk', mapUrl: 'https://maps.google.com/?q=The+Hive+Lagos+Lekki' },

  // ── SPORTS ──
  { id: 'sp1', name: 'Teslim Balogun Stadium', category: 'sports', lat: 6.4969, lng: 3.3600, area: 'Surulere', rating: 4.1, description: 'Home of Lagos State football — matches on weekends.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Teslim+Balogun+Stadium+Surulere+Lagos' },
  { id: 'sp2', name: 'National Stadium Surulere', category: 'sports', lat: 6.5050, lng: 3.3680, area: 'Surulere', rating: 3.9, description: 'Nigeria\'s historic sports complex — athletics, boxing, swimming.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=National+Stadium+Surulere+Lagos' },
  { id: 'sp3', name: 'Onikan Stadium', category: 'sports', lat: 6.4560, lng: 3.3970, area: 'Lagos Island', rating: 4.0, description: 'Compact stadium on Lagos Island used for local league matches.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Onikan+Stadium+Lagos+Island' },

  // ── KIDS ──
  { id: 'k1', name: 'Fun Factory (The Palms)', category: 'kids', lat: 6.4487, lng: 3.5419, area: 'Lekki', rating: 4.3, description: 'Indoor entertainment park for kids — rides, games, bowling.', sponsored: true, cta: 'Plan a Visit', mapUrl: 'https://maps.google.com/?q=Fun+Factory+The+Palms+Lekki' },
  { id: 'k2', name: 'Funtopia (Ikeja)', category: 'kids', lat: 6.6028, lng: 3.3502, area: 'Ikeja', rating: 4.1, description: 'Children\'s indoor playground at Ikeja City Mall.', sponsored: false, cta: 'Plan a Visit', mapUrl: 'https://maps.google.com/?q=Funtopia+Ikeja+City+Mall' },
  { id: 'k3', name: 'Dreamworld Africana', category: 'kids', lat: 6.4390, lng: 3.4790, area: 'Lekki', rating: 4.4, description: 'Outdoor theme park with rides, petting zoo and swimming.', sponsored: false, cta: 'Buy Tickets', mapUrl: 'https://maps.google.com/?q=Dreamworld+Africana+Lekki+Lagos' },

  // ── TRANSIT ──
  { id: 't1', name: 'TBS Bus Terminal', category: 'transport', lat: 6.4535, lng: 3.3910, area: 'Lagos Island', rating: 3.8, description: 'Tafawa Balewa Square — main BRT terminal for Lagos Island.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=TBS+Bus+Terminal+Lagos' },
  { id: 't2', name: 'Mile 12 Bus Terminal', category: 'transport', lat: 6.5919, lng: 3.3956, area: 'Kosofe', rating: 3.7, description: 'Major BRT/danfo hub connecting Kosofe to Lagos Island.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Mile+12+Bus+Terminal+Lagos' },
  { id: 't3', name: 'Ajah Bus Stop', category: 'transport', lat: 6.4680, lng: 3.5880, area: 'Ajah', rating: 3.9, description: 'Key transit hub for Lekki-Ajah corridor commuters.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Ajah+Bus+Stop+Lagos' },

  // ── FREE WIFI ──
  { id: 'w1', name: 'CcHUB (Public WiFi Zone)', category: 'wifi', lat: 6.4969, lng: 3.3715, area: 'Yaba', rating: 4.6, description: 'Free WiFi in the co-working lobby during open hours.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=CcHUB+Yaba+Lagos' },
  { id: 'w2', name: 'Lagos State Library', category: 'wifi', lat: 6.4560, lng: 3.3985, area: 'Lagos Island', rating: 4.0, description: 'Free public library with reading rooms and WiFi.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=Lagos+State+Central+Library' },
  { id: 'w3', name: 'The Palms Food Court', category: 'wifi', lat: 6.4487, lng: 3.5419, area: 'Lekki', rating: 4.1, description: 'Free WiFi while you dine at The Palms mall.', sponsored: false, cta: 'Get Directions', mapUrl: 'https://maps.google.com/?q=The+Palms+Shopping+Mall+Lekki' },
]

// Enrich each POI with its real downloaded image and logo
DISCOVERY_POIS.forEach(poi => {
  poi.image = SITE_IMAGES[poi.id]?.[0] || null
  poi.images = SITE_IMAGES[poi.id] || []
  poi.logo = SITE_LOGOS[poi.id] || null
})

export function getPOIsByCategory(categoryId) {
  if (categoryId === 'all') return DISCOVERY_POIS
  return DISCOVERY_POIS.filter(p => p.category === categoryId)
}

export function getSponsored() {
  return DISCOVERY_POIS.filter(p => p.sponsored)
}

export function getPOIById(id) {
  return DISCOVERY_POIS.find(p => p.id === id)
}
