/**
 * P3 Seed Script — Inserts all hardcoded game content into Supabase tables
 * 
 * USAGE:
 *   1. Open your site in browser: https://visitnaija.online
 *   2. Open DevTools console (F12 → Console)
 *   3. Paste this entire script and press Enter
 *   4. Wait for "✅ ALL DONE" message
 * 
 * This script uses the Supabase client that's already loaded on the page.
 */

(async function seedP3() {
  // Get supabase client from the app's module
  const { supabase } = await import('/src/lib/supabase.js')
  if (!supabase) { console.error('❌ No supabase client'); return }

  const results = []
  function log(table, count, err) {
    if (err) { console.error(`❌ ${table}:`, err); results.push(`❌ ${table}: ${err}`) }
    else { console.log(`✅ ${table}: ${count} rows`); results.push(`✅ ${table}: ${count} rows`) }
  }

  // ═══════════════════════════════════════
  // 1. TRIVIA PACKS (30 questions, 3 packs)
  // ═══════════════════════════════════════
  const trivia = [
    // Lagos pack
    ...[ 
      { q: 'Which is the longest bridge in Lagos?', options: ['Third Mainland Bridge', 'Carter Bridge', 'Eko Bridge', 'Lekki-Ikoyi Link Bridge'], ans: 0, fact: 'At 11.8 km, Third Mainland Bridge was the longest in Africa when built in 1990.' },
      { q: 'What year was Lagos State created?', options: ['1960', '1967', '1976', '1991'], ans: 1, fact: 'Lagos State was created on 27 May 1967 from the former Western Region.' },
      { q: 'What is the popular yellow commercial bus in Lagos called?', options: ['Keke', 'Okada', 'Danfo', 'Molue'], ans: 2, fact: 'Danfo buses carry over 10 million Lagosians daily.' },
      { q: 'Which of these is NOT an LGA in Lagos State?', options: ['Ikeja', 'Surulere', 'Ogbomoso', 'Epe'], ans: 2, fact: 'Ogbomoso is in Oyo State. Lagos has 20 LGAs.' },
      { q: "What is the famous arts market in Lekki called?", options: ['Balogun Market', 'Lekki Arts & Crafts Market', 'Tejuosho Market', 'Computer Village'], ans: 1, fact: "Lekki Arts & Crafts Market is Lagos's top destination for souvenirs and local art." },
      { q: 'What does "CMS" stand for in Lagos bus stop name?', options: ['Central Motor Services', 'Church Missionary Society', 'City Municipal Services', 'Central Market Street'], ans: 1, fact: 'The Church Missionary Society arrived in Lagos in 1842.' },
      { q: "Which is Africa's largest open-air electronics market?", options: ['Trade Fair Complex', 'Computer Village, Ikeja', 'Alaba International', 'Ladipo Market'], ans: 1, fact: 'Computer Village generates ₦1.5 billion daily with over 5,000 shops.' },
      { q: 'Which bridge links Lagos Mainland to Lagos Island?', options: ['Third Mainland only', 'Carter Bridge only', 'Eko Bridge only', 'All three bridges'], ans: 3, fact: 'Three bridges serve as links — Third Mainland (11.8 km), Carter (1901), and Eko (1975).' },
      { q: 'Oshodi was famously called the most dangerous bus stop in which continent?', options: ['The World', 'Africa', 'West Africa', 'Nigeria'], ans: 1, fact: "Before Fashola's 2009 cleanup, Oshodi had 500,000+ daily commuters and rampant crime." },
      { q: 'What is "Agbado" known for among Lagos commuters?', options: ['Last affordable bus stop', 'Fastest BRT route', 'The end of Lagos', 'Cheapest fuel station'], ans: 2, fact: '"Agbado is the end of Lagos" — it marks where Lagos meets Ogun State.' },
    ].map((q, i) => ({ pack_id: 'lagos', label: '🌊 Lagos Life', description: 'Bridges, buses, markets & neighborhoods', color: '#0ea5e9', question: q.q, options: q.options, answer_index: q.ans, fact: q.fact, sort_order: i })),
    // Nigeria pack
    ...[
      { q: 'In what year did Nigeria gain independence?', options: ['1955', '1960', '1963', '1970'], ans: 1, fact: 'Nigeria gained independence from Britain on 1 October 1960.' },
      { q: 'Which rock formation appears on the ₦100 note?', options: ['Olumo Rock', 'Aso Rock', 'Zuma Rock', 'Idanre Hills'], ans: 2, fact: 'Zuma Rock stands 725m high — "Gateway to Abuja".' },
      { q: 'What does FESTAC stand for?', options: ['Federal State Arts Council', 'Festival of Arts & Culture', 'Festival of African Culture', 'Federal Arts Commission'], ans: 1, fact: 'FESTAC 77 attracted 17,000 participants from 59 countries to Lagos.' },
      { q: "Which city is Nigeria's seat of government?", options: ['Lagos', 'Kano', 'Ibadan', 'Abuja'], ans: 3, fact: 'Abuja became the capital in 1991, replacing Lagos for neutrality.' },
      { q: 'Which Nigerian author won the Nobel Prize for Literature?', options: ['Chinua Achebe', 'Wole Soyinka', 'Ben Okri', 'Chimamanda Adichie'], ans: 1, fact: 'Wole Soyinka won in 1986, the first African to receive the Nobel Prize in Literature.' },
      { q: "What is Nigeria's national animal?", options: ['Lion', 'Elephant', 'Eagle', 'Horse'], ans: 2, fact: 'The Eagle on the coat of arms represents strength.' },
      { q: "Which state produces most of Nigeria's cocoa?", options: ['Oyo', 'Ondo', 'Osun', 'Ekiti'], ans: 1, fact: 'Ondo State accounts for over 40% of Nigeria\'s cocoa production.' },
      { q: "Who was Nigeria's first military head of state?", options: ['Yakubu Gowon', 'Nnamdi Azikiwe', 'Tafawa Balewa', 'Aguiyi-Ironsi'], ans: 3, fact: 'Aguiyi-Ironsi became head of state after the January 1966 coup.' },
      { q: 'What is the Niger-Delta region primarily known for?', options: ['Agriculture', 'Oil production', 'Tin mining', 'Cocoa farming'], ans: 1, fact: "Nigeria is Africa's largest oil producer with 35+ billion barrels in the Niger Delta." },
      { q: 'Olumo Rock is located in which city?', options: ['Ibadan', 'Ijebu-Ode', 'Abeokuta', 'Osogbo'], ans: 2, fact: 'Olumo Rock in Abeokuta served as a natural fortress during 19th century inter-tribal wars.' },
    ].map((q, i) => ({ pack_id: 'nigeria', label: '🇳🇬 Nigeria Essentials', description: 'History, landmarks & national icons', color: '#22c55e', question: q.q, options: q.options, answer_index: q.ans, fact: q.fact, sort_order: 100 + i })),
    // Culture pack
    ...[
      { q: 'Which dish is Ewa Agoyin typically paired with?', options: ['Rice', 'Agege Bread', 'Pounded Yam', 'Eba'], ans: 1, fact: "Ewa Agoyin + Agege Bread is Lagos's most iconic street breakfast." },
      { q: 'The Eyo Festival masquerade is unique to which city?', options: ['Ibadan', 'Abeokuta', 'Lagos', 'Benin City'], ans: 2, fact: 'The Eyo Festival features white-robed masquerades parading through Lagos Island.' },
      { q: 'What Afrobeats artist made "Ojuelegba" globally famous?', options: ['Davido', 'Burna Boy', 'Wizkid', 'Fela Kuti'], ans: 2, fact: "Wizkid's \"Ojuelegba\" was remixed by Drake and Skepta, making it an international hit." },
      { q: 'Which Nigerian musician is called "Abami Eda"?', options: ['Wizkid', 'Burna Boy', 'Fela Kuti', '2Baba'], ans: 2, fact: '"Abami Eda" (peculiar being) was Fela Kuti\'s nickname. His Afrobeat was deeply political.' },
      { q: 'What does "Omo, e choke!" mean in Lagos slang?', options: ['It is expensive', 'It is amazing', 'I am tired', 'It is crowded'], ans: 1, fact: '"E choke" was popularized by Davido and means something is absolutely amazing.' },
      { q: 'What is "Okrika" in Lagos markets?', options: ['Stolen goods', 'Second-hand clothes', 'Fake designer bags', 'Cheap local fabric'], ans: 1, fact: '"Bend-down-select" Okrika clothes arrive in bales from Europe.' },
      { q: 'The Lisabi Festival celebrates which historical event?', options: ['Founding of Lagos', 'Egba liberation from Oyo', 'Fall of Benin Empire', 'Battle of Abeokuta'], ans: 1, fact: 'Lisabi Agbongbo Akala led the Egba revolt against Oyo around 1775.' },
      { q: 'Which slang means "it is finished" in Lagos pidgin?', options: ['"E don be"', '"Ko si"', '"Sharp-sharp"', '"Agbero"'], ans: 0, fact: '"E don be" is the universal Lagos phrase for something completely finished or sold out.' },
      { q: 'What Yoruba word became universal Lagos friend slang?', options: ['Aburo', 'Omo', 'Olorun', 'Baba'], ans: 1, fact: '"Omo" (meaning child) became a universal term of address across ethnic groups in Lagos.' },
      { q: 'Which beach is only accessible by boat in Lagos?', options: ['Elegushi Beach', 'Tarkwa Bay', 'Lekki Beach', 'Oniru Beach'], ans: 1, fact: 'Tarkwa Bay is a sheltered beach near the harbour with no road access — boats only.' },
    ].map((q, i) => ({ pack_id: 'culture', label: '🎭 Culture & Vibes', description: 'Food, music, slang & festivals', color: '#f97316', question: q.q, options: q.options, answer_index: q.ans, fact: q.fact, sort_order: 200 + i })),
  ]
  const { error: e1 } = await supabase.from('cms_trivia_packs').insert(trivia)
  log('cms_trivia_packs', trivia.length, e1?.message)

  // ═══════════════════════════════════════
  // 2. CROSSWORDS (20 puzzles)
  // ═══════════════════════════════════════
  const crosswords = [
    { puzzle_id:'lagos', label:'🌊 Lagos Icons', description:'Bridges, markets & landmarks', color:'#0ea5e9', grid_size:5, across:[{num:1,text:'Commercial capital of Nigeria',answer:'LAGOS',row:0,col:0},{num:4,text:'Native name for Lagos Island',answer:'EKO',row:2,col:1}], down:[{num:1,text:'Affluent Lagos peninsula',answer:'LEKKI',row:0,col:0},{num:2,text:'___maiko — a Lagos suburb',answer:'OKOKO',row:0,col:3},{num:3,text:'Spicy Nigerian grilled meat snack',answer:'SUYA',row:0,col:4}], sort_order:0 },
    { puzzle_id:'culture', label:'🎭 Culture & Food', description:'Festivals, food & Yoruba words', color:'#f97316', grid_size:5, across:[{num:1,text:'Yoruba masquerade festival unique to Lagos',answer:'EYO',row:0,col:0},{num:3,text:'Popular Lagos street breakfast bread',answer:'AGEGE',row:2,col:0}], down:[{num:1,text:'Lagos beach where horses gallop',answer:'EKO',row:0,col:0},{num:2,text:'Yoruba word for child / friend (slang)',answer:'OMO',row:0,col:2},{num:4,text:'The "abami ___" — Fela Kuti nickname',answer:'EDA',row:2,col:3}], sort_order:1 },
    { puzzle_id:'nigeria', label:'🇳🇬 Nigeria Knows', description:'History, geography & leaders', color:'#22c55e', grid_size:6, across:[{num:1,text:"Nigeria's federal capital territory",answer:'ABUJA',row:0,col:0},{num:4,text:'Tallest rock in Nigeria (725m)',answer:'ZUMA',row:3,col:1},{num:5,text:"Nigeria's currency",answer:'NAIRA',row:5,col:0}], down:[{num:1,text:'The first president of Nigeria',answer:'AZIKI',row:0,col:0},{num:2,text:"Nigeria's longest river (shared name)",answer:'BENUE',row:0,col:2},{num:3,text:'Nobel Laureate: Wole ___',answer:'SOYIN',row:0,col:4}], sort_order:2 },
    { puzzle_id:'rivers', label:'🏞️ Rivers & Water', description:'Rivers, lakes & waterfalls', color:'#06b6d4', grid_size:5, across:[{num:1,text:'River that gives Nigeria its name',answer:'NIGER',row:0,col:0},{num:3,text:'Longest river entirely in Nigeria',answer:'BENUE',row:2,col:0}], down:[{num:1,text:'Waterfall town in Osun State (Erin-Ijesha)',answer:'NILE',row:0,col:0},{num:2,text:'Lake in Borno State, shrinking fast',answer:'CHAD',row:0,col:3}], sort_order:3 },
    { puzzle_id:'states', label:'🗺️ State Capitals', description:'Match states to capitals', color:'#8b5cf6', grid_size:5, across:[{num:1,text:'Capital of Kano State',answer:'KANO',row:0,col:0},{num:3,text:'Capital of Rivers State',answer:'PHC',row:2,col:0},{num:4,text:'Capital of Oyo State',answer:'IBADAN',row:3,col:0}], down:[{num:1,text:'Capital of Kaduna State',answer:'KAD',row:0,col:0},{num:2,text:'Capital of Ogun State',answer:'ABEO',row:0,col:2}], sort_order:4 },
    { puzzle_id:'food', label:'🍲 Nigerian Food', description:'Dishes, snacks & ingredients', color:'#ef4444', grid_size:5, across:[{num:1,text:'Famous Nigerian rice dish',answer:'JOLLOF',row:0,col:0},{num:3,text:'Fried bean cake (breakfast staple)',answer:'AKARA',row:2,col:0}], down:[{num:1,text:'Cassava flour meal (swallow)',answer:'GARRI',row:0,col:0},{num:2,text:'Fermented locust bean condiment',answer:'OGIRI',row:0,col:3}], sort_order:5 },
    { puzzle_id:'music', label:'🎵 Nigerian Music', description:'Artists, genres & hits', color:'#ec4899', grid_size:5, across:[{num:1,text:'Genre Fela Kuti created',answer:'AFRO',row:0,col:0},{num:3,text:'Wizkid hit song "___" (Come Closer)',answer:'OJUEL',row:2,col:0}], down:[{num:1,text:'Burna Boy album: African ___ (Giant)',answer:'AFRI',row:0,col:0},{num:2,text:'Lagos nightclub island for concerts',answer:'ROVE',row:0,col:3}], sort_order:6 },
    { puzzle_id:'sport', label:'⚽ Nigerian Sports', description:'Football, athletes & records', color:'#22c55e', grid_size:5, across:[{num:1,text:'Nigeria national football team (Super ___)',answer:'EAGLE',row:0,col:0},{num:3,text:'Olympic gold sprinter: Blessing ___',answer:'OKAGB',row:2,col:0}], down:[{num:1,text:'Legendary striker: Jay-Jay ___',answer:'EAKIN',row:0,col:0},{num:2,text:'City of the 2003 All Africa Games',answer:'ABUJA',row:0,col:3}], sort_order:7 },
    { puzzle_id:'pidgin', label:'🗣️ Pidgin English', description:'Translate the slangs!', color:'#f59e0b', grid_size:5, across:[{num:1,text:'"How far" means ___',answer:'HELLO',row:0,col:0},{num:3,text:'"Wahala" means ___',answer:'TROUB',row:2,col:0}], down:[{num:1,text:'"Hustle" means to ___',answer:'GRIND',row:0,col:0},{num:2,text:'"E choke" means it\'s ___',answer:'EPIC',row:0,col:3}], sort_order:8 },
    { puzzle_id:'nollywood', label:'🎬 Nollywood', description:'Movies, actors & directors', color:'#a855f7', grid_size:5, across:[{num:1,text:"Nigeria's film industry",answer:'NOLLY',row:0,col:0},{num:3,text:'Actor: Genevieve ___ (Nnaji)',answer:'NNAJI',row:2,col:0}], down:[{num:1,text:'First Nollywood film (1992): Living in ___',answer:'BOND',row:0,col:0},{num:2,text:'Comedy king: ___ Bello-Osagie (AY)',answer:'ADEYI',row:0,col:3}], sort_order:9 },
    { puzzle_id:'yoruba', label:'🏛️ Yoruba Words', description:'Basic Yoruba vocabulary', color:'#0ea5e9', grid_size:5, across:[{num:1,text:'Yoruba for "water"',answer:'OMI',row:0,col:0},{num:3,text:'Yoruba for "house"',answer:'ILE',row:2,col:0}], down:[{num:1,text:'Yoruba for "money"',answer:'OWO',row:0,col:0},{num:2,text:'Yoruba for "road"',answer:'ONA',row:0,col:2}], sort_order:10 },
    { puzzle_id:'igbo', label:'🌴 Igbo Words', description:'Basic Igbo vocabulary', color:'#22c55e', grid_size:5, across:[{num:1,text:'Igbo for "thank you"',answer:'DALU',row:0,col:0},{num:3,text:'Igbo for "food"',answer:'NRI',row:2,col:0}], down:[{num:1,text:'Igbo new yam festival',answer:'DIRI',row:0,col:0},{num:2,text:'Igbo for "one" (otu)',answer:'OTU',row:0,col:2}], sort_order:11 },
    { puzzle_id:'hausa', label:'🕌 Hausa Words', description:'Basic Hausa vocabulary', color:'#f97316', grid_size:5, across:[{num:1,text:'Hausa for "welcome"',answer:'SANNU',row:0,col:0},{num:3,text:'Hausa for "market"',answer:'KASUWA',row:2,col:0}], down:[{num:1,text:'Hausa for "king" (Sarki)',answer:'SARKI',row:0,col:0},{num:2,text:'Hausa for "water"',answer:'RUWA',row:0,col:3}], sort_order:12 },
    { puzzle_id:'landmarks', label:'🏗️ Landmarks', description:'Famous Nigerian structures', color:'#64748b', grid_size:5, across:[{num:1,text:'Rock housing the Presidential Villa',answer:'ASO',row:0,col:0},{num:3,text:'Gateway rock on Abuja highway',answer:'ZUMA',row:2,col:0}], down:[{num:1,text:'Abeokuta rock fortress',answer:'OLUMO',row:0,col:0},{num:2,text:'Sacred grove in Osun State',answer:'OSUN',row:0,col:2}], sort_order:13 },
    { puzzle_id:'transport', label:'🚐 Transport', description:'Getting around Nigeria', color:'#eab308', grid_size:5, across:[{num:1,text:'Yellow Lagos bus (VW T3)',answer:'DANFO',row:0,col:0},{num:3,text:'Three-wheeled taxi',answer:'KEKE',row:2,col:0}], down:[{num:1,text:'Motorbike taxi (banned in Lagos)',answer:'OKADA',row:0,col:0},{num:2,text:'Lagos rapid transit bus',answer:'BRT',row:0,col:3}], sort_order:14 },
    { puzzle_id:'markets', label:'🛒 Famous Markets', description:'Where Lagos shops', color:'#ef4444', grid_size:5, across:[{num:1,text:'Largest tech market in Africa (Ikeja)',answer:'COMP',row:0,col:0},{num:3,text:'Auto parts market in Mushin',answer:'LADIP',row:2,col:0}], down:[{num:1,text:'Biggest market on Lagos Island',answer:'BALOG',row:0,col:0},{num:2,text:'Mile 12 sells mainly ___',answer:'FOOD',row:0,col:3}], sort_order:15 },
    { puzzle_id:'festivals', label:'🎊 Festivals', description:'Celebrations across Nigeria', color:'#a855f7', grid_size:5, across:[{num:1,text:'Calabar carnival month',answer:'DEC',row:0,col:0},{num:3,text:'Durbar is celebrated during ___ (Eid)',answer:'EID',row:2,col:0}], down:[{num:1,text:'Ijebu-Ode horse festival: Ojude ___',answer:'OBA',row:0,col:0},{num:2,text:'Argungu ___ festival in Kebbi',answer:'FISH',row:0,col:2}], sort_order:16 },
    { puzzle_id:'nature', label:'🌿 Wildlife & Nature', description:'Parks, reserves & animals', color:'#16a34a', grid_size:5, across:[{num:1,text:'Game reserve in Bauchi State',answer:'YANK',row:0,col:0},{num:3,text:'Gorilla sanctuary in Cross River',answer:'AFI',row:2,col:0}], down:[{num:1,text:'Lekki conservation center walk: canopy ___',answer:'WALK',row:0,col:0},{num:2,text:"Nigeria's largest national park: Gashaka ___",answer:'GUMTI',row:0,col:3}], sort_order:17 },
    { puzzle_id:'history', label:'📜 Nigerian History', description:'Key dates & events', color:'#78716c', grid_size:5, across:[{num:1,text:'Year Nigeria gained independence',answer:'SIXTY',row:0,col:0},{num:3,text:'Civil war region (1967-70)',answer:'BIAFR',row:2,col:0}], down:[{num:1,text:'First republic PM: Tafawa ___',answer:'BALAW',row:0,col:0},{num:2,text:'Military era ended in ___',answer:'DEMOC',row:0,col:3}], sort_order:18 },
    { puzzle_id:'slang', label:'💬 More Slangs', description:'Advanced Lagos pidgin', color:'#f43f5e', grid_size:5, across:[{num:1,text:'"Gbese" means ___',answer:'DEBT',row:0,col:0},{num:3,text:'"Japa" means to ___',answer:'LEAVE',row:2,col:0}], down:[{num:1,text:'"Oga" means ___',answer:'BOSS',row:0,col:0},{num:2,text:'"Sapa" means ___',answer:'BROKE',row:0,col:3}], sort_order:19 },
  ]
  const { error: e2 } = await supabase.from('cms_crosswords').insert(crosswords)
  log('cms_crosswords', crosswords.length, e2?.message)

  // ═══════════════════════════════════════
  // 3. PUZZLE IMAGES (22 items)
  // ═══════════════════════════════════════
  const puzzles = [
    { puzzle_id:'pz-01', label:'National Theatre, Lagos', image:'/images/postcards/national-theatre.png', sort_order:0 },
    { puzzle_id:'pz-02', label:'Zuma Rock', image:'/images/postcards/zuma-rock.png', sort_order:1 },
    { puzzle_id:'pz-03', label:'Lekki-Ikoyi Link Bridge', image:'/images/postcards/lekki-ikoyi-bridge.png', sort_order:2 },
    { puzzle_id:'pz-04', label:'Olumo Rock, Abeokuta', image:'/images/postcards/olumo-rock.png', sort_order:3 },
    { puzzle_id:'pz-05', label:'Aso Rock, Abuja', image:'/images/postcards/aso-rock.png', sort_order:4 },
    { puzzle_id:'pz-06', label:'Third Mainland Bridge', image:'/images/postcards/third-mainland-bridge.png', sort_order:5 },
    { puzzle_id:'pz-07', label:'Balogun Market', image:'/images/postcards/balogun-market.png', sort_order:6 },
    { puzzle_id:'pz-08', label:'Makoko Community', image:'/images/postcards/makoko.png', sort_order:7 },
    { puzzle_id:'pz-09', label:'Computer Village', image:'/images/postcards/computer-village.png', sort_order:8 },
    { puzzle_id:'pz-10', label:'Badagry Heritage', image:'/images/postcards/badagry.png', sort_order:9 },
    { puzzle_id:'pz-11', label:'Tafawa Balewa Square', image:'/images/postcards/tafawa-balewa.png', sort_order:10 },
    { puzzle_id:'pz-12', label:'Abuja National Mosque', image:'/images/postcards/abuja-mosque.png', sort_order:11 },
    { puzzle_id:'pz-13', label:'Nike Art Gallery, Lekki', image:'/images/postcards/nike-art-gallery.png', sort_order:12 },
    { puzzle_id:'pz-14', label:'Osun-Osogbo Sacred Grove', image:'/images/postcards/osun-grove.png', sort_order:13 },
    { puzzle_id:'pz-15', label:'University of Lagos', image:'/images/postcards/unilag.png', sort_order:14 },
    { puzzle_id:'pz-16', label:'Danfo Bus Culture', image:'/images/postcards/danfo-bus.png', sort_order:15 },
    { puzzle_id:'pz-17', label:'Egungun Festival', image:'/images/postcards/egungun-festival.png', sort_order:16 },
    { puzzle_id:'pz-18', label:'National Theatre Side', image:'/images/postcards/national-theatre.png', sort_order:17 },
    { puzzle_id:'pz-19', label:'Lagos Island Skyline', image:'/images/postcards/lekki-ikoyi-bridge.png', sort_order:18 },
    { puzzle_id:'pz-20', label:'Zuma Rock Sunset', image:'/images/postcards/zuma-rock.png', sort_order:19 },
    { puzzle_id:'pz-21', label:'Third Mainland Night', image:'/images/postcards/third-mainland-bridge.png', sort_order:20 },
    { puzzle_id:'pz-22', label:'Olumo Rock Panorama', image:'/images/postcards/olumo-rock.png', sort_order:21 },
  ]
  const { error: e3 } = await supabase.from('cms_puzzles').insert(puzzles)
  log('cms_puzzles', puzzles.length, e3?.message)

  // ═══════════════════════════════════════
  // 4. CAMPAIGN CHAPTERS (4 chapters)
  // ═══════════════════════════════════════
  const campaign = [
    { chapter_id:'ch-1', week:1, title:'Learn the 20 LGAs', subtitle:'Master every Local Government Area', icon:'🏛️', color:'#00ff88', badge:'lga-master', badge_emoji:'🏛️', intro:'Lagos is divided into 20 Local Government Areas, each with its own character. From the bustling streets of Mushin to the elite enclaves of Eti-Osa, can you locate them all?', category_filter:'lgas', question_count:10, stages:[{id:1,name:'Lagos Island',questions:3,stars:0},{id:2,name:'Mainland Core',questions:3,stars:0},{id:3,name:'Ikeja Corridor',questions:3,stars:0},{id:4,name:'Final Exam',questions:5,stars:0}], facts:['Lagos had just 5 LGAs in 1967 — it now has 20 plus 37 LCDAs.','Eti-Osa (Victoria Island, Lekki, Ikoyi) generates more tax revenue than 30 Nigerian states combined.','Ajeromi-Ifelodun has the highest population density in Lagos at over 100,000 per km².'], sort_order:0 },
    { chapter_id:'ch-2', week:2, title:'Master the Markets', subtitle:'From Balogun to Alaba International', icon:'🛒', color:'#fbbf24', badge:'market-master', badge_emoji:'🛒', intro:'Lagos markets are the beating heart of West African commerce. Over ₦10 billion changes hands daily across hundreds of markets. Can you pinpoint where the trade happens?', category_filter:'markets', question_count:10, stages:[{id:1,name:'Island Markets',questions:3,stars:0},{id:2,name:'Mainland Markets',questions:3,stars:0},{id:3,name:'Specialty Markets',questions:3,stars:0},{id:4,name:'Market Master',questions:5,stars:0}], facts:['Alaba International Market generates over ₦3 billion daily in electronics trade.','Balogun Market on Lagos Island is the largest textile market in West Africa.','Mile 12 receives over 15,000 tonnes of food daily from across Nigeria.'], sort_order:1 },
    { chapter_id:'ch-3', week:3, title:'Bridge the Gaps', subtitle:'Transport links that connect Lagos', icon:'🌉', color:'#00d4ff', badge:'bridge-master', badge_emoji:'🌉', intro:"Lagos is a city of water. Islands, lagoons, and creeks divide it — but bridges, ferries, and expressways stitch it together. How well do you know the arteries of Africa's largest city?", category_filter:'transport', question_count:10, stages:[{id:1,name:'The Bridges',questions:3,stars:0},{id:2,name:'Bus Terminals',questions:3,stars:0},{id:3,name:'Rail & Water',questions:3,stars:0},{id:4,name:'Transport Expert',questions:5,stars:0}], facts:["Third Mainland Bridge (11.8 km) was Africa's longest bridge when completed in 1990.",'Over 10 million people use Lagos public transport daily.',"The Blue Line rail (Iddo-Mile 2) opened in 2023 — Lagos' first modern rail."], sort_order:2 },
    { chapter_id:'ch-4', week:4, title:'Cultural Lagos', subtitle:'Heritage, arts, and history', icon:'🎭', color:'#a855f7', badge:'culture-master', badge_emoji:'🎭', intro:'From the slave ports of Badagry to the Afrobeat shrines of Ikeja, Lagos is a cultural powerhouse. Eyo masquerades, Brazilian Quarter architecture, and world-class galleries await.', category_filter:'culture', question_count:10, stages:[{id:1,name:'Heritage Sites',questions:3,stars:0},{id:2,name:'Art & Music',questions:3,stars:0},{id:3,name:'Historical Roots',questions:3,stars:0},{id:4,name:'Culture Legend',questions:5,stars:0}], facts:['The Eyo Festival dates back to the early 1800s — white-robed masquerades dance through Lagos Island.','Nike Art Gallery has over 8,000 artworks — the largest private collection in West Africa.',"Fela Kuti's Kalakuta Republic was raided by 1,000 soldiers in 1977."], sort_order:3 },
  ]
  const { error: e4 } = await supabase.from('cms_campaign').insert(campaign)
  log('cms_campaign', campaign.length, e4?.message)

  // ═══════════════════════════════════════
  // 5. COLORING SCENES (11 scenes — metadata only, SVGs stay in code)
  // ═══════════════════════════════════════
  const coloring = [
    { scene_id:'keke', title:'🛺 Keke Napep', description:'Color the Lagos tricycle taxi', color:'#fde047', min_parts:3, parts:['body','roof','window1','window2','wheel1','wheel2','cargo','wheel3'], guide:{body:'#fde047',roof:'#22c55e',window1:'#64748b',window2:'#64748b',wheel1:'#1e293b',wheel2:'#1e293b',cargo:'#f97316',wheel3:'#1e293b'}, svg_key:'keke', sort_order:0 },
    { scene_id:'mosque', title:'🕌 Lagos Mosque', description:'Color a beautiful mosque', color:'#22c55e', min_parts:3, parts:['wall','dome','minaret1','minaret2','door','crescent','ground'], guide:{wall:'#fde047',dome:'#22c55e',minaret1:'#fde047',minaret2:'#fde047',door:'#a16207',crescent:'#fde047',ground:'#64748b'}, svg_key:'mosque', sort_order:1 },
    { scene_id:'church', title:'⛪ Lagos Church', description:'Paint a classic Nigerian church', color:'#3b82f6', min_parts:3, parts:['wall','roof','door','window1','window2','cross','ground'], guide:{wall:'#ffffff',roof:'#ef4444',door:'#a16207',window1:'#3b82f6',window2:'#3b82f6',cross:'#fde047',ground:'#22c55e'}, svg_key:'church', sort_order:2 },
    { scene_id:'palm', title:'🌴 Palm Tree', description:'Color a tropical palm tree', color:'#22c55e', min_parts:3, parts:['trunk','leaf1','leaf2','leaf3','coconut1','coconut2','ground'], guide:{trunk:'#a16207',leaf1:'#22c55e',leaf2:'#22c55e',leaf3:'#22c55e',coconut1:'#a16207',coconut2:'#a16207',ground:'#fde047'}, svg_key:'palm', sort_order:3 },
    { scene_id:'jollof', title:'🍚 Jollof Rice Pot', description:'Color the famous jollof pot', color:'#ef4444', min_parts:3, parts:['pot','potbody','rice','base','handle','lid','steam1','steam2'], guide:{pot:'#64748b',potbody:'#64748b',rice:'#ef4444',base:'#1e293b',handle:'#64748b',lid:'#64748b',steam1:'#ffffff',steam2:'#ffffff'}, svg_key:'jollof', sort_order:4 },
    { scene_id:'boat', title:'🚣 Fishing Boat', description:'Color a Lagos lagoon boat', color:'#0ea5e9', min_parts:3, parts:['hull','mast','sail','water','deck','sun'], guide:{hull:'#a16207',mast:'#a16207',sail:'#ffffff',water:'#3b82f6',deck:'#a16207',sun:'#fde047'}, svg_key:'boat', sort_order:5 },
    { scene_id:'agbada', title:'👘 Agbada Outfit', description:'Design a traditional outfit', color:'#a855f7', min_parts:3, parts:['head','agbada','inner','leg1','leg2','cap'], guide:{head:'#a16207',agbada:'#a855f7',inner:'#ffffff',leg1:'#1e293b',leg2:'#1e293b',cap:'#a855f7'}, svg_key:'agbada', sort_order:6 },
    { scene_id:'fuel', title:'⛽ Fuel Station', description:'Paint a Lagos petrol station', color:'#ef4444', min_parts:3, parts:['building','awning','pump1','pump2','ground','sign'], guide:{building:'#ffffff',awning:'#ef4444',pump1:'#22c55e',pump2:'#22c55e',ground:'#64748b',sign:'#fde047'}, svg_key:'fuel', sort_order:7 },
    { scene_id:'suya', title:'🥩 Suya Stand', description:"Color the suya man's grill", color:'#f97316', min_parts:3, parts:['grill','roof','skewers','meat1','meat2','meat3','ground','smoke'], guide:{grill:'#64748b',roof:'#a16207',skewers:'#64748b',meat1:'#a16207',meat2:'#a16207',meat3:'#a16207',ground:'#64748b',smoke:'#ffffff'}, svg_key:'suya', sort_order:8 },
    { scene_id:'skyline', title:'🏙️ Lagos Skyline', description:'Paint the city skyline', color:'#3b82f6', min_parts:4, parts:['bldg1','bldg2','bldg3','bldg4','bldg5','bldg6','ground','sun'], guide:{bldg1:'#64748b',bldg2:'#3b82f6',bldg3:'#0ea5e9',bldg4:'#a855f7',bldg5:'#f97316',bldg6:'#22c55e',ground:'#1e293b',sun:'#fde047'}, svg_key:'skyline', sort_order:9 },
    { scene_id:'okada', title:'🏍️ Okada Bike', description:'Color a motorcycle taxi', color:'#ef4444', min_parts:3, parts:['fwheel','rwheel','frame','seat','tank','handlebar'], guide:{fwheel:'#1e293b',rwheel:'#1e293b',frame:'#ef4444',seat:'#1e293b',tank:'#ef4444',handlebar:'#64748b'}, svg_key:'okada', sort_order:10 },
  ]
  const { error: e5 } = await supabase.from('cms_coloring').insert(coloring)
  log('cms_coloring', coloring.length, e5?.message)

  // ═══════════════════════════════════════
  // 6. ADVENTURES (20 stories)
  // ═══════════════════════════════════════
  // Import from existing data file
  const { ADVENTURE_STORIES } = await import('/src/data/adventures.js')
  const adventures = Object.entries(ADVENTURE_STORIES).map(([key, s], i) => ({
    story_id: key,
    title: s.title,
    description: s.desc,
    color: s.color,
    start_node: s.start,
    nodes: s.nodes,
    sort_order: i,
  }))
  const { error: e6 } = await supabase.from('cms_adventures').insert(adventures)
  log('cms_adventures', adventures.length, e6?.message)

  // ═══════════════════════════════════════
  // 7. WORD GAME (import from data file)
  // ═══════════════════════════════════════
  const { WORD_DATA } = await import('/src/data/wordgame.js')
  const wordgame = WORD_DATA.map((w, i) => ({
    word_id: w.id,
    word: w.word,
    clue: w.clue,
    category: w.category || null,
    image: w.image || null,
    description: w.description || null,
    history: w.history || [],
    footnotes: w.footnotes || [],
    sort_order: i,
  }))
  const { error: e7 } = await supabase.from('cms_wordgame').insert(wordgame)
  log('cms_wordgame', wordgame.length, e7?.message)

  // ═══════════════════════════════════════
  // 8. POSTCARDS (import from data file)
  // ═══════════════════════════════════════
  const { POSTCARD_QUESTIONS } = await import('/src/data/postcards.js')
  const postcards = POSTCARD_QUESTIONS.map((p, i) => ({
    postcard_id: p.id,
    pack: p.category === 'visual' ? 'visual' : p.category === 'cultural' ? 'cultural' : 'hyperlocal',
    image: p.image || null,
    question: p.question,
    options: p.options,
    correct_index: p.correct,
    category: p.category,
    fact: p.fact || null,
    sort_order: i,
  }))
  const { error: e8 } = await supabase.from('cms_postcards').insert(postcards)
  log('cms_postcards', postcards.length, e8?.message)

  // ═══════════════════════════════════════
  console.log('\n═══════════════════════════════')
  console.log('✅ ALL DONE — Seed Results:')
  results.forEach(r => console.log(r))
  console.log('═══════════════════════════════')
})()
