# GeoQuiz V3+ Complete Feature Roadmap
# visitnaija.online — The Duolingo of Nigerian Geography
# Last updated: 2026-04-29

============================================================
PHASE 1: QUIZ GAME (✅ COMPLETE)
============================================================

### V2 Features (All Done)
- [x] Multi-region: Lagos + Abuja FCT
- [x] 12 quiz categories, 260+ questions
- [x] Audio engine (correct/wrong/streak/timeout sounds)
- [x] Haptic feedback (vibrate on events)
- [x] Daily Challenge (same for everyone)
- [x] Social sharing (WhatsApp, Twitter, Facebook, Telegram, LinkedIn, Reddit, copy link)
- [x] Challenge links (encode & share exact quiz config)
- [x] Streak counter
- [x] Per-category stats dashboard
- [x] Onboarding tutorial
- [x] Streak reset on timeout fix

### V3 Features (All Done)
- [x] PWA: manifest, service worker, install prompt
- [x] Sponsored Pins: 5 placeholder sponsors, 30% impression rate
- [x] Journey Card: results page sponsored discovery
- [x] Seasonal Leaderboard: All Time / This Week / This Month tabs
- [x] Blitz Mode: 30 questions, 10s each, race format
- [x] VisitLagos cross-promotion card on landing
- [x] Achievements Wall: 16 badges, SVG progress ring
- [x] Achievement tracking: Abuja games, blitz scores, shares
- [x] Cloudflare Pages deployment (unlimited bandwidth)
- [x] Deploy script (deploy.ps1)
- [x] OG meta tags for visitnaija.online

============================================================
PHASE 2: ENGAGEMENT ENGINE (NEXT — Sessions 4-8)
============================================================

### Session 4: XP + Levels + Streak Freeze
- [ ] XP system: earn XP for every action
  - Correct answer: 10-50 XP (based on accuracy)
  - Complete game: 100 XP
  - Daily login: 25 XP
  - Streak bonus: streak × 5 XP
  - Sharing: 20 XP
  - Check-in: 50 XP
- [ ] Level system: 500 XP per level (Level 1-50)
  - Titles: Newcomer → Explorer → Navigator → Master → Legend → Naija King 👑
  - Level shown on leaderboard + profile
  - Level-up animation with confetti + sound
- [ ] Streak Freeze
  - Earn 1 freeze every 7 days
  - Auto-activates on missed day
  - Max 2 stored
  - "Your streak was saved!" message
  - ❄️ icon display

### Session 5: Weekly Leagues + Daily Login Rewards
- [ ] Weekly Leagues (Duolingo-style)
  - 5 tiers: Bronze → Silver → Gold → Diamond → Champion
  - 30 players per league
  - Top 10 promote, bottom 5 demote (weekly reset Monday)
  - League badge on profile + leaderboard
  - Champion league = special profile border
- [ ] Daily Login Rewards
  - Day 1: 25 XP
  - Day 2: 50 XP
  - Day 3: Streak Freeze 🧊
  - Day 4: 75 XP
  - Day 5: Map Skin unlock 🗺️
  - Day 6: 100 XP
  - Day 7: Bonus badge + 200 XP 🏆
  - Visual reward calendar grid
  - "Claim Today's Reward" button on homepage

### Session 6: Live Multiplayer Duels + Push Notifications
- [ ] Live Multiplayer Duels
  - "Find Opponent" matchmaking
  - Both see SAME question simultaneously
  - Both drop pins at the same time
  - Score comparison after each round
  - Best of 5 → winner gets XP bonus
  - WebSocket via Supabase Realtime
- [ ] Push Notifications (PWA)
  - "🔥 Your streak is in danger!"
  - "🏆 Daily Challenge is ready"
  - "⚔️ @Tunde challenged you!"
  - "📈 2 games from Gold League!"
  - "🎁 Daily reward waiting!"

