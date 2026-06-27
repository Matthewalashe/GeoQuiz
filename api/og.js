// Vercel Serverless Function — OG Meta Tag Server
// Receives ?path= and returns crawler-friendly HTML with OG, Twitter, and JSON-LD tags.

const SITE_URL = 'https://visitnaija.online'
const SITE_NAME = 'Wanda — Experience Nigeria'

const STATIC_ROUTES = {
  '/': {
    title: 'Wanda — Experience Nigeria | Discover, Play, Explore',
    description: "Discover the best of Nigeria — attractions, restaurants, hotels, events, handymen, and experiences. Play geography games, earn rewards, and explore Lagos with the Wanda Pass.",
    image: `${SITE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Wanda',
      alternateName: 'Visit Naija',
      url: SITE_URL,
      description: "Nigeria's all-in-one city experience platform.",
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
      author: { '@type': 'Organization', name: 'WhiteArts Technologies', url: SITE_URL },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      inLanguage: 'en',
    },
  },
  '/explore': {
    title: 'Explore Lagos — Attractions, Restaurants, Hotels | Wanda',
    description: "Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos. Find the best spots with ratings, reviews, and directions.",
    image: `${SITE_URL}/og/og-explore.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Explore Lagos',
      description: 'Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos.',
      url: `${SITE_URL}/explore`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/play': {
    title: 'Play Nigerian Geography Games — 8 Modes, 260+ Questions | Wanda',
    description: "Play fun geography quiz games about Nigeria. Guess locations on the map, unscramble words, solve trivia, earn XP and coins. Test your knowledge of Lagos and Nigeria!",
    image: `${SITE_URL}/og/og-play.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Play Nigerian Geography Games',
      description: 'Play fun geography quiz games about Nigeria with 8 game modes and 260+ questions.',
      url: `${SITE_URL}/play`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/pass': {
    title: 'Wanda Pass — One Pass, All of Lagos | Wanda',
    description: "Discover events in Lagos and Nigeria. Create events, sell tickets, and manage your Wanda Pass for exclusive access to experiences.",
    image: `${SITE_URL}/og/og-pass.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Wanda Pass — Events & Experiences',
      description: 'Discover events in Lagos and Nigeria. RSVP, get tickets, and access exclusive experiences.',
      url: `${SITE_URL}/pass`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/list-your-business': {
    title: "List Your Business Free on Wanda | Nigeria's Discovery App",
    description: "Get your Nigerian business discovered by thousands. List your restaurant, hotel, service, or experience on Wanda for free. Reach new customers today.",
    image: `${SITE_URL}/og/og-list-business.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'List Your Business on Wanda',
      description: 'Get your Nigerian business discovered by thousands. List for free.',
      url: `${SITE_URL}/list-your-business`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/handymen': {
    title: 'Find Trusted Handymen in Lagos | Wanda',
    description: "Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos. Verified reviews and instant contact.",
    image: `${SITE_URL}/og/og-handymen.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Find Trusted Handymen in Lagos',
      description: 'Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos.',
      url: `${SITE_URL}/handymen`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/about': {
    title: 'About Wanda — Experience Nigeria',
    description: "Learn about Wanda — Nigeria's all-in-one city experience platform built by WhiteArts Technologies. Our mission, team, and vision for Nigerian tourism.",
    image: `${SITE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Wanda',
      description: "Learn about Wanda — Nigeria's all-in-one city experience platform.",
      url: `${SITE_URL}/about`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  },
  '/leaderboard': {
    title: 'Leaderboard — Top Players | Wanda',
    description: "See who's the top geography champion! View global and weekly leaderboards.",
    image: `${SITE_URL}/og/og-play.png`,
  },
  '/community': {
    title: 'Community — Connect with Nigerian Explorers | Wanda',
    description: "Join the Wanda community. Share discoveries, post reviews, connect with fellow Nigeria explorers.",
    image: `${SITE_URL}/og/og-home.png`,
  },
  '/deals': {
    title: 'Deals & Offers — Lagos Discounts | Wanda',
    description: "Find the best deals and exclusive offers from restaurants, hotels, beaches, and entertainment venues across Lagos.",
    image: `${SITE_URL}/og/og-explore.png`,
  },
  '/discovery': {
    title: 'Discovery — Hidden Gems in Lagos | Wanda',
    description: "Discover curated places, hidden gems, and sponsored experiences across Lagos.",
    image: `${SITE_URL}/og/og-explore.png`,
  },
  '/rewards': {
    title: 'Rewards & Store | Wanda',
    description: "Spend your earned coins on exclusive themes, map skins, and power-ups.",
    image: `${SITE_URL}/og/og-play.png`,
  },
  '/wordgame': {
    title: 'Guess the Word — Nigerian Places & Culture | Wanda',
    description: "Unscramble letters to guess Nigerian places, people, and cultural terms.",
    image: `${SITE_URL}/og/og-play.png`,
  },
  '/trivia': {
    title: 'Trivia Challenge — Nigerian History & Culture | Wanda',
    description: "Test your knowledge of Nigerian history, geography, culture, and more.",
    image: `${SITE_URL}/og/og-play.png`,
  },
  '/challenge': {
    title: 'Daily Challenge | Wanda',
    description: "Take on today's geography challenge and compete with other players.",
    image: `${SITE_URL}/og/og-play.png`,
  },
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
}

module.exports = function handler(req, res) {
  const path = req.query.path || '/'
  const route = STATIC_ROUTES[path]

  if (!route) {
    res.writeHead(302, { Location: SITE_URL })
    res.end()
    return
  }

  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  const image = escapeHtml(route.image)
  const canonicalUrl = path === '/' ? SITE_URL : `${SITE_URL}${path}`
  const escapedCanonicalUrl = escapeHtml(canonicalUrl)

  const jsonLdScript = route.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${escapedCanonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapedCanonicalUrl}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Wanda — Experience Nigeria" />
  <meta property="og:locale" content="en_NG" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  ${jsonLdScript}
  <meta http-equiv="refresh" content="0;url=${escapedCanonicalUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${escapedCanonicalUrl}">Visit page</a>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.status(200).send(html)
}
