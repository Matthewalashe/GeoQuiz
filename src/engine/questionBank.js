/**
 * QUESTION BANK SERVICE
 * Provides unlimited questions by combining:
 * 1. Local hardcoded questions (questions.js — ~400)
 * 2. REST Countries API — auto-generated geography questions
 * 3. Open Trivia Database API — trivia questions
 * 4. Procedural generation — infinite variations from templates
 *
 * All fetched questions are cached in memory so repeat calls are instant.
 */

// ── CACHE ──
const cache = {
  countries: null,
  trivia: {},       // keyed by category
  generated: [],
  lastFetch: 0,
}

// ═══════════════════════════════════════════
// 1. REST COUNTRIES — Auto-generated geography questions
// ═══════════════════════════════════════════
const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,area,flags,cca2,currencies,languages,borders,continents,timezones,latlng'

async function fetchCountries() {
  if (cache.countries) return cache.countries
  try {
    const res = await fetch(COUNTRIES_API)
    if (!res.ok) throw new Error('Countries API failed')
    const data = await res.json()
    cache.countries = data.filter(c => c.name?.common && c.capital?.length > 0)
    return cache.countries
  } catch (err) {
    console.warn('Countries API error:', err.message)
    return []
  }
}

// Generate geography questions from country data
function generateCountryQuestions(countries, count = 50) {
  const templates = [
    // Capital questions
    (c, wrongs) => ({
      type: 'trivia',
      category: 'geography',
      difficulty: c.population > 50000000 ? 'easy' : c.population > 10000000 ? 'medium' : 'hard',
      question: `What is the capital of ${c.name.common}?`,
      correct: c.capital[0],
      options: [c.capital[0], ...wrongs.map(w => w.capital?.[0]).filter(Boolean).slice(0, 3)],
      funFact: `${c.name.common} is located in ${c.region || 'the world'}.`,
    }),
    // Population questions
    (c, wrongs) => {
      const pop = c.population
      const formatted = pop > 1000000000 ? `${(pop / 1e9).toFixed(1)} billion` :
                        pop > 1000000 ? `${(pop / 1e6).toFixed(0)} million` :
                        pop.toLocaleString()
      return {
        type: 'trivia',
        category: 'geography',
        difficulty: 'medium',
        question: `Which country has a population of approximately ${formatted}?`,
        correct: c.name.common,
        options: [c.name.common, ...wrongs.map(w => w.name.common).slice(0, 3)],
        funFact: `${c.name.common}'s population is ${pop.toLocaleString()}.`,
      }
    },
    // Region questions
    (c, wrongs) => ({
      type: 'trivia',
      category: 'geography',
      difficulty: 'easy',
      question: `In which continent is ${c.name.common} located?`,
      correct: c.continents?.[0] || c.region,
      options: [...new Set([c.continents?.[0] || c.region, 'Africa', 'Europe', 'Asia', 'South America', 'North America', 'Oceania'])].slice(0, 4),
      funFact: `${c.name.common} is in the ${c.subregion || c.region} region.`,
    }),
    // Flag questions
    (c, wrongs) => ({
      type: 'trivia',
      category: 'flags',
      difficulty: c.population > 50000000 ? 'easy' : 'medium',
      question: `Which country does this flag belong to?`,
      correct: c.name.common,
      options: [c.name.common, ...wrongs.map(w => w.name.common).slice(0, 3)],
      image: c.flags?.png || c.flags?.svg || null,
      funFact: `${c.name.common}'s flag represents their national identity.`,
    }),
    // Currency questions
    (c, wrongs) => {
      const currencies = Object.values(c.currencies || {})
      if (currencies.length === 0) return null
      return {
        type: 'trivia',
        category: 'geography',
        difficulty: 'hard',
        question: `What is the currency of ${c.name.common}?`,
        correct: currencies[0].name,
        options: [currencies[0].name, ...wrongs.flatMap(w => Object.values(w.currencies || {})).map(cur => cur.name).filter(Boolean).slice(0, 3)],
        funFact: `The currency symbol is ${currencies[0].symbol || 'N/A'}.`,
      }
    },
    // Language questions
    (c, wrongs) => {
      const langs = Object.values(c.languages || {})
      if (langs.length === 0) return null
      return {
        type: 'trivia',
        category: 'geography',
        difficulty: 'medium',
        question: `Which of these languages is spoken in ${c.name.common}?`,
        correct: langs[0],
        options: [langs[0], ...wrongs.flatMap(w => Object.values(w.languages || {})).filter(Boolean).slice(0, 3)],
        funFact: `${c.name.common} has ${langs.length} official language(s).`,
      }
    },
  ]

  const questions = []
  const shuffled = [...countries].sort(() => Math.random() - 0.5)

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const c = shuffled[i]
    const wrongs = shuffled.filter((_, j) => j !== i).sort(() => Math.random() - 0.5)
    const template = templates[Math.floor(Math.random() * templates.length)]
    const q = template(c, wrongs)
    if (q) {
      // Shuffle options
      q.options = [...new Set(q.options)].sort(() => Math.random() - 0.5).slice(0, 4)
      // Ensure correct answer is in options
      if (!q.options.includes(q.correct)) q.options[0] = q.correct
      q.id = `geo-${i}-${Date.now()}`
      questions.push(q)
    }
  }

  return questions
}

