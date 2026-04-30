# GeoQuiz → VisitNaija Complete Roadmap
# visitnaija.online — Nigeria's #1 City Discovery Platform
# Last updated: 2026-04-30

> Vision: Quiz game → Gamified city explorer → Local discovery platform
> Stack: Vite + React 19 · Supabase · Cloudflare Pages
> Domain: visitnaija.online · GitHub: Matthewalashe/GeoQuiz

---

## ✅ PHASE 1: QUIZ FOUNDATION (Complete)

### Milestone 1.1 — Core Quiz Engine ✅
- [x] Pin-drop quiz on real map (Leaflet)
- [x] 260+ questions across Lagos + Abuja FCT
- [x] 12 quiz categories (LGAs, landmarks, education, etc.)
- [x] Haversine scoring with per-category tolerance
- [x] Multiple difficulty levels (beginner/intermediate/expert)
- [x] Configurable question count (10/15/20/25/30)
- [x] Question count warning when pool < selected

### Milestone 1.2 — Engagement Basics ✅
- [x] Audio engine (correct/wrong/streak/timeout/pin-drop)
- [x] Haptic feedback
- [x] Streak counter + best streak tracking
- [x] Daily Challenge (same for everyone, seeded)
- [x] Blitz Mode (30Q, 10s each, race format)
- [x] Per-category stats dashboard
- [x] Onboarding tutorial (first-time)

### Milestone 1.3 — Social & Sharing ✅
- [x] Share results (WhatsApp, Twitter/X, Facebook, Snapchat, Pinterest, copy link)
- [x] Challenge links (encode exact quiz config)
- [x] Seasonal leaderboard (All Time / Weekly / Monthly)

### Milestone 1.4 — Platform & Monetization ✅
- [x] PWA: manifest, service worker, install prompt
- [x] iOS Safari install instructions ("Tap Share → Add to Home Screen")
- [x] Sponsored Pins (5 placeholder sponsors, 30% impression)
- [x] Journey Card (route-based sponsor discovery on results)
- [x] Landing page sponsor cards (Featured Discoveries)
- [x] VisitLagos cross-promotion card
- [x] Achievements Wall (16 badges, SVG progress ring)
- [x] Loading screen (neon rainbow glow bar)
- [x] Quit confirmation modal (styled, with progress)
- [x] Browser back/refresh protection during gameplay
- [x] iOS Safari comprehensive fixes (dvh, safe area, tap delay)

### Milestone 1.5 — Infrastructure ✅
- [x] Cloudflare Pages hosting (unlimited bandwidth, free)
- [x] GitHub CI/CD auto-deploy
- [x] Supabase backend (auth, database, realtime)
- [x] Custom domain: visitnaija.online
- [x] Security headers + SPA routing
- [x] Deploy script (deploy.ps1)

---

## 🔴 PHASE 2: ENGAGEMENT ENGINE (Sessions 4-8)
> Goal: Make GeoQuiz addictive. Users come back daily.

### Milestone 2.1 — XP + Levels + Streak Freeze (Session 4)
- [ ] XP system: earn XP for every action
  - Correct answer: 10-50 XP (distance-based)
  - Complete game: 100 XP bonus
  - Daily login: 25 XP
  - Streak day bonus: streak_count × 5 XP
  - Share result: 20 XP
  - Real-world check-in: 50 XP
- [ ] Level system: 500 XP per level (1-50)
  - Titles: Newcomer → Explorer → Navigator → Master → Legend → Naija King 👑
  - Level shown on leaderboard + profile
  - Level-up animation with confetti + sound
- [ ] Streak Freeze
  - Earn 1 freeze every 7 days
  - Auto-activates on missed day
  - Max 2 stored
  - "Your streak was saved!" celebration message
  - ❄️ icon display on profile

### Milestone 2.2 — Weekly Leagues (Session 5)
- [ ] 5 tiers: Bronze → Silver → Gold → Diamond → Champion
- [ ] 30 players per league (virtual grouping)
- [ ] Top 10 promote, bottom 5 demote (weekly reset Monday)
- [ ] League badge on profile + leaderboard
- [ ] Champion league = special profile border + glow
- [ ] "You're 2 games from Gold!" motivational nudge

