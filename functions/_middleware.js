// Cloudflare Pages Middleware
// Runs at the edge for EVERY request before static assets are served.
// 1) Ensures HTML, sw.js, and version.json are NEVER cached by any browser.
// 2) Injects dynamic Open Graph tags for /pass/:slug event pages when
//    social-media crawlers request them (WhatsApp, Twitter, Facebook, etc.).

const SUPABASE_URL = 'https://xyfqpnveymkpizltwsdo.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ZUVjfpO9kPvpzjng_XUwYw_Ov6lcoSA'

const CF_SITE_URL = 'https://visitnaija.online'
const CF_SITE_NAME = 'Wanda — Experience Nigeria'

const STATIC_ROUTES = {
  '/': {
    title: 'Wanda — Experience Nigeria | Discover, Play, Explore',
    description: "Discover the best of Nigeria — attractions, restaurants, hotels, events, handymen, and experiences. Play geography games, earn rewards, and explore Lagos with the Wanda Pass.",
    image: `${CF_SITE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Wanda',
      alternateName: 'Visit Naija',
      url: CF_SITE_URL,
      description: "Nigeria's all-in-one city experience platform.",
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
      author: { '@type': 'Organization', name: 'WhiteArts Technologies', url: CF_SITE_URL },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      inLanguage: 'en',
    },
  },
  '/explore': {
    title: 'Explore Lagos — Attractions, Restaurants, Hotels | Wanda',
    description: "Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos. Find the best spots with ratings, reviews, and directions.",
    image: `${CF_SITE_URL}/og/og-explore.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Explore Lagos',
      description: 'Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos.',
      url: `${CF_SITE_URL}/explore`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/play': {
    title: 'Play Nigerian Geography Games — 8 Modes, 260+ Questions | Wanda',
    description: "Play fun geography quiz games about Nigeria. Guess locations on the map, unscramble words, solve trivia, earn XP and coins. Test your knowledge of Lagos and Nigeria!",
    image: `${CF_SITE_URL}/og/og-play.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Play Nigerian Geography Games',
      description: 'Play fun geography quiz games about Nigeria with 8 game modes and 260+ questions.',
      url: `${CF_SITE_URL}/play`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/pass': {
    title: 'Wanda Pass — One Pass, All of Lagos | Wanda',
    description: "Discover events in Lagos and Nigeria. Create events, sell tickets, and manage your Wanda Pass for exclusive access to experiences.",
    image: `${CF_SITE_URL}/og/og-pass.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Wanda Pass — Events & Experiences',
      description: 'Discover events in Lagos and Nigeria. RSVP, get tickets, and access exclusive experiences.',
      url: `${CF_SITE_URL}/pass`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/list-your-business': {
    title: "List Your Business Free on Wanda | Nigeria's Discovery App",
    description: "Get your Nigerian business discovered by thousands. List your restaurant, hotel, service, or experience on Wanda for free. Reach new customers today.",
    image: `${CF_SITE_URL}/og/og-list-business.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'List Your Business on Wanda',
      description: 'Get your Nigerian business discovered by thousands. List for free.',
      url: `${CF_SITE_URL}/list-your-business`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/handymen': {
    title: 'Find Trusted Handymen in Lagos | Wanda',
    description: "Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos. Verified reviews and instant contact.",
    image: `${CF_SITE_URL}/og/og-handymen.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Find Trusted Handymen in Lagos',
      description: 'Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos.',
      url: `${CF_SITE_URL}/handymen`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/about': {
    title: 'About Wanda — Experience Nigeria',
    description: "Learn about Wanda — Nigeria's all-in-one city experience platform built by WhiteArts Technologies. Our mission, team, and vision for Nigerian tourism.",
    image: `${CF_SITE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Wanda',
      description: "Learn about Wanda — Nigeria's all-in-one city experience platform.",
      url: `${CF_SITE_URL}/about`,
      isPartOf: { '@type': 'WebSite', name: CF_SITE_NAME, url: CF_SITE_URL },
    },
  },
  '/leaderboard': {
    title: 'Leaderboard — Top Players | Wanda',
    description: "See who's the top geography champion! View global and weekly leaderboards.",
    image: `${CF_SITE_URL}/og/og-play.png`,
  },
  '/community': {
    title: 'Community — Connect with Nigerian Explorers | Wanda',
    description: "Join the Wanda community. Share discoveries, post reviews, connect with fellow Nigeria explorers.",
    image: `${CF_SITE_URL}/og/og-home.png`,
  },
  '/deals': {
    title: 'Deals & Offers — Lagos Discounts | Wanda',
    description: "Find the best deals and exclusive offers from restaurants, hotels, beaches, and entertainment venues across Lagos.",
    image: `${CF_SITE_URL}/og/og-explore.png`,
  },
  '/discovery': {
    title: 'Discovery — Hidden Gems in Lagos | Wanda',
    description: "Discover curated places, hidden gems, and sponsored experiences across Lagos.",
    image: `${CF_SITE_URL}/og/og-explore.png`,
  },
  '/rewards': {
    title: 'Rewards & Store | Wanda',
    description: "Spend your earned coins on exclusive themes, map skins, and power-ups.",
    image: `${CF_SITE_URL}/og/og-play.png`,
  },
  '/wordgame': {
    title: 'Guess the Word — Nigerian Places & Culture | Wanda',
    description: "Unscramble letters to guess Nigerian places, people, and cultural terms.",
    image: `${CF_SITE_URL}/og/og-play.png`,
  },
  '/trivia': {
    title: 'Trivia Challenge — Nigerian History & Culture | Wanda',
    description: "Test your knowledge of Nigerian history, geography, culture, and more.",
    image: `${CF_SITE_URL}/og/og-play.png`,
  },
  '/challenge': {
    title: 'Daily Challenge | Wanda',
    description: "Take on today's geography challenge and compete with other players.",
    image: `${CF_SITE_URL}/og/og-play.png`,
  },
}

function buildStaticOgHtml(route, routePath) {
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  const image = escapeHtml(route.image)
  const canonicalUrl = routePath === '/' ? CF_SITE_URL : `${CF_SITE_URL}${routePath}`
  const escapedCanonicalUrl = escapeHtml(canonicalUrl)

  const jsonLdScript = route.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`
    : ''

  return `<!DOCTYPE html>
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
}

// Crawlers that need OG meta tags
const CRAWLER_AGENTS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'TelegramBot', 'WhatsApp', 'Discordbot',
  'Pinterest', 'Applebot', 'Googlebot', 'bingbot',
]

function isCrawler(userAgent) {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return CRAWLER_AGENTS.some(bot => ua.includes(bot.toLowerCase()))
}

// Extract event slug from path like /pass/my-event-abc123
function getEventSlug(path) {
  const match = path.match(/^\/pass\/([a-z0-9][a-z0-9\-]+)$/)
  if (!match) return null
  const slug = match[1]
  // Exclude known non-event routes
  if (slug === 'create') return null
  return slug
}

// Fetch event data from Supabase
async function fetchEvent(slug) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=id,title,description,category,image_url,start_date,venue_name,venue_type,is_free,price,max_capacity&limit=1`
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.length > 0 ? data[0] : null
  } catch {
    return null
  }
}

