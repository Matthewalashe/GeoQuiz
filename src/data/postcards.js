/**
 * PostCards, Puzzle & Content Library
 * ═══════════════════════════════════
 * 3 Content Packs:
 *   1. Visual Guess — Streets, landmarks, obscure corners
 *   2. Cultural Knowledge — Slang, food, festivals
 *   3. Hyperlocal Trivia — Bus stops, markets, hidden spots
 */

// ── VISUAL GUESS (Landmark Photos) ──
const VISUAL_GUESS = [
  {
    id: 'vg-01', image: '/images/postcards/national-theatre.png',
    question: 'Which iconic Lagos building is shown in this postcard?',
    options: ['National Theatre', 'Eko Hotel', 'MUSON Centre', 'Federal Secretariat'],
    correct: 0, category: 'visual',
    fact: 'The National Theatre was built in 1976 for FESTAC 77 and is shaped like a military hat.',
  },
  {
    id: 'vg-02', image: '/images/postcards/third-mainland-bridge.png',
    question: 'This bridge connects Lagos Island to the mainland. What is it?',
    options: ['Carter Bridge', 'Eko Bridge', 'Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge'],
    correct: 2, category: 'visual',
    fact: 'Third Mainland Bridge is 11.8 km long — the longest bridge in Africa when it opened in 1990.',
  },
  {
    id: 'vg-03', image: '/images/postcards/zuma-rock.png',
    question: 'This massive monolith sits along the Abuja–Kaduna highway. Name it.',
    options: ['Olumo Rock', 'Zuma Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 1, category: 'visual',
    fact: 'Zuma Rock is 725m high and appears on the ₦100 note. Locals call it "Gateway to Abuja".',
  },
  {
    id: 'vg-04', image: '/images/postcards/olumo-rock.png',
    question: 'This ancient rock fortress is located in Abeokuta. What is it?',
    options: ['Zuma Rock', 'Ikogosi Warm Springs', 'Olumo Rock', 'Erin-Ijesha Falls'],
    correct: 2, category: 'visual',
    fact: 'Olumo Rock served as a natural fortress during inter-tribal wars in the 19th century.',
  },
  {
    id: 'vg-05', image: '/images/postcards/lekki-ikoyi-bridge.png',
    question: 'This cable-stayed bridge connects Lekki Phase 1 to Ikoyi. Name it.',
    options: ['Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge', 'Carter Bridge', 'Falomo Bridge'],
    correct: 1, category: 'visual',
    fact: 'The bridge was completed in 2013 and its LED lights change colors at night.',
  },
  {
    id: 'vg-06', image: '/images/postcards/badagry.png',
    question: 'This coastal town is known as the "point of no return" in the slave trade.',
    options: ['Epe', 'Badagry', 'Ikorodu', 'Ajegunle'],
    correct: 1, category: 'visual',
    fact: 'Badagry has the first two-storey building in Nigeria, built by missionaries in 1845.',
  },
  {
    id: 'vg-07', image: '/images/postcards/tafawa-balewa.png',
    question: 'This open square on Lagos Island hosted Nigeria\'s independence ceremony.',
    options: ['Eagle Square', 'Tafawa Balewa Square', 'Tinubu Square', 'Freedom Park'],
    correct: 1, category: 'visual',
    fact: 'TBS is named after Nigeria\'s first Prime Minister and can hold 18,000 people.',
  },
  {
    id: 'vg-08', image: '/images/postcards/abuja-mosque.png',
    question: 'This mosque is one of the most prominent landmarks in Nigeria\'s capital.',
    options: ['Kano Central Mosque', 'Lagos Central Mosque', 'Abuja National Mosque', 'Ibadan Grand Mosque'],
    correct: 2, category: 'visual',
    fact: 'The Abuja National Mosque can accommodate over 15,000 worshippers.',
  },
  {
    id: 'vg-09', image: '/images/postcards/nike-art-gallery.png',
    question: 'This is the largest art gallery in West Africa, located in Lekki.',
    options: ['Didi Museum', 'Terra Kulture', 'Nike Art Gallery', 'Wheatbaker Gallery'],
    correct: 2, category: 'visual',
    fact: 'Nike Art Gallery has over 8,000 artworks across 5 floors.',
  },
  {
    id: 'vg-10', image: '/images/postcards/aso-rock.png',
    question: 'This iconic rock formation houses the Nigerian Presidential Complex.',
    options: ['Zuma Rock', 'Olumo Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 2, category: 'visual',
    fact: 'Aso Rock is 400m high and means "victorious people" in the Asokoro dialect.',
  },
  {
    id: 'vg-11', image: '/images/postcards/osun-grove.png',
    question: 'This UNESCO World Heritage Site is a sacred forest in Osun State.',
    options: ['Yankari Reserve', 'Osun-Osogbo Sacred Grove', 'Cross River Park', 'Lekki Conservation'],
    correct: 1, category: 'visual',
    fact: 'The grove is one of the last remnants of primary high forest in southern Nigeria.',
  },
  {
    id: 'vg-12', image: '/images/postcards/unilag.png',
    question: 'This university campus sits on the lagoon front in Akoka.',
    options: ['LASU', 'University of Lagos', 'Lagos State Polytechnic', 'Yaba College of Tech'],
    correct: 1, category: 'visual',
    fact: 'UNILAG was founded in 1962 — "University of first choice and the nation\'s pride".',
  },
  // ── New Visual Guess: Streets & Obscure Corners ──
  {
    id: 'vg-13', image: '/images/postcards/balogun-market.png',
    question: 'This is the largest open-air market on Lagos Island. Name it.',
    options: ['Balogun Market', 'Oshodi Market', 'Mile 12 Market', 'Alaba International'],
    correct: 0, category: 'visual',
    fact: 'Balogun Market generates an estimated ₦2 billion daily in trade — it\'s the commercial heart of Lagos Island.',
  },
  {
    id: 'vg-14', image: '/images/postcards/danfo-bus.png',
    question: 'What are these iconic yellow commercial buses called in Lagos?',
    options: ['Keke', 'Danfo', 'BRT', 'Molue'],
    correct: 1, category: 'visual',
    fact: 'Danfo buses are Volkswagen T3 vans painted yellow. They carry over 10 million Lagosians daily and are being gradually phased out for BRT buses.',
  },
  {
    id: 'vg-15', image: '/images/postcards/makoko.png',
    question: 'This famous waterfront community is sometimes called "Venice of Africa."',
    options: ['Ilaje', 'Makoko', 'Ajegunle', 'Bariga'],
    correct: 1, category: 'visual',
    fact: 'Makoko houses over 250,000 people on stilts above the Lagos Lagoon. The Makoko Floating School (2013) by Kunlé Adeyemi gained global acclaim.',
  },
  {
    id: 'vg-16', image: '/images/postcards/computer-village.png',
    question: 'This is the largest technology market in Africa. Where is it?',
    options: ['Alaba International', 'Computer Village, Ikeja', 'Trade Fair Complex', 'Ladipo Market'],
    correct: 1, category: 'visual',
    fact: 'Computer Village generates ₦1.5 billion daily in tech trade. Over 5,000 shops sell phones, laptops, and accessories.',
  },
  {
    id: 'vg-17', image: '/images/postcards/egungun-festival.png',
    question: 'What Yoruba masquerade festival is shown in this image?',
    options: ['Gelede', 'Egungun Festival', 'Osun Festival', 'New Yam Festival'],
    correct: 1, category: 'visual',
    fact: 'Egungun masquerades represent ancestral spirits. The elaborate costumes can weigh over 50 kg and twirl at incredible speeds.',
  },
]

// ── CULTURAL KNOWLEDGE (Slang, Food, Festivals) ──
const CULTURAL_KNOWLEDGE = [
  {
    id: 'ck-01', image: '/images/postcards/balogun-market.png',
    question: '"Omo, see as this thing set!" — Which LGA popularized this slang style?',
    options: ['Ajeromi-Ifelodun', 'Surulere', 'Ikeja', 'Eti-Osa'],
    correct: 0, category: 'cultural',
    fact: '"Omo" (child) became universal Lagos slang from the Ajegunle/Ajeromi melting pot — Igbo, Yoruba, Ijaw cultures mixed to create a unique street pidgin.',
  },
  {
    id: 'ck-02', image: '/images/postcards/egungun-festival.png',
    question: 'The "Eyo Festival" is unique to which city?',
    options: ['Ibadan', 'Abeokuta', 'Lagos', 'Benin City'],
    correct: 2, category: 'cultural',
    fact: 'The Eyo Festival (Adamu Orisha) features white-robed masquerades parading through Lagos Island. It dates back to the early 1800s and honors deceased Lagos chiefs.',
  },
  {
    id: 'ck-03', image: '/images/postcards/badagry.png',
    question: 'Which food originated from the Yoruba/Brazilian returnee culture?',
    options: ['Jollof Rice', 'Agege Bread', 'Puff-Puff', 'Boli'],
    correct: 2, category: 'cultural',
    fact: 'Puff-puff descended from Portuguese "filhós" brought by Brazilian-Yoruba returnees (Aguda) who settled in Badagry and Lagos Island in the 1800s.',
  },
  {
    id: 'ck-04', image: '/images/postcards/national-theatre.png',
    question: 'FESTAC 77 was the largest cultural festival in African history. What does FESTAC stand for?',
    options: ['Federal State Arts Council', 'Festival of Arts & Culture', 'Federation of State Arts & Culture', 'Festival of African Culture'],
    correct: 1, category: 'cultural',
    fact: 'FESTAC 77 (2nd World Black & African Festival of Arts & Culture) attracted 17,000 participants from 59 countries. Stevie Wonder and Miriam Makeba performed.',
  },
  {
    id: 'ck-05', image: '/images/postcards/computer-village.png',
    question: '"Whatsapp me the address" was first adopted widely in Nigeria in what year?',
    options: ['2010', '2012', '2014', '2016'],
    correct: 1, category: 'cultural',
    fact: 'Nigeria became WhatsApp\'s fastest-growing market in 2012. Computer Village Ikeja was the hub where phones were "flashed" (unlocked) to run the app.',
  },
  {
    id: 'ck-06', image: '/images/postcards/makoko.png',
    question: 'Which slang means "no money" in Lagos pidgin?',
    options: ['"I dey kampe"', '"Pocket dey cry"', '"E choke"', '"Wahala dey"'],
    correct: 1, category: 'cultural',
    fact: '"Pocket dey cry" emerged from the Makoko/Ajegunle waterfront communities where daily earnings from fishing could be as low as ₦500 ($0.50).',
  },
  {
    id: 'ck-07', image: '/images/postcards/olumo-rock.png',
    question: 'The Lisabi Festival celebrates which historical event?',
    options: ['Founding of Lagos', 'Egba liberation from Oyo', 'Fall of Benin Empire', 'Biafra independence'],
    correct: 1, category: 'cultural',
    fact: 'Lisabi Agbongbo Akala led the Egba revolt against the Oyo Empire around 1775. The festival in Abeokuta celebrates this liberation every year.',
  },
  {
    id: 'ck-08', image: '/images/postcards/third-mainland-bridge.png',
    question: 'What is "Agege Bread" traditionally shaped like?',
    options: ['Round flat disc', 'Long baguette', 'Tall rectangular loaf', 'Small round ball'],
    correct: 2, category: 'cultural',
    fact: 'Agege Bread is a soft, dense rectangular loaf named after the Agege area of Lagos. It\'s often paired with ewa agoyin (mashed beans) for the iconic street breakfast.',
  },
  {
    id: 'ck-09', image: '/images/postcards/tafawa-balewa.png',
    question: 'The "Ojude Oba" festival is celebrated in which city?',
    options: ['Lagos', 'Abeokuta', 'Ijebu-Ode', 'Osogbo'],
    correct: 2, category: 'cultural',
    fact: 'Ojude Oba ("Before the King\'s Courtyard") is held in Ijebu-Ode during Eid-el-Kabir. Age groups (Regberegbe) parade in elaborate traditional attire on horseback.',
  },
  {
    id: 'ck-10', image: '/images/postcards/nike-art-gallery.png',
    question: 'Which art movement emerged from Osogbo in the 1960s?',
    options: ['Afrofuturism', 'Nsukka School', 'Osogbo Art Movement', 'Zaria Art Society'],
    correct: 2, category: 'cultural',
    fact: 'The Osogbo Art Movement (1962) was initiated by Ulli and Georgina Beier, training local artists like Twins Seven-Seven and Jimoh Buraimoh who gained global fame.',
  },
]

// ── HYPERLOCAL TRIVIA (Bus stops, Markets, Hidden spots) ──
const HYPERLOCAL_TRIVIA = [
  {
    id: 'hl-01', image: '/images/postcards/danfo-bus.png',
    question: '"Under Bridge" is a famous bus stop in Lagos. Which bridge?',
    options: ['Third Mainland', 'Eko Bridge', 'Costain Flyover', 'Ojuelegba Bridge'],
    correct: 3, category: 'hyperlocal',
    fact: 'The Ojuelegba bridge/underpass is the crossroads of Lagos mainland — Surulere, Yaba, and Mushin converge here. Wizkid\'s hit "Ojuelegba" made it globally known.',
  },
  {
    id: 'hl-02', image: '/images/postcards/balogun-market.png',
    question: 'Which market is known as the "Phones Graveyard" — where stolen phones end up?',
    options: ['Balogun Market', 'Computer Village', 'Ladipo Market', 'Ikeja Under Bridge'],
    correct: 2, category: 'hyperlocal',
    fact: 'Ladipo Market in Mushin is notorious for selling refurbished and "questionable" phones and auto parts. It spans over 20 acres.',
  },
  {
    id: 'hl-03', image: '/images/postcards/third-mainland-bridge.png',
    question: '"CMS" bus stop is named after which organization?',
    options: ['Central Motor Services', 'Church Missionary Society', 'City Municipal Services', 'Central Market Street'],
    correct: 1, category: 'hyperlocal',
    fact: 'CMS = Church Missionary Society, established in Lagos in 1842. The bus stop at the Marina marks where the first Anglican missionaries landed.',
  },
  {
    id: 'hl-04', image: '/images/postcards/computer-village.png',
    question: 'What is "Agbado" known for among Lagos commuters?',
    options: ['Last affordable bus stop', 'Fastest BRT route', 'The end of Lagos', 'Cheapest fuel station'],
    correct: 2, category: 'hyperlocal',
    fact: '"Agbado is the end of Lagos" is a running joke. Located at the extreme end of the LAMATA rail line, it marks where Lagos meets Ogun State.',
  },
  {
    id: 'hl-05', image: '/images/postcards/makoko.png',
    question: 'Which hidden beach is only accessible by boat from the Lagos harbour?',
    options: ['Elegushi Beach', 'Tarkwa Bay', 'Lekki Beach', 'Oniru Beach'],
    correct: 1, category: 'hyperlocal',
    fact: 'Tarkwa Bay is a sheltered beach near the harbour breakwater. It has a small fishing/surfing community and no road access — boats only from Maroko jetty.',
  },
  {
    id: 'hl-06', image: '/images/postcards/danfo-bus.png',
    question: '"Oshodi" was once famously described as what?',
    options: ['The cleanest place in Lagos', 'The most dangerous bus stop in Africa', 'The birthplace of Afrobeats', 'The only 24-hour market'],
    correct: 1, category: 'hyperlocal',
    fact: 'Before the 2009 cleanup by Governor Fashola, Oshodi was a chaotic transit hub with over 500,000 daily commuters, rampant crime, and gridlocked traffic across 6 lanes.',
  },
  {
    id: 'hl-07', image: '/images/postcards/balogun-market.png',
    question: 'Which market specializes in second-hand clothes called "Okrika"?',
    options: ['Balogun Market', 'Yaba Market', 'Katangua Market, Sabo', 'Eko Idumota'],
    correct: 2, category: 'hyperlocal',
    fact: 'Katangua Market in Sabo, Yaba is Lagos\' largest thrift market. "Okrika" (bend-down-select) clothes arrive in bales from the UK, US, and Europe.',
  },
  {
    id: 'hl-08', image: '/images/postcards/lekki-ikoyi-bridge.png',
    question: 'The "Falomo Roundabout" is a landmark junction in which area?',
    options: ['Surulere', 'Victoria Island', 'Ikoyi', 'Yaba'],
    correct: 2, category: 'hyperlocal',
    fact: 'Falomo is the gateway between Ikoyi and VI. The iconic roundabout near the Falomo bridge sees over 100,000 vehicles daily. The overhead bridge was demolished in 2023.',
  },
  {
    id: 'hl-09', image: '/images/postcards/national-theatre.png',
    question: 'What is the popular name for the Mile 2 — Oshodi bus corridor?',
    options: ['The Expressway', 'The Lagos Autobahn', 'Oshodi-Apapa', 'The Go-Slow Highway'],
    correct: 3, category: 'hyperlocal',
    fact: 'The Oshodi-Apapa Expressway is nicknamed "Go-Slow Highway" because traffic can turn a 20-minute drive into 3+ hours, especially near the Tin Can port.',
  },
  {
    id: 'hl-10', image: '/images/postcards/aso-rock.png',
    question: 'In Abuja, "Area One" is famous for what?',
    options: ['Government offices', 'Night markets & street food', 'Military barracks', 'The zoo'],
    correct: 1, category: 'hyperlocal',
    fact: 'Abuja\'s Area One is the go-to for night owls — suya spots, shawarma stands, and open-air bars line Ahmadu Bello Way after dark. It\'s the closest thing to Lagos nightlife in Abuja.',
  },
]

// ═══ COMBINED EXPORTS ═══
export const POSTCARD_QUESTIONS = [...VISUAL_GUESS, ...CULTURAL_KNOWLEDGE, ...HYPERLOCAL_TRIVIA]

export const PUZZLE_IMAGES = [
  { id: 'pz-01', title: 'National Theatre, Lagos', image: '/images/postcards/national-theatre.png', fact: 'Shaped like a military hat, this brutalist masterpiece was built for FESTAC 77.' },
  { id: 'pz-02', title: 'Zuma Rock', image: '/images/postcards/zuma-rock.png', fact: 'At 725m tall, Zuma Rock is often called the "Gateway to Abuja".' },
  { id: 'pz-03', title: 'Lekki-Ikoyi Link Bridge', image: '/images/postcards/lekki-ikoyi-bridge.png', fact: 'The LED-lit cable-stayed bridge opened in 2013 connecting Lekki to Ikoyi.' },
  { id: 'pz-04', title: 'Olumo Rock, Abeokuta', image: '/images/postcards/olumo-rock.png', fact: 'An ancient fortress used by the Egba people during the 19th century wars.' },
  { id: 'pz-05', title: 'Aso Rock, Abuja', image: '/images/postcards/aso-rock.png', fact: 'Home to the Nigerian Presidential Villa and seat of power.' },
  { id: 'pz-06', title: 'Third Mainland Bridge', image: '/images/postcards/third-mainland-bridge.png', fact: 'At 11.8 km, it was Africa\'s longest bridge when completed in 1990.' },
  { id: 'pz-07', title: 'Balogun Market', image: '/images/postcards/balogun-market.png', fact: 'Lagos Island\'s largest market generates ₦2 billion daily in trade.' },
  { id: 'pz-08', title: 'Makoko Community', image: '/images/postcards/makoko.png', fact: 'Over 250,000 people live on stilts above the Lagos Lagoon in Makoko.' },
  { id: 'pz-09', title: 'Computer Village', image: '/images/postcards/computer-village.png', fact: 'Africa\'s largest tech market in Ikeja with over 5,000 shops.' },
]

// ═══ CONTENT PACK CATEGORIES (for filtering in PostCards game) ═══
export const CONTENT_PACKS = [
  { id: 'all', label: 'All', count: POSTCARD_QUESTIONS.length },
  { id: 'visual', label: '📷 Visual Guess', count: VISUAL_GUESS.length },
  { id: 'cultural', label: '🎭 Cultural', count: CULTURAL_KNOWLEDGE.length },
  { id: 'hyperlocal', label: '📍 Hyperlocal', count: HYPERLOCAL_TRIVIA.length },
]
