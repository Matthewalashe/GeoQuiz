// ============================================
// Story Mode — Guided Campaign (Milestone 2.6)
// Candy Crush-style progressive map
// ============================================

export const CAMPAIGN_CHAPTERS = [
  {
    id: 'ch-1',
    week: 1,
    title: 'Learn the 20 LGAs',
    subtitle: 'Master every Local Government Area',
    icon: '🏛️',
    color: '#00ff88',
    badge: 'lga-master',
    badgeEmoji: '🏛️',
    intro: 'Lagos is divided into 20 Local Government Areas, each with its own character. From the bustling streets of Mushin to the elite enclaves of Eti-Osa, can you locate them all?',
    categoryFilter: 'lgas',
    questionCount: 10,
    stages: [
      { id: 1, name: 'Lagos Island', questions: 3, stars: 0 },
      { id: 2, name: 'Mainland Core', questions: 3, stars: 0 },
      { id: 3, name: 'Ikeja Corridor', questions: 3, stars: 0 },
      { id: 4, name: 'Final Exam', questions: 5, stars: 0 },
    ],
    facts: [
      'Lagos had just 5 LGAs in 1967 — it now has 20 plus 37 LCDAs.',
      'Eti-Osa (Victoria Island, Lekki, Ikoyi) generates more tax revenue than 30 Nigerian states combined.',
      'Ajeromi-Ifelodun has the highest population density in Lagos at over 100,000 per km².',
    ],
  },
  {
    id: 'ch-2',
    week: 2,
    title: 'Master the Markets',
    subtitle: 'From Balogun to Alaba International',
    icon: '🛒',
    color: '#fbbf24',
    badge: 'market-master',
    badgeEmoji: '🛒',
    intro: 'Lagos markets are the beating heart of West African commerce. Over ₦10 billion changes hands daily across hundreds of markets. Can you pinpoint where the trade happens?',
    categoryFilter: 'markets',
    questionCount: 10,
    stages: [
      { id: 1, name: 'Island Markets', questions: 3, stars: 0 },
      { id: 2, name: 'Mainland Markets', questions: 3, stars: 0 },
      { id: 3, name: 'Specialty Markets', questions: 3, stars: 0 },
      { id: 4, name: 'Market Master', questions: 5, stars: 0 },
    ],
    facts: [
      'Alaba International Market generates over ₦3 billion daily in electronics trade.',
      'Balogun Market on Lagos Island is the largest textile market in West Africa.',
      'Mile 12 receives over 15,000 tonnes of food daily from across Nigeria.',
    ],
  },
  {
    id: 'ch-3',
    week: 3,
    title: 'Bridge the Gaps',
    subtitle: 'Transport links that connect Lagos',
    icon: '🌉',
    color: '#00d4ff',
    badge: 'bridge-master',
    badgeEmoji: '🌉',
    intro: 'Lagos is a city of water. Islands, lagoons, and creeks divide it — but bridges, ferries, and expressways stitch it together. How well do you know the arteries of Africa\'s largest city?',
    categoryFilter: 'transport',
    questionCount: 10,
    stages: [
      { id: 1, name: 'The Bridges', questions: 3, stars: 0 },
      { id: 2, name: 'Bus Terminals', questions: 3, stars: 0 },
      { id: 3, name: 'Rail & Water', questions: 3, stars: 0 },
      { id: 4, name: 'Transport Expert', questions: 5, stars: 0 },
    ],
    facts: [
      'Third Mainland Bridge (11.8 km) was Africa\'s longest bridge when completed in 1990.',
      'Over 10 million people use Lagos public transport daily.',
      'The Blue Line rail (Iddo-Mile 2) opened in 2023 — Lagos\' first modern rail.',
    ],
  },
  {
    id: 'ch-4',
    week: 4,
    title: 'Cultural Lagos',
    subtitle: 'Heritage, arts, and history',
    icon: '🎭',
    color: '#a855f7',
    badge: 'culture-master',
    badgeEmoji: '🎭',
    intro: 'From the slave ports of Badagry to the Afrobeat shrines of Ikeja, Lagos is a cultural powerhouse. Eyo masquerades, Brazilian Quarter architecture, and world-class galleries await.',
    categoryFilter: 'culture',
    questionCount: 10,
    stages: [
      { id: 1, name: 'Heritage Sites', questions: 3, stars: 0 },
      { id: 2, name: 'Art & Music', questions: 3, stars: 0 },
      { id: 3, name: 'Historical Roots', questions: 3, stars: 0 },
      { id: 4, name: 'Culture Legend', questions: 5, stars: 0 },
    ],
    facts: [
      'The Eyo Festival dates back to the early 1800s — white-robed masquerades dance through Lagos Island.',
      'Nike Art Gallery has over 8,000 artworks — the largest private collection in West Africa.',
      'Fela Kuti\'s Kalakuta Republic was raided by 1,000 soldiers in 1977.',
    ],
  },
]

const CAMPAIGN_KEY = 'geoquiz_campaign'

export function getCampaignProgress() {
  const raw = localStorage.getItem(CAMPAIGN_KEY)
  if (!raw) return defaultProgress()
  try { return { ...defaultProgress(), ...JSON.parse(raw) } }
  catch { return defaultProgress() }
}

function defaultProgress() {
  return {
    chapters: CAMPAIGN_CHAPTERS.map(ch => ({
      id: ch.id,
      unlocked: ch.id === 'ch-1',
      stages: ch.stages.map(s => ({ id: s.id, stars: 0, completed: false })),
      completed: false,
      badgeEarned: false,
    })),
    currentChapter: 'ch-1',
    totalStars: 0,
  }
}

export function saveCampaignProgress(data) {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(data))
}

export function completeStage(chapterId, stageId, stars) {
  const data = getCampaignProgress()
  const ch = data.chapters.find(c => c.id === chapterId)
  if (!ch) return data

  const stage = ch.stages.find(s => s.id === stageId)
  if (!stage) return data

  stage.stars = Math.max(stage.stars, stars)
  stage.completed = true

  // Check if chapter complete
  if (ch.stages.every(s => s.completed)) {
    ch.completed = true
    ch.badgeEarned = true

    // Unlock next chapter
    const idx = data.chapters.findIndex(c => c.id === chapterId)
    if (idx < data.chapters.length - 1) {
      data.chapters[idx + 1].unlocked = true
      data.currentChapter = data.chapters[idx + 1].id
    }
  }

  data.totalStars = data.chapters.reduce(
    (sum, c) => sum + c.stages.reduce((s2, st) => s2 + st.stars, 0), 0
  )

  saveCampaignProgress(data)
  return data
}