// Fetch RSVP count for the event
async function fetchRsvpCount(eventId) {
  if (!eventId) return 0
  try {
    const rsvpUrl = `${SUPABASE_URL}/rest/v1/event_rsvps?event_id=eq.${eventId}&status=eq.interested&select=id`
    const rsvpRes = await fetch(rsvpUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json',
        'Prefer': 'count=exact',
      },
    })
    if (!rsvpRes.ok) return 0
    const countHeader = rsvpRes.headers.get('content-range')
    if (countHeader) {
      const parts = countHeader.split('/')
      if (parts[1]) return parseInt(parts[1], 10) || 0
    }
    const rsvpData = await rsvpRes.json()
    return Array.isArray(rsvpData) ? rsvpData.length : 0
  } catch {
    return 0
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  } catch {
    return ''
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildOgHtml(event, slug, rsvpCount) {
  const siteUrl = 'https://visitnaija.online'
  const eventUrl = `${siteUrl}/pass/${slug}`
  const title = event.title || 'Event on Wanda'
  const image = event.image_url || `${siteUrl}/icon-512.png`

  // Build an exciting description
  const parts = []
  if (event.start_date) parts.push(`\u{1F4C5} ${formatDate(event.start_date)}`)
  if (event.venue_name) parts.push(`\u{1F4CD} ${event.venue_name}`)
  else if (event.venue_type === 'virtual') parts.push('\u{1F4BB} Online Event')
  if (event.is_free) parts.push('\u{1F389} FREE')
  else if (event.price) parts.push(`\u{1F4B0} \u20A6${Number(event.price).toLocaleString()}`)
  if (rsvpCount > 0) parts.push(`\u{1F465} ${rsvpCount} already going`)
  const desc = parts.length > 0
    ? `${parts.join(' \u2022 ')} \u2014 RSVP now on Wanda!`
    : (event.description || 'Discover and RSVP to amazing events on Wanda!').slice(0, 200)

  const categoryEmoji = event.category === 'Hangout' ? '\u{1F3D6}\uFE0F' : event.category === 'Party' ? '\u{1F389}' : event.category === 'Concert' ? '\u{1F3B5}' : '\u{1F525}'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${categoryEmoji} ${escapeHtml(title)} \u2014 Wanda Events</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta property="og:title" content="${categoryEmoji} ${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${eventUrl}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Wanda \u2014 Experience Nigeria" />
  <meta property="og:locale" content="en_NG" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${categoryEmoji} ${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${eventUrl}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(desc)}</p>
  <a href="${eventUrl}">View event on Wanda</a>
</body>
</html>`
}

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const path = url.pathname
  const userAgent = context.request.headers.get('user-agent') || ''

  // --- Dynamic OG Tags for Event Pages ---
  if (isCrawler(userAgent)) {
    const slug = getEventSlug(path)
    if (slug) {
      try {
        const event = await fetchEvent(slug)
        if (event) {
          const rsvpCount = await fetchRsvpCount(event.id)
          const html = buildOgHtml(event, slug, rsvpCount)
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=300, s-maxage=300',
            },
          })
        }
      } catch (e) {
        console.error('[OG Middleware] Error:', e.message)
      }
    }

    // --- Static Route OG Tags ---
    const staticRoute = STATIC_ROUTES[path]
    if (staticRoute) {
      const html = buildStaticOgHtml(staticRoute, path)
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    }
  }

  // --- Normal Request Handling ---
  const response = await context.next()

  // For HTML pages, service worker, and version file: aggressive no-cache
  if (
    path === '/' ||
    path.endsWith('.html') ||
    path === '/sw.js' ||
    path === '/version.json' ||
    path === '/manifest.json'
  ) {
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    newResponse.headers.set('Pragma', 'no-cache')
    newResponse.headers.set('Expires', '0')
    newResponse.headers.set('X-Wanda-Version', '4.0')
    newResponse.headers.delete('ETag')
    return newResponse
  }

  return response
}
