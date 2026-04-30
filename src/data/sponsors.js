// Sponsored Pins — placeholder sponsors linked to quiz questions
// When a real sponsor signs up, replace placeholder data with their info.
//
// SPONSOR INFO NEEDED FROM EACH BUSINESS:
// ─────────────────────────────────────────
// 1. Business name
// 2. Address / location in Lagos or Abuja
// 3. Contact: phone, email, website
// 4. One-liner promotional message (max 100 chars)
// 5. CTA label: e.g. "Get Directions", "Book Now", "Visit Website"
// 6. CTA URL: Google Maps link, website, or booking page
// 7. Logo (PNG, 200x200 min) — optional, emoji used if not provided
// 8. Product photos (optional, for rich cards)
// 9. Tier preference: Bronze (₦50K/mo), Silver (₦150K/mo), Gold (₦500K/mo)
// 10. Campaign duration: start date → end date
// ─────────────────────────────────────────

export const SPONSORS = [
  {
    id: 'sp-palms',
    questionIds: ['lm-03', 'to-05', 'mk-09'],
    brand: 'The Palms Shopping Mall',
    icon: '🛍️',
    logo: 'https://logo.clearbit.com/thepalmsmall.com',
    message: 'Visit The Palms this weekend — 150+ stores, cinema & restaurants!',
    cta: 'Get Directions',
    url: 'https://maps.google.com/?q=The+Palms+Shopping+Mall+Lagos',
    tier: 'silver',
    active: true,
  },
  {
    id: 'sp-ekohotel',
    questionIds: ['lm-05', 'to-12', 'is-01'],
    brand: 'Eko Hotels & Suites',
    icon: '🏨',
    logo: 'https://logo.clearbit.com/ekohotels.com',
    message: 'Experience luxury at Eko Hotels — weekend packages from ₦65,000',
    cta: 'Book Now',
    url: 'https://www.ekohotels.com',
    tier: 'gold',
    active: true,
  },
  {
    id: 'sp-lekki',
    questionIds: ['to-03', 'to-08', 'na-03'],
    brand: 'Lekki Conservation Centre',
    icon: '🌿',
    logo: 'https://logo.clearbit.com/lfrn.org',
    message: 'Walk the longest canopy walkway in Africa — open daily 8am-5pm',
    cta: 'Plan Visit',
    url: 'https://maps.google.com/?q=Lekki+Conservation+Centre',
    tier: 'bronze',
    active: true,
  },
  {
    id: 'sp-transcorp',
    questionIds: ['abj-18', 'abj-04', 'abj-01'],
    brand: 'Transcorp Hilton Abuja',
    icon: '🏛️',
    logo: 'https://logo.clearbit.com/transcorphilton.com',
    message: 'Nigerias finest — dine, stay, and experience Abuja in style',
    cta: 'Explore',
    url: 'https://www.transcorphilton.com',
    tier: 'gold',
    active: true,
  },
  {
    id: 'sp-nike',
    questionIds: ['cu-01', 'cu-09', 'cu-12'],
    brand: 'Nike Art Gallery, Lekki',
    icon: '🎨',
    logo: 'https://logo.clearbit.com/nikeart.com',
    message: '8,000+ artworks across 5 floors — the largest gallery in West Africa',
    cta: 'Visit Gallery',
    url: 'https://maps.google.com/?q=Nike+Art+Gallery+Lekki',
    tier: 'silver',
    active: true,
  },
]

// Get sponsor for a question (30% impression rate)
export function getSponsorForQuestion(questionId) {
  const sponsor = SPONSORS.find(s => s.active && s.questionIds.includes(questionId))
  if (!sponsor) return null
  // 30% chance to show (respect user experience)
  if (Math.random() > 0.3) return null
  return sponsor
}

// Get relevant sponsors for results page based on answered questions
export function getJourneySponsors(questionIds) {
  const seen = new Set()
  return SPONSORS.filter(s => {
    if (!s.active || seen.has(s.id)) return false
    const match = s.questionIds.some(qid => questionIds.includes(qid))
    if (match) seen.add(s.id)
    return match
  }).slice(0, 3) // Max 3 sponsors on results
}