// ═══════════════════════════════════════════
// 2. OPEN TRIVIA DB — General knowledge trivia
// ═══════════════════════════════════════════
const TRIVIA_API = 'https://opentdb.com/api.php'

// Category mapping for OpenTDB
const TRIVIA_CATEGORIES = {
  general: 9,
  science: 17,
  geography: 22,
  history: 23,
  art: 25,
  animals: 27,
  sports: 21,
  mythology: 20,
}

function decodeHTML(html) {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

async function fetchTriviaQuestions(category = 'general', count = 20, difficulty = '') {
  const cacheKey = `${category}-${count}-${difficulty}`
  if (cache.trivia[cacheKey]?.length > 0) {
    // Return cached and remove used ones
    return cache.trivia[cacheKey].splice(0, count)
  }

  const catId = TRIVIA_CATEGORIES[category] || 9
  let url = `${TRIVIA_API}?amount=${Math.min(count, 50)}&category=${catId}&type=multiple`
  if (difficulty) url += `&difficulty=${difficulty}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Trivia API failed')
    const data = await res.json()
    if (data.response_code !== 0) throw new Error(`Trivia API code: ${data.response_code}`)

    const questions = data.results.map((r, i) => ({
      id: `trivia-${category}-${i}-${Date.now()}`,
      type: 'trivia',
      category: category,
      difficulty: r.difficulty,
      question: decodeHTML(r.question),
      correct: decodeHTML(r.correct_answer),
      options: [decodeHTML(r.correct_answer), ...r.incorrect_answers.map(decodeHTML)]
        .sort(() => Math.random() - 0.5),
      funFact: `Category: ${decodeHTML(r.category)}`,
    }))

    // Cache extras
    if (questions.length > count) {
      cache.trivia[cacheKey] = questions.slice(count)
    }

    return questions.slice(0, count)
  } catch (err) {
    console.warn('Trivia API error:', err.message)
    return []
  }
}

// ═══════════════════════════════════════════
// 3. NIGERIAN TRIVIA — Procedurally generated
// ═══════════════════════════════════════════
const NIGERIA_FACTS = [
  { q: 'What is the largest city in Nigeria?', a: 'Lagos', opts: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], fact: 'Lagos has over 21 million people.' },
  { q: 'What is the capital of Nigeria?', a: 'Abuja', opts: ['Abuja', 'Lagos', 'Port Harcourt', 'Kaduna'], fact: 'Abuja became the capital in 1991.' },
  { q: 'Which river is the longest in Nigeria?', a: 'River Niger', opts: ['River Niger', 'River Benue', 'River Ogun', 'River Osun'], fact: 'River Niger is 4,180 km long.' },
  { q: 'How many states does Nigeria have?', a: '36', opts: ['36', '24', '48', '30'], fact: 'Nigeria has 36 states plus the FCT.' },
  { q: 'What year did Nigeria gain independence?', a: '1960', opts: ['1960', '1957', '1963', '1952'], fact: 'Nigeria became independent on October 1, 1960.' },
  { q: 'Which Nigerian city is known as the "Centre of Excellence"?', a: 'Lagos', opts: ['Lagos', 'Abuja', 'Kano', 'Enugu'], fact: 'Lagos adopted this motto as Nigeria\'s commercial capital.' },
  { q: 'What is the currency of Nigeria?', a: 'Naira', opts: ['Naira', 'Cedi', 'Rand', 'Shilling'], fact: 'The Naira was introduced in 1973.' },
  { q: 'Which Nigerian state has the largest land area?', a: 'Niger', opts: ['Niger', 'Borno', 'Taraba', 'Bauchi'], fact: 'Niger State covers 76,363 km².' },
  { q: 'What is the name of Nigeria\'s tallest waterfall?', a: 'Erin Ijesha', opts: ['Erin Ijesha', 'Gurara Falls', 'Kainji Falls', 'Agbokim Falls'], fact: 'Erin Ijesha waterfall has 7 levels.' },
  { q: 'Which ethnic group is the largest in Nigeria?', a: 'Hausa-Fulani', opts: ['Hausa-Fulani', 'Yoruba', 'Igbo', 'Ijaw'], fact: 'Nigeria has over 250 ethnic groups.' },
  { q: 'What is Nollywood?', a: 'Nigerian film industry', opts: ['Nigerian film industry', 'Ghanaian music', 'South African TV', 'Kenyan cinema'], fact: 'Nollywood is the second-largest film industry by volume.' },
  { q: 'Which Nigerian won the Nobel Prize in Literature?', a: 'Wole Soyinka', opts: ['Wole Soyinka', 'Chinua Achebe', 'Ben Okri', 'Chimamanda Adichie'], fact: 'Soyinka won in 1986 — the first African Nobel laureate in literature.' },
  { q: 'What is Jollof Rice?', a: 'A West African rice dish', opts: ['A West African rice dish', 'A Nigerian currency', 'A traditional dance', 'A type of fabric'], fact: 'Nigeria and Ghana have a friendly rivalry over who makes better Jollof.' },
  { q: 'Which bridge is the longest in Africa?', a: 'Third Mainland Bridge', opts: ['Third Mainland Bridge', 'Carter Bridge', 'Eko Bridge', 'Lekki-Ikoyi Bridge'], fact: 'Third Mainland Bridge is 11.8 km long.' },
  { q: 'What is Suya?', a: 'Grilled spiced meat', opts: ['Grilled spiced meat', 'A type of soup', 'A musical instrument', 'A festival'], fact: 'Suya is a popular street food originating from northern Nigeria.' },
  { q: 'Which Nigerian city hosted FESTAC 77?', a: 'Lagos', opts: ['Lagos', 'Abuja', 'Ibadan', 'Benin City'], fact: 'FESTAC 77 was the Second World Black Festival of Arts and Culture.' },
  { q: 'What does "oga" mean in Nigerian Pidgin?', a: 'Boss', opts: ['Boss', 'Friend', 'Brother', 'Teacher'], fact: 'Pidgin English is widely spoken across Nigeria.' },
  { q: 'Which Nigerian state is famous for Osun-Osogbo Sacred Grove?', a: 'Osun', opts: ['Osun', 'Oyo', 'Ogun', 'Ondo'], fact: 'It\'s a UNESCO World Heritage Site.' },
  { q: 'What is the name of the rock formation near Abuja?', a: 'Zuma Rock', opts: ['Zuma Rock', 'Olumo Rock', 'Aso Rock', 'Idanre Hills'], fact: 'Zuma Rock is 725 meters high and visible from 50 km away.' },
  { q: 'Which Nigerian airport is the busiest?', a: 'Murtala Muhammed International', opts: ['Murtala Muhammed International', 'Nnamdi Azikiwe', 'Port Harcourt Int\'l', 'Aminu Kano Int\'l'], fact: 'MMIA handles over 8 million passengers annually.' },
  { q: 'What is the Eyo Festival?', a: 'A Lagos masquerade festival', opts: ['A Lagos masquerade festival', 'A harvest festival', 'A music festival', 'A boat race'], fact: 'Eyo is unique to Lagos and dates to the 19th century.' },
  { q: 'Which Nigerian wrote "Things Fall Apart"?', a: 'Chinua Achebe', opts: ['Chinua Achebe', 'Wole Soyinka', 'Cyprian Ekwensi', 'Flora Nwapa'], fact: 'Things Fall Apart has sold over 20 million copies.' },
  { q: 'What is Ankara?', a: 'African wax print fabric', opts: ['African wax print fabric', 'A dance style', 'A type of food', 'A city in Nigeria'], fact: 'Ankara is central to Nigerian fashion and culture.' },
  { q: 'Which Nigerian musician is known as "Afrobeats Pioneer"?', a: 'Fela Kuti', opts: ['Fela Kuti', 'King Sunny Ade', 'Burna Boy', 'Davido'], fact: 'Fela Kuti created Afrobeat in the 1970s at his club, The Shrine.' },
  { q: 'What is the Great Wall of Lagos?', a: 'Eko Atlantic seawall', opts: ['Eko Atlantic seawall', 'A historic fortress', 'An ancient wall', 'A highway barrier'], fact: 'The seawall protects Victoria Island from ocean erosion.' },
]

function generateNigeriaQuestions(count = 25) {
  return NIGERIA_FACTS
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((f, i) => ({
      id: `ng-${i}-${Date.now()}`,
      type: 'trivia',
      category: 'nigeria',
      difficulty: 'medium',
      question: f.q,
      correct: f.a,
      options: [...f.opts].sort(() => Math.random() - 0.5),
      funFact: f.fact,
    }))
}

// ═══════════════════════════════════════════
// 4. AFRICAN GEOGRAPHY — Procedurally generated
// ═══════════════════════════════════════════
const AFRICA_DATA = [
  { country: 'Nigeria', capital: 'Abuja', pop: '223M', currency: 'Naira', lang: 'English' },
  { country: 'Ghana', capital: 'Accra', pop: '33M', currency: 'Cedi', lang: 'English' },
  { country: 'South Africa', capital: 'Pretoria', pop: '60M', currency: 'Rand', lang: 'Zulu' },
  { country: 'Kenya', capital: 'Nairobi', pop: '54M', currency: 'Shilling', lang: 'Swahili' },
  { country: 'Egypt', capital: 'Cairo', pop: '104M', currency: 'Pound', lang: 'Arabic' },
  { country: 'Ethiopia', capital: 'Addis Ababa', pop: '120M', currency: 'Birr', lang: 'Amharic' },
  { country: 'Tanzania', capital: 'Dodoma', pop: '62M', currency: 'Shilling', lang: 'Swahili' },
  { country: 'Morocco', capital: 'Rabat', pop: '37M', currency: 'Dirham', lang: 'Arabic' },
  { country: 'Cameroon', capital: 'Yaoundé', pop: '27M', currency: 'CFA Franc', lang: 'French' },
  { country: 'Senegal', capital: 'Dakar', pop: '17M', currency: 'CFA Franc', lang: 'French' },
  { country: 'Algeria', capital: 'Algiers', pop: '45M', currency: 'Dinar', lang: 'Arabic' },
  { country: 'Uganda', capital: 'Kampala', pop: '46M', currency: 'Shilling', lang: 'English' },
  { country: 'Rwanda', capital: 'Kigali', pop: '13M', currency: 'Franc', lang: 'Kinyarwanda' },
  { country: 'Ivory Coast', capital: 'Yamoussoukro', pop: '27M', currency: 'CFA Franc', lang: 'French' },
  { country: 'Zimbabwe', capital: 'Harare', pop: '16M', currency: 'Dollar', lang: 'English' },
  { country: 'Angola', capital: 'Luanda', pop: '34M', currency: 'Kwanza', lang: 'Portuguese' },
  { country: 'Mozambique', capital: 'Maputo', pop: '32M', currency: 'Metical', lang: 'Portuguese' },
  { country: 'Mali', capital: 'Bamako', pop: '21M', currency: 'CFA Franc', lang: 'French' },
  { country: 'Botswana', capital: 'Gaborone', pop: '2.4M', currency: 'Pula', lang: 'English' },
  { country: 'Namibia', capital: 'Windhoek', pop: '2.5M', currency: 'Dollar', lang: 'English' },
]

function generateAfricaQuestions(count = 40) {
  const questions = []
  const shuffled = [...AFRICA_DATA].sort(() => Math.random() - 0.5)

  for (const c of shuffled) {
    const wrongs = shuffled.filter(w => w.country !== c.country).sort(() => Math.random() - 0.5)

    // Capital question
    questions.push({
      id: `af-cap-${c.country}-${Date.now()}`,
      type: 'trivia', category: 'africa', difficulty: 'easy',
      question: `What is the capital of ${c.country}?`,
      correct: c.capital,
      options: [c.capital, ...wrongs.slice(0, 3).map(w => w.capital)].sort(() => Math.random() - 0.5),
      funFact: `${c.country} has a population of ${c.pop}.`,
    })

    // Country from capital
    questions.push({
      id: `af-ctry-${c.country}-${Date.now()}`,
      type: 'trivia', category: 'africa', difficulty: 'medium',
      question: `${c.capital} is the capital of which country?`,
      correct: c.country,
      options: [c.country, ...wrongs.slice(0, 3).map(w => w.country)].sort(() => Math.random() - 0.5),
      funFact: `The official language in ${c.country} is ${c.lang}.`,
    })

    // Currency question
    questions.push({
      id: `af-cur-${c.country}-${Date.now()}`,
      type: 'trivia', category: 'africa', difficulty: 'hard',
      question: `What currency is used in ${c.country}?`,
      correct: c.currency,
      options: [...new Set([c.currency, ...wrongs.slice(0, 3).map(w => w.currency)])].sort(() => Math.random() - 0.5),
      funFact: `${c.country}'s main language is ${c.lang}.`,
    })
  }

  return questions.sort(() => Math.random() - 0.5).slice(0, count)
}

