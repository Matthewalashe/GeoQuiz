# 🗺️ GeoQuiz — Explore Naija

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare)](https://visitnaija.online)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**GeoQuiz** is a gamified city discovery platform and interactive map-based quiz designed to help users explore Nigeria's geography, landmarks, and culture. 

Test your knowledge by dropping pins on an interactive map, climb the ranks from a Beginner to a Grandmaster, chat with fellow explorers in the community, and track your progress along a futuristic neon exploration journey map.

🌐 **Live Demo:** [visitnaija.online](https://visitnaija.online)

---

## 💡 The Idea

GeoQuiz transforms learning about local geography into an engaging, competitive, and social experience. Traditional maps are static and informative, but GeoQuiz makes map-reading dynamic. Users are presented with a location (e.g., a specific restaurant, beach, monument, or LGA) and must accurately pinpoint it on a blank or minimally-labeled map. 

The closer your pin is to the actual location, the higher your score. As you play, you unlock achievements, maintain streaks, and progress through a dynamic "Exploration Path" modeled after popular mobile games, providing a sense of long-term progression.

### Core Objectives:
- **Gamified Discovery:** Make discovering local attractions (Hotels, Beaches, Museums, Parks) fun.
- **Community Engagement:** Foster a local community of explorers sharing tips and high scores.
- **Mobile-First UX:** Provide a seamless, app-like experience on mobile web browsers (PWA-ready).

---

## ✨ Features

- **📍 Interactive Map Gameplay:** Drop pins on a Leaflet-powered map. Points are awarded based on the Haversine distance from the correct coordinate.
- **🌌 Futuristic Journey Map:** A visual, neon-circuit-board styled progression path showing your unlocked levels and landmarks.
- **🏆 Global Leaderboard:** Compete with players across the region. See where you rank based on your average score and completion percentage.
- **💬 Live Community Feed:** A real-time chat feed powered by Supabase. Flex your scores, share tips, and reply to other explorers.
- **⚡ Multiple Game Modes:** 
  - **Quick Play:** Standard 10-question round.
  - **Blitz Mode:** Fast-paced race against the clock (30 questions, 5 mins).
  - **Daily Challenge:** A unique seeded quiz that is the same for everyone that day.
  - **Custom Game:** Filter by region, categories, difficulty, and toggle timers.
- **👤 Player Profiles & Avatars:** Choose from over 30 avatars and set a custom explorer name.
- **📱 PWA & Mobile Optimized:** Installable as a Progressive Web App. Features a custom bottom tab bar, preventing mobile zoom issues, and a responsive floating HUD during gameplay.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Functional components, Hooks)
- **Vite** (Next-generation frontend tooling)
- **React Router DOM v6** (Client-side routing)
- **Vanilla CSS** (Custom Brutalist × Glassmorphism × Neon design system, no CSS frameworks)
- **Leaflet** (Interactive maps)

### Backend & Data
- **Supabase** (PostgreSQL database, REST APIs for Leaderboard and Community Feed)
- **LocalStorage** (Client-side persistence for XP, streaks, and session data)

### Hosting & Deployment
- **Cloudflare Pages** (Fast, global edge network hosting)
- **GitHub Actions** (CI/CD pipeline)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Matthewalashe/GeoQuiz.git
   cd GeoQuiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

### Building for Production
```bash
npm run build
```
This generates the optimized static files in the `dist` directory, ready to be deployed to Cloudflare Pages or any other static hosting service.

---

## 📂 Project Structure

```text
src/
├── assets/          # Static images, icons, and audio assets
├── components/      # Reusable React components (Dashboard, GameScreen, MapView, etc.)
├── data/            # Local data stores (questions.js, regions, etc.)
├── engine/          # Core game logic (scoring.js, xp.js, audio.js)
├── lib/             # API clients (supabase.js)
├── App.jsx          # Main application routing and layout
└── index.css        # Global CSS, design tokens, and component styles
public/
├── sw.js            # Service Worker for PWA and caching
└── manifest.json    # PWA configuration
supabase/            # SQL migration scripts for database setup
```

---

## 🎨 Design System

GeoQuiz utilizes a custom-built design system emphasizing:
- **Dark Mode First:** Deep backgrounds (`#05080f`) to make map and neon elements pop.
- **Glassmorphism:** Frosted glass panels for the HUD and feedback modals (`backdrop-filter: blur()`).
- **Micro-interactions:** Pulsing nodes, smooth transitions, and tactile feedback (haptics via `navigator.vibrate`) upon dropping pins or scoring.

---

## 📜 License

This project is licensed under the MIT License.