### Milestone 2.3 — Daily Login Rewards (Session 5)
- [ ] Visual reward calendar grid (7-day cycle)
  - Day 1: 25 XP
  - Day 2: 50 XP
  - Day 3: Streak Freeze 🧊
  - Day 4: 75 XP
  - Day 5: Map Skin unlock 🗺️
  - Day 6: 100 XP
  - Day 7: Exclusive badge + 200 XP 🏆
- [ ] "Claim Today's Reward" button on homepage
- [ ] Missed days shown as dimmed

### Milestone 2.4 — Live Multiplayer Duels (Session 6)
- [ ] "Find Opponent" matchmaking
- [ ] Both see SAME question simultaneously
- [ ] Both drop pins at the same time
- [ ] Score comparison after each round
- [ ] Best of 5 → winner gets XP bonus
- [ ] Duel history on profile
- [ ] WebSocket via Supabase Realtime

### Milestone 2.5 — Push Notifications (Session 6)
- [ ] PWA push notifications
  - "🔥 Your streak is in danger!"
  - "🏆 Daily Challenge is ready"
  - "⚔️ @Tunde challenged you!"
  - "📈 2 games from Gold League!"
  - "🎁 Daily reward waiting!"

### Milestone 2.6 — Story Mode + Map Skins (Session 7)
- [ ] Guided Campaign (Candy Crush-style map)
  - Week 1: "Learn the 20 LGAs"
  - Week 2: "Master the Markets"
  - Week 3: "Bridge the Gaps"
  - Week 4: "Cultural Lagos"
  - Each chapter: intro story → quiz → fun facts → badge
- [ ] Map Skins (cosmetic unlocks)
  - Default (Voyager) — free
  - 🌙 Dark Mode — Level 5
  - 🛰️ Satellite — Level 10
  - 📜 Vintage Sepia — 50-day streak
  - 🎨 Watercolor — all categories complete
  - 🔥 Inferno — win 10 duels
  - 🌈 Rainbow — perfect blitz game

### Milestone 2.7 — Friends + Geography IQ (Session 8)
- [ ] Friend System (6-char friend codes)
- [ ] Friends tab on leaderboard
- [ ] "Beat Your Friends" nudge
- [ ] Geography IQ Score (0-200, Elo-like)
  - Updates after every game
  - Shareable: "My GeoQuiz IQ is 142"
  - City average comparison

---

## 🟡 PHASE 3: CITY DISCOVERY (Sessions 9-14)
> Goal: Transform from quiz into real-world city companion.
> This is where VisitNaija becomes a platform, not just a game.

### Milestone 3.1 — Fog of War Map (Session 9)
- [ ] Map starts covered in fog/clouds
- [ ] Clears by GPS visit OR quiz mastery of area
- [ ] "You've explored 34% of Lagos Island"
- [ ] Instagram-worthy map screenshots
- [ ] Social sharing of exploration progress
- [ ] Friends' exploration overlay comparison

### Milestone 3.2 — Real-World Check-ins (Session 10)
- [ ] GPS-verified check-in (200m radius)
- [ ] 3x XP bonus on check-in
- [ ] "I Was Here 📍" badge
- [ ] Check-in history timeline on profile
- [ ] Sponsor deals triggered by check-in

### Milestone 3.3 — City Discovery Page (Sessions 11-12)
> **The "What's Nearby" hub — the heart of the platform.**
> Every category below = a sponsorship opportunity.

- [ ] Discovery page accessible from main nav
- [ ] Map-based + list-based views
- [ ] Distance sorting + category filters
- [ ] Google Maps directions integration
- [ ] User ratings & reviews (check-in verified)
- [ ] Featured/promoted listings (sponsor revenue)