### Session 7: Story Mode + Map Skins
- [ ] Story Mode / Guided Campaign
  - Week 1: "Learn the 20 LGAs"
  - Week 2: "Master the Markets"
  - Week 3: "Bridge the Gaps"
  - Week 4: "Cultural Lagos"
  - Each chapter: intro story → quiz → fun facts → badge
  - Campaign map (Candy Crush style)
- [ ] Map Skins (cosmetic unlocks)
  - Default (Voyager) — free
  - 🌙 Dark Mode — Level 5
  - 🛰️ Satellite — Level 10
  - 📜 Vintage Sepia — 50-day streak
  - 🎨 Watercolor — all categories complete
  - 🔥 Inferno — win 10 duels
  - 🌈 Rainbow — perfect blitz game

### Session 8: Friends + Geography IQ
- [ ] Friend System
  - Add by 6-char friend code
  - Friends tab on leaderboard
  - See friends' scores, streaks, levels
  - "Beat Your Friends" nudge
  - "Among friends, you rank #3"
- [ ] Geography IQ Score
  - Single number 0-200 (Elo-like)
  - Updates after every game
  - Shareable: "My GeoQuiz IQ is 142"
  - Comparison with city average

### Additional Quiz Features (Sprinkle In)
- [ ] Photo Round: show real photo, guess location
- [ ] Audio Clue Round: market sounds, dialect, music
- [ ] Prediction Mode: "I'm sure" / "Guess" / "No idea" confidence
- [ ] Replay Mode: animated pin drops → shareable GIF
- [ ] Learn Mode: flashcards before quiz
- [ ] Historical Timeline: "Lagos 1960 vs 2025"
- [ ] Build Your Own Quiz: user-generated content

============================================================
PHASE 3: CITY DISCOVERY PLATFORM (Sessions 9-14)
============================================================

### Session 9-10: Fog of War + Check-ins
- [ ] Fog of War City Map
  - Map starts covered in fog
  - Clears by: GPS visit OR quiz mastery
  - "You've explored 34% of Lagos Island"
  - Instagram-worthy screenshots
  - Social sharing of exploration maps
- [ ] Real-World Check-ins
  - Visit quiz location IRL → GPS verified (200m radius)
  - 3x XP bonus on check-in
  - "I Was Here 📍" badge
  - Check-in history on profile
  - Sponsor deals on check-in

### Session 11-12: "What's Nearby" Discovery Hub
- [ ] Discovery categories (ALL city categories):
  🍽️ Restaurants & Food
  🏨 Hotels & Accommodation
  🏖️ Beaches & Resorts
  🎬 Cinema & Theater
  🎵 Concerts & Live Music
  🎉 Parties & Nightlife
  🚗 Rides & Transportation
  🏦 Banks & ATMs
  🏫 Schools & Universities
  🚻 Public Toilets
  🏢 Businesses & Offices
  🥾 Hikes & Nature
  🚢 Cruises & Boat Tours
  🛍️ Shopping & Markets
  ⛪ Religious Sites
  🏥 Hospitals & Clinics
  ⛽ Fuel Stations
  🏋️ Gyms & Fitness
  🎭 Art Galleries & Museums
  🏟️ Sports & Recreation
- [ ] Distance-based sorting
- [ ] Category filters
- [ ] Google Maps directions link
- [ ] User ratings & reviews
- [ ] Featured/promoted listings (revenue)

### Session 11: Spin the Wheel
- [ ] Random discovery for each category
- [ ] Sponsored spots = bigger wheel slices
- [ ] "Navigate there" button
- [ ] History of spins

### Session 12: Deals & Offers Hub
- [ ] Business-specific deals near quiz locations
- [ ] "Show this screen for 15% off"
- [ ] "Complete Lekki trail → free drink"
- [ ] Time-limited deals (urgency)
- [ ] Revenue: ₦5K-50K/month per listing

### Session 13: City Walk Trails
- [ ] Pre-built walking routes:
  - Lagos Island Heritage Walk (2.5km)
  - Lekki Leisure Loop (4km)
  - VI Food Crawl (3km)
  - Abuja Power Walk (6km)
