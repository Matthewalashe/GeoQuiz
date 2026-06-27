import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BASE_URL = 'https://visitnaija.online'
const SITE_NAME = 'Wanda — Experience Nigeria'
const DEFAULT_IMAGE = `${BASE_URL}/og/og-home.png`

/**
 * SEO — Lightweight per-route head tag manager.
 * 
 * Updates document.title, canonical, description, and all OG/Twitter tags
 * on mount. Restores defaults on unmount (SPA navigation).
 * Also injects JSON-LD structured data if provided.
 * 
 * Usage:
 *   <SEO title="Play Games" description="Fun geography games..." />
 *   <SEO {...SEO_PAGES.explore} />
 */
export default function SEO({
  title,           // Page-specific title (appended with site name)
  fullTitle,       // If provided, used as-is without appending site name
  description,     // Page-specific description
  image,           // OG image URL (optional, defaults to og-home.png)
  type = 'website', // OG type
  noIndex = false,  // Set true for auth/admin pages
  jsonLd,          // JSON-LD structured data object (optional)
}) {
  const { pathname } = useLocation()
  const displayTitle = fullTitle || (title ? `${title} | ${SITE_NAME}` : SITE_NAME)
  const fullUrl = `${BASE_URL}${pathname}`
  const desc = description || "Nigeria's all-in-one city experience platform. Discover attractions, restaurants, handymen, events. Play games, earn rewards, explore."
  const ogImage = image || DEFAULT_IMAGE

  useEffect(() => {
    // ── Title ──
    const prevTitle = document.title
    document.title = displayTitle

    // ── Helper: set or create a <meta> tag ──
    function setMeta(attr, key, content) {
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
      return el
    }

    // ── Helper: set or create a <link> tag ──
    function setLink(rel, href) {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
      return el
    }

    // ── Canonical ──
    setLink('canonical', fullUrl)

    // ── Description ──
    setMeta('name', 'description', desc)

    // ── Robots (noindex for admin/auth pages) ──
    if (noIndex) {
      setMeta('name', 'robots', 'noindex, nofollow')
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]')
      if (robotsEl) robotsEl.remove()
    }

    // ── Open Graph ──
    setMeta('property', 'og:title', displayTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', fullUrl)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)

    // ── Twitter Card ──
    setMeta('name', 'twitter:title', displayTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', ogImage)

    // ── JSON-LD Structured Data ──
    let jsonLdEl = null
    if (jsonLd) {
      // Remove any existing SEO-managed JSON-LD
      const existing = document.querySelector('script[data-seo-jsonld]')
      if (existing) existing.remove()

      jsonLdEl = document.createElement('script')
      jsonLdEl.type = 'application/ld+json'
      jsonLdEl.setAttribute('data-seo-jsonld', 'true')
      jsonLdEl.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(jsonLdEl)
    }

    // ── Cleanup on unmount (restore defaults) ──
    return () => {
      document.title = prevTitle
      if (jsonLdEl && jsonLdEl.parentNode) {
        jsonLdEl.remove()
      }
    }
  }, [displayTitle, fullUrl, desc, ogImage, type, noIndex, jsonLd])

  return null // This component renders nothing
}

/**
 * Pre-defined SEO configs for all major pages.
 * Import and spread: <SEO {...SEO_PAGES.explore} />
 * 
 * Routes with specific user-defined titles use `fullTitle` so the
 * site name is not double-appended.
 */
export const SEO_PAGES = {
  home: {
    // No title override — uses default SITE_NAME
    description: "Discover the best of Nigeria — attractions, restaurants, hotels, events, handymen, and experiences. Play geography games, earn rewards, and explore Lagos with the Wanda Pass.",
    image: `${BASE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Wanda',
      alternateName: 'Visit Naija',
      url: BASE_URL,
      description: "Nigeria's all-in-one city experience platform. Discover attractions, restaurants, hotels, handymen, events, and experiences. Play geography games and earn rewards.",
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
      author: { '@type': 'Organization', name: 'WhiteArts Technologies', url: BASE_URL },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      inLanguage: 'en',
      potentialAction: [{ '@type': 'SearchAction', target: `${BASE_URL}/explore?q={search_term_string}`, 'query-input': 'required name=search_term_string' }],
    },
  },
  explore: {
    fullTitle: 'Explore Lagos — Attractions, Restaurants, Hotels | Wanda',
    description: "Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos. Find the best spots with ratings, reviews, and directions.",
    image: `${BASE_URL}/og/og-explore.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Explore Lagos — Attractions, Restaurants, Hotels',
      description: 'Browse restaurants, hotels, nightlife, parks, beaches, and attractions across Lagos.',
      url: `${BASE_URL}/explore`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  play: {
    fullTitle: 'Play Nigerian Geography Games — 8 Modes, 260+ Questions | Wanda',
    description: "Play fun geography quiz games about Nigeria. Guess locations on the map, unscramble words, solve trivia, earn XP and coins. Test your knowledge of Lagos and Nigeria!",
    image: `${BASE_URL}/og/og-play.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Play Nigerian Geography Games',
      description: 'Play fun geography quiz games about Nigeria with 8 game modes and 260+ questions.',
      url: `${BASE_URL}/play`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  pass: {
    fullTitle: 'Wanda Pass — One Pass, All of Lagos | Wanda',
    description: "Discover events in Lagos and Nigeria. Create events, sell tickets, and manage your Wanda Pass for exclusive access to experiences.",
    image: `${BASE_URL}/og/og-pass.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Wanda Pass — Events & Experiences',
      description: 'Discover events in Lagos and Nigeria. RSVP, get tickets, and access exclusive experiences.',
      url: `${BASE_URL}/pass`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  listBusiness: {
    fullTitle: "List Your Business Free on Wanda | Nigeria's Discovery App",
    description: "Get your Nigerian business discovered by thousands. List your restaurant, hotel, service, or experience on Wanda for free. Reach new customers today.",
    image: `${BASE_URL}/og/og-list-business.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'List Your Business on Wanda',
      description: 'Get your Nigerian business discovered by thousands. List for free.',
      url: `${BASE_URL}/list-your-business`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  deals: {
    title: 'Deals & Offers',
    description: "Find the best deals and exclusive offers from restaurants, hotels, beaches, and entertainment venues across Lagos.",
    image: `${BASE_URL}/og/og-explore.png`,
  },
  discovery: {
    title: 'Discovery',
    description: "Discover curated places, hidden gems, and sponsored experiences across Lagos. Handpicked recommendations from local experts.",
    image: `${BASE_URL}/og/og-explore.png`,
  },
  handymen: {
    fullTitle: 'Find Trusted Handymen in Lagos | Wanda',
    description: "Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos. Verified reviews and instant contact.",
    image: `${BASE_URL}/og/og-handymen.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Find Trusted Handymen in Lagos',
      description: 'Find trusted handymen, electricians, plumbers, painters, and service professionals in Lagos.',
      url: `${BASE_URL}/handymen`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  about: {
    title: 'About Wanda',
    description: "Learn about Wanda — Nigeria's all-in-one city experience platform built by WhiteArts Technologies. Our mission, team, and vision for Nigerian tourism.",
    image: `${BASE_URL}/og/og-home.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Wanda',
      description: "Learn about Wanda — Nigeria's all-in-one city experience platform.",
      url: `${BASE_URL}/about`,
      isPartOf: { '@type': 'WebSite', name: 'Wanda — Experience Nigeria', url: BASE_URL },
    },
  },
  leaderboard: {
    title: 'Leaderboard',
    description: "See who's the top geography champion! View global and weekly leaderboards for Wanda's Nigerian geography games.",
    image: `${BASE_URL}/og/og-play.png`,
  },
  dashboard: {
    title: 'My Dashboard',
    description: "View your Wanda profile, game stats, XP progress, achievements, and rewards. Track your journey through Nigeria.",
    image: `${BASE_URL}/og/og-home.png`,
  },
  rewards: {
    title: 'Rewards & Store',
    description: "Spend your earned coins on exclusive themes, map skins, and power-ups. Unlock rewards as you play and explore Nigeria.",
    image: `${BASE_URL}/og/og-play.png`,
  },
  achievements: {
    title: 'Achievements',
    description: "Earn badges and trophies as you explore Nigeria. Track your progress across geography games, exploration, and community goals.",
    image: `${BASE_URL}/og/og-play.png`,
  },
  community: {
    title: 'Community',
    description: "Join the Wanda community. Share discoveries, post reviews, connect with fellow Nigeria explorers, and earn social XP.",
    image: `${BASE_URL}/og/og-home.png`,
  },
  wordGame: {
    title: 'Guess the Word',
    description: "Unscramble letters to guess Nigerian places, people, and cultural terms. Learn history and earn XP with every correct answer!",
    image: `${BASE_URL}/og/og-play.png`,
  },
  trivia: {
    title: 'Trivia Challenge',
    description: "Test your knowledge of Nigerian history, geography, culture, and more. Answer trivia questions and climb the leaderboard!",
    image: `${BASE_URL}/og/og-play.png`,
  },
  auth: {
    title: 'Sign In',
    description: "Sign in or create your Wanda account to save progress, earn rewards, and join the community.",
    noIndex: true,
  },
  admin: {
    title: 'Admin Dashboard',
    description: "Wanda admin panel.",
    noIndex: true,
  },
}