#### All City Discovery Categories:
| Category | Icon | Example Listings |
|----------|------|-----------------|
| 🍽️ Restaurants & Food | 🍽️ | Nkoyo, The Place, Bungalow |
| 🏨 Hotels & Accommodation | 🏨 | Eko Hotels, Radisson, Airbnb |
| 🏖️ Beaches & Resorts | 🏖️ | Elegushi, Tarkwa Bay, La Campagne |
| 🎬 Cinema & Movies | 🎬 | Genesis Cinemas, Filmhouse |
| 🎵 Concerts & Live Music | 🎵 | Muri Okunola Park, Hard Rock |
| 🎉 Parties & Nightlife | 🎉 | Quilox, Club 57, Cubana |
| 🍻 Bars & Lounges | 🍻 | Sky Bar, Rufus & Bee |
| 🚌 Bus Stops & Transit | 🚌 | BRT stops, Uber pickup zones |
| 🏦 Banks & ATMs | 🏦 | GTBank, Access, First Bank |
| 🏫 Schools & Universities | 🏫 | UNILAG, LASU, Pan-Atlantic |
| 🚻 Public Toilets | 🚻 | Clean public restroom locations |
| 🌳 Public Parks & Gardens | 🌳 | Freedom Park, Millennium Park |
| 📶 Free WiFi Spots | 📶 | Cafes, co-working, libraries |
| ⚽ Football & Sports | ⚽ | Teslim Balogun, Onikan |
| 🏋️ Gyms & Fitness | 🏋️ | Body Perfect, Fitness Plus |
| 👗 Fashion Houses & Boutiques | 👗 | Deola Sagoe, Lisa Folawiyo |
| 🛍️ Shopping & Markets | 🛍️ | Balogun, Computer Village, Ikeja City Mall |
| ⛪ Religious Sites | ⛪ | Churches, mosques, temples |
| 🏥 Hospitals & Clinics | 🏥 | Lagos University Teaching Hospital |
| ⛽ Fuel Stations | ⛽ | NNPC, TotalEnergies |
| 🎭 Art Galleries & Museums | 🎭 | Nike Gallery, National Museum |
| 🏟️ Sports & Recreation | 🏟️ | National Stadium, Golf clubs |
| 🚢 Cruises & Boat Tours | 🚢 | Lagos lagoon tours, yacht clubs |
| 🥾 Hikes & Nature Trails | 🥾 | Olumo Rock, conservation centres |
| 🎪 Theater & Comedy | 🎪 | Terra Kulture, MUSON Centre |
| 🏢 Co-working Spaces | 🏢 | CcHUB, LeadSpace, Venia Hub |
| 🧒 Kid-Friendly Activities | 🧒 | Fun Factory, Funtopia |
| 📸 Photo Spots & Viewpoints | 📸 | Third Mainland Bridge, Lekki-Ikoyi Link |

### Milestone 3.4 — Spin the Wheel (Session 11)
- [ ] "Can't decide?" → random discovery per category
- [ ] Sponsored spots = bigger wheel slices
- [ ] "Navigate there" button
- [ ] Spin history

### Milestone 3.5 — Deals & Offers Hub (Session 12)
- [ ] Business-specific deals near quiz locations
- [ ] "Show this screen for 15% off"
- [ ] "Complete Lekki trail → free drink at Bungalow"
- [ ] Time-limited deals (urgency mechanics)
- [ ] Revenue: ₦5K-50K/month per business listing

### Milestone 3.6 — City Walk Trails (Session 13)
- [ ] Pre-built GPS-tracked walking routes:
  - Lagos Island Heritage Walk (2.5km) — Easy
  - Lekki Leisure Loop (4km) — Medium
  - VI Food Crawl (3km) — Easy
  - Abuja Power Walk (6km) — Hard
- [ ] Quiz questions unlock at each trail stop
- [ ] Trail completion badge + XP bonus
- [ ] VisitLagos deep-links for directions

### Milestone 3.7 — Events Calendar (Session 14)
- [ ] What's happening this week in Lagos/Abuja
- [ ] Events linked to quiz categories
- [ ] VisitLagos event deep-links
- [ ] Seasonal themed quizzes:
  - 🎉 December: "Detty December" (nightlife & party spots)
  - ⛪ Easter: "Holy Ground" (religious landmarks)
  - 🇳🇬 October 1: "Independence" (historical quiz)
  - 💕 Valentine's: "Romantic Lagos" (date spots)
  - 🌙 Ramadan: "Sacred Spaces" (mosques & cultural sites)
- [ ] Weekend Challenges
  - "Visit 3 quiz locations IRL → 500 XP"
  - "Play 5 games before midnight → bonus badge"

---

## 🟢 PHASE 4: SOCIAL & COMMUNITY (Sessions 15-17)
> Goal: User-generated content + social features for virality.

### Milestone 4.1 — Group/Party Mode (Session 15)
- [ ] Host quiz for up to 10 people
- [ ] QR code join (no app install needed)
- [ ] Live scoreboard on host screen
- [ ] Use cases: office team building, school groups, tourist groups, parties
- [ ] Premium party packs (₦2,000 for 50-question packs)