- [ ] GPS-tracked progress
- [ ] Quiz at each stop
- [ ] Trail completion badge + XP
- [ ] VisitLagos deep-links

### Session 14: Events Calendar
- [ ] What's happening this week in Lagos/Abuja
- [ ] Events linked to quiz categories
- [ ] "Eyo Festival Saturday — take Cultural Lagos quiz!"
- [ ] VisitLagos event deep-links
- [ ] Seasonal themed quizzes:
  - December: "Detty December"
  - Easter: "Holy Ground"
  - October 1: "Independence"
  - Valentine's: "Romantic Lagos"
  - Ramadan: "Sacred Spaces"

============================================================
PHASE 4: SOCIAL & COMMUNITY (Sessions 15-17)
============================================================

### Session 15: Group/Party Mode
- [ ] Host quiz for up to 10 people
- [ ] QR code join
- [ ] Live scoreboard on host screen
- [ ] Perfect for: offices, schools, tourists, parties
- [ ] Premium party packs (₦2,000)

### Session 16: Photo Challenges + Community Reviews
- [ ] Selfie at quiz locations with GeoQuiz frame
- [ ] Photo contest: "Most Beautiful Lagos Spot"
- [ ] Check-in-verified reviews
- [ ] Rate: Accessibility / Beauty / Safety / Value
- [ ] "GeoQuiz Verified" review badge

### Session 17: User Stories + Build Your Own Quiz
- [ ] "Local Tips" — insider knowledge from users
- [ ] User-submitted quiz questions
- [ ] Community voting on quality
- [ ] "Question Author" badge
- [ ] Infinite content at zero cost

============================================================
PHASE 5: MONETIZATION & B2B (Sessions 18-20)
============================================================

### Session 18: Business Dashboard (B2B Admin Panel)
- [ ] Sponsor self-serve ad creation
- [ ] Analytics: impressions, clicks, conversions, check-ins
- [ ] Deal management
- [ ] Budget control
- [ ] Revenue reporting

### Session 19: Explorer Pass (Premium Subscription)
- [ ] ₦2,000/month
- [ ] Unlimited games (free = 5/day)
- [ ] All map skins unlocked
- [ ] All city walk trails
- [ ] Redeem all deals
- [ ] Ad-free experience
- [ ] Priority duel matching
- [ ] "Explorer ✨" profile badge

### Session 20: Corporate & Gift Packages
- [ ] Gift cards: "Gift Explorer Pass to a friend"
- [ ] Corporate: "Onboard new Lagos employees with GeoQuiz"
- [ ] School packages: "Geography teacher toolkit"
- [ ] Tourism: "Welcome to Lagos" starter kit

============================================================
CONTENT EXPANSION (Ongoing)
============================================================

### More Cities
- [ ] Port Harcourt
- [ ] Ibadan
- [ ] Kano
- [ ] Enugu
- [ ] Benin City
- [ ] Calabar
Each city = new audience, new sponsors, new content

============================================================
DOMAIN & HOSTING
============================================================
- Domain: visitnaija.online (DNS propagating to Cloudflare)
- Secondary: lenodu.online (reserved)
- Hosting: Cloudflare Pages (unlimited bandwidth, free)
- Backend: Supabase (auth, database, realtime)
- GitHub: Matthewalashe/GeoQuiz
- Deploy: .\deploy.ps1 (build + wrangler deploy)

============================================================
SPONSOR INFO REQUIREMENTS
============================================================
1. Business name
2. Address / location
3. Contact: phone, email, website
4. Promotional message (max 100 chars)
5. CTA label: "Get Directions", "Book Now", etc.
6. CTA URL: Google Maps link or website
7. Logo (200x200 PNG) — optional
8. Product photos — optional
9. Tier: Bronze (₦50K/mo) / Silver (₦150K/mo) / Gold (₦500K/mo)
10. Campaign dates: start → end