// ═══════════════════════════════════════════
// PUBLIC API — Main entry points
// ═══════════════════════════════════════════

/**
 * Get a batch of trivia questions from any/all sources.
 * @param {Object} opts
 * @param {number} opts.count - Number of questions (default 20)
 * @param {string} opts.category - 'geography'|'nigeria'|'africa'|'general'|'science'|'history'|'mixed'
 * @param {string} opts.difficulty - 'easy'|'medium'|'hard'|'' (any)
 * @returns {Promise<Array>} Array of question objects
 */
export async function getQuestions({ count = 20, category = 'mixed', difficulty = '' } = {}) {
  const results = []

  if (category === 'mixed' || category === 'geography') {
    try {
      const countries = await fetchCountries()
      if (countries.length > 0) {
        results.push(...generateCountryQuestions(countries, Math.ceil(count / 3)))
      }
    } catch {}
  }

  if (category === 'mixed' || category === 'nigeria') {
    results.push(...generateNigeriaQuestions(Math.ceil(count / 3)))
  }

  if (category === 'mixed' || category === 'africa') {
    results.push(...generateAfricaQuestions(Math.ceil(count / 3)))
  }

  if (category === 'mixed' || category === 'general' || category === 'science' || category === 'history') {
    try {
      const triviaCategory = category === 'mixed' ? 'general' : category
      const apiQuestions = await fetchTriviaQuestions(triviaCategory, Math.ceil(count / 3), difficulty)
      results.push(...apiQuestions)
    } catch {}
  }

  // Shuffle and return requested count
  const shuffled = results.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get geography-only questions (for MapQuiz, PinPoint style games).
 * Combines REST Countries API with hardcoded Lagos questions.
 */
export async function getGeographyQuestions(count = 30) {
  const results = []
  try {
    const countries = await fetchCountries()
    results.push(...generateCountryQuestions(countries, count))
  } catch {}
  results.push(...generateAfricaQuestions(Math.ceil(count / 2)))
  return results.sort(() => Math.random() - 0.5).slice(0, count)
}

/**
 * Get flag questions for FlagStack game.
 * Uses REST Countries API for unlimited flags.
 */
export async function getFlagQuestions(count = 30) {
  try {
    const countries = await fetchCountries()
    const withFlags = countries.filter(c => c.flags?.png)
    return withFlags
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(c => ({
        country: c.name.common,
        code: c.cca2?.toLowerCase() || '',
        flag: c.flags.png,
        region: c.region,
        population: c.population,
      }))
  } catch (err) {
    console.warn('Flag questions error:', err)
    return []
  }
}

/**
 * Get Nigeria-specific questions (for Wanda trivia).
 */
export function getNigeriaQuestions(count = 25) {
  return generateNigeriaQuestions(count)
}

/**
 * Preload countries data for faster subsequent calls.
 * Call this on app init.
 */
export async function preloadQuestionBank() {
  try {
    await fetchCountries()
    console.log('[QuestionBank] Countries preloaded')
  } catch {}
}

/**
 * Get question bank stats.
 */
export function getQuestionBankStats() {
  return {
    countriesCached: cache.countries?.length || 0,
    triviaCategories: Object.keys(cache.trivia).length,
    nigeriaQuestions: NIGERIA_FACTS.length,
    africaCountries: AFRICA_DATA.length,
    estimatedTotal: (cache.countries?.length || 0) * 6 + NIGERIA_FACTS.length + AFRICA_DATA.length * 3,
  }
}