### Milestone 4.2 — Photo Challenges + Reviews (Session 16)
- [ ] "Take a selfie at this location" + GeoQuiz photo frame
- [ ] "Most Beautiful Lagos Spot" weekly photo contest
- [ ] User-generated photo gallery per location
- [ ] Check-in-verified reviews
  - Rate: Accessibility / Beauty / Safety / Value
  - "GeoQuiz Verified" review badge
- [ ] Instagram-worthy photo templates with branding

### Milestone 4.3 — User Content (Session 17)
- [ ] "Local Tips" — insider knowledge from users
  - "I grew up near Third Mainland Bridge. Here's what tourists don't know..."
- [ ] Build Your Own Quiz
  - Users create custom quizzes about their neighborhood
  - "Surulere Local Knowledge Test" by @TundeFromSurulere
  - Community voting on quality
  - Best quizzes featured on homepage
  - **Infinite content at zero cost**
- [ ] "Question Author" badge for contributors

---

## 🔵 PHASE 5: MONETIZATION & B2B (Sessions 18-20)
> Goal: Sustainable revenue streams.

### Milestone 5.1 — Business Dashboard (Session 18)
- [ ] Separate admin panel for sponsor businesses
- [ ] Self-serve ad creation: message + CTA + budget
- [ ] Analytics: impressions, clicks, conversions, check-ins
- [ ] Deal management + performance tracking
- [ ] Budget control + auto-renewal
- [ ] **This is the primary revenue engine.**

### Milestone 5.2 — Explorer Pass (Session 19)
| Feature | Free | Explorer Pass (₦2,000/mo) |
|---------|------|--------------------------|
| Daily Challenge | ✅ | ✅ |
| Quiz games | 5/day | Unlimited |
| Leaderboard | ✅ | ✅ |
| Achievements | ✅ | ✅ |
| Map Skins | 2 | All unlocked |
| Fog of War | ✅ | ✅ |
| City Walk Trails | 1 free | All trails |
| Deals & Offers | View only | Redeem all |
| Ad-free | ❌ | ✅ |
| Priority duels | ❌ | ✅ |
| Profile badge | ❌ | Explorer ✨ |

### Milestone 5.3 — Corporate & Gift Packages (Session 20)
- [ ] Gift cards: "Gift Explorer Pass to a friend"
- [ ] Corporate: "Onboard new Lagos employees with GeoQuiz"
- [ ] School packages: "Geography teacher toolkit"
- [ ] Tourism: "Welcome to Lagos" starter kit for visitors

---

## 🟣 CONTENT EXPANSION (Ongoing)

### Quiz Content
- [ ] Photo Round: real photo → guess location
- [ ] Audio Clue Round: market sounds, dialect, music
- [ ] Prediction Mode: "I'm sure" / "Guess" / "No idea"
- [ ] Replay Mode: animated pin drops → shareable GIF
- [ ] Learn Mode: flashcards before quiz
- [ ] Historical Timeline: "Lagos 1960 vs 2025" side-by-side

### More Cities
Each city = new audience, new sponsors, new content
- [ ] Port Harcourt
- [ ] Ibadan
- [ ] Kano
- [ ] Enugu
- [ ] Benin City
- [ ] Calabar
- [ ] Abeokuta
- [ ] Warri

---

## 💰 REVENUE STREAMS SUMMARY

| Stream | Model | Target |
|--------|-------|--------|
| **Sponsored Listings** | ₦5K-50K/mo per business | Phase 3 |
| **Business Dashboard** | Self-serve SaaS | Phase 5 |
| **Explorer Pass** | ₦2,000/mo subscription | Phase 5 |
| **Party Packs** | ₦2,000 per event | Phase 4 |
| **Corporate Packages** | Custom pricing | Phase 5 |
| **Featured Deals** | Commission on redemption | Phase 3 |

---

## 🗂 SPONSOR INFO REQUIREMENTS

When onboarding a business:
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

---

## 🏗 INFRASTRUCTURE

| Component | Service | Status |
|-----------|---------|--------|
| Frontend | Cloudflare Pages | ✅ Live |
| Backend | Supabase | ✅ Connected |
| Domain | visitnaija.online | ✅ DNS set |
| CI/CD | GitHub → Auto-deploy | ✅ Active |
| Deploy | `.\deploy.ps1` | ✅ Ready |
| Monitoring | Cloudflare Analytics | ✅ Free |
