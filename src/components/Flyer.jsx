import { useState } from 'react'
import { CopyRegular, ArrowDownloadRegular, ShareRegular, CheckmarkCircleRegular } from '@fluentui/react-icons'

// Realistic SVG path for a QR code pointing to https://visitnaija.online
function QRCodeSVG({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
      <rect width="29" height="29" fill="white" />
      {/* Position Detection Patterns */}
      {/* Top Left */}
      <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2z" fill="black" />
      {/* Top Right */}
      <path d="M22 0h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2z" fill="black" />
      {/* Bottom Left */}
      <path d="M0 22h7v7H0v-7zm1 1v5h5v-5H1zm1 1h3v3H2v-3z" fill="black" />
      {/* Alignment Pattern */}
      <path d="M20 20h5v5h-5v-5zm1 1v3h3v-3h-3zm1 1h1v1h-1v-1z" fill="black" />
      {/* Timing Patterns */}
      <path d="M6 8h1v1H6V8zm0 2h1v1H6v-1zm0 2h1v1H6v-1zm0 4h1v1H6v-1zm0 2h1v1H6v-1zm2 6h1v1H8v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm4 0h1v1h-1v-1zm2 0h1v1h-1v-1z" fill="black" />
      {/* Data and details to resemble a functional QR code */}
      <path d="M9 0h2v1H9V0zm3 0h1v3h-1V0zm3 0h1v1h-1V0zm1 0h1v2h-1V0zm2 0h2v1h-2V0zm-10 2h2v1H9V2zm4 0h1v2h-1V2zm2 0h1v1h-1V2zm2 0h1v1h-1V2zm-9 2h1v1H8V4zm2 0h1v1h-1V4zm4 0h2v1h-2V4zm3 0h1v2h-1V4zm-9 2h1v1H9V6zm2 0h1v1h-1V6zm4 0h1v1h-1V6zm2 0h2v1h-2V6zm-9 2h3v1H8V8zm4 0h1v2h-1V8zm3 0h2v1h-2V8zm1 1h1v1h-1V9zm1 0h2v1h-2V9zm-10 1h2v1H8v-1zm3 0h1v2h-1v-2zm3 0h2v1h-2v-1zm4 0h2v1h-2v-1zm-12 2h1v1H8v-1zm2 0h1v1h-1v-1zm3 0h1v2h-1v-2zm3 0h1v1h-1v-1zm2 0h3v1h-3v-1zm-11 2h2v1H9v-1zm3 0h2v1h-2v-1zm5 0h1v1h-1v-1zm2 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1 0h1v2h-1v-2zm-12 1h1v2H8v-2zm4 0h1v1h-1v-1zm2 0h3v1h-3v-1zm6 0h1v1h-1v-1zm-10 2h2v1H8v-1zm3 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1zm1 0h2v1h-2v-1zm-10 2h1v1H9v-1zm2 0h1v1h-1v-1zm3 0h1v2h-1v-2zm4 0h1v1h-1v-1zm1 0h2v1h-2v-1zm-11 2h2v1H8v-1zm4 0h2v1h-2v-1zm3 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-9 2h1v1H9v-1zm2 0h1v1h-1v-1zm2 0h3v1h-3v-1zm5 0h1v1h-1v-1zm-9 2h2v1H9v-1zm3 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h3v1h-3v-1z" fill="black" />
    </svg>
  )
}

export default function Flyer() {
  const [copied, setCopied] = useState(false)
  const shareText = "Experience Nigeria like never before! 🗺️🇳🇬 Pin locations on interactive maps, discover beautiful landmarks, unlock achievements, and climb the global rankings. Download the app at visitnaija.online!"

  function handleCopy() {
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'Wanda — Experience Nigeria',
        text: shareText,
        url: 'https://visitnaija.online'
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  const features = [
    { icon: '🗺️', title: 'Interactive Exploration', desc: 'Discover restaurants, hotels, beaches, resorts & hidden gems across Lagos with rich map experiences.' },
    { icon: '🎮', title: 'Games & Quizzes', desc: 'Geography quiz, word games, trivia, puzzles, pinpoint, crossword, coloring and more — all in one app.' },
    { icon: '🎟️', title: 'Events & Passes', desc: 'Create events, RSVP, download your event pass with QR code, and see who else is going.' },
    { icon: '📍', title: 'List Your Business', desc: 'Free business listings — get your restaurant, hotel, or service discovered by thousands of explorers.' },
    { icon: '🏆', title: 'Leaderboard & Achievements', desc: 'Earn XP, climb leagues (Bronze → Diamond), unlock 30+ badges, and compete with friends.' },
    { icon: '💬', title: 'Community Chat', desc: 'Share tips, post scores, connect with fellow Nigerian explorers in real-time.' },
    { icon: '🎁', title: 'Daily Rewards', desc: 'Daily login bonuses, streak multipliers, and a coin shop for exclusive rewards.' },
    { icon: '📮', title: 'Digital Postcards', desc: 'Create and share beautiful postcards featuring Nigerian landmarks and culture.' },
  ]

  const sitemap = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Explore Lagos', path: '/explore', icon: '🗺️' },
    { label: 'Play Games', path: '/play', icon: '🎮' },
    { label: 'Events & Passes', path: '/pass', icon: '🎟️' },
    { label: 'Community', path: '/community', icon: '💬' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
    { label: 'Achievements', path: '/achievements', icon: '🏅' },
    { label: 'Rewards', path: '/rewards', icon: '🎁' },
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'List Business', path: '/list-your-business', icon: '📍' },
    { label: 'Find Handymen', path: '/handymen', icon: '🔧' },
    { label: 'Deals & Offers', path: '/deals', icon: '🏷️' },
    { label: 'Discovery', path: '/discovery', icon: '🔍' },
    { label: 'Postcards', path: '/postcards', icon: '📮' },
  ]

  return (
    <div className="flyer-page">
      {/* Hero Section */}
      <div className="flyer-hero">
        <img src="/wanda-logo.png" alt="Wanda" className="flyer-hero-logo" />
        <h1 className="flyer-hero-title">WANDA</h1>
        <p className="flyer-hero-tagline">Experience Nigeria Like Never Before</p>
        <div className="flyer-hero-badges">
          <span className="flyer-badge">🇳🇬 Made in Nigeria</span>
          <span className="flyer-badge">📱 PWA — Works Offline</span>
          <span className="flyer-badge">🆓 100% Free</span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="flyer-section">
        <h2 className="flyer-section-title">Everything in One App</h2>
        <div className="flyer-feature-grid">
          {features.map((f, i) => (
            <div key={i} className="flyer-feature-card">
              <span className="flyer-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QR + Share Section */}
      <div className="flyer-cta-section">
        <div className="flyer-qr-block">
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=https%3A%2F%2Fvisitnaija.online" 
            alt="QR Code" className="flyer-qr-img" 
          />
          <div className="flyer-qr-label">
            <strong>Scan to Visit</strong>
            <span>visitnaija.online</span>
          </div>
        </div>
        <div className="flyer-share-actions">
          <h2>Share Wanda</h2>
          <p className="flyer-share-caption">{shareText}</p>
          <button className="btn btn-primary flyer-action-btn" onClick={handleCopy}>
            {copied ? <CheckmarkCircleRegular fontSize={20} /> : <CopyRegular fontSize={20} />}
            {copied ? "Copied!" : "Copy Share Caption"}
          </button>
          <button className="btn btn-outline flyer-action-btn" onClick={handleShare}>
            <ShareRegular fontSize={20} />
            Share App Link
          </button>
          <a href="/wanda-model-photo.png" download="wanda-advertising-flyer.png" className="btn btn-outline flyer-action-btn download-btn">
            <ArrowDownloadRegular fontSize={20} />
            Download Flyer Image
          </a>
        </div>
      </div>

      {/* Sitemap */}
      <div className="flyer-section">
        <h2 className="flyer-section-title">App Sitemap — Where to Find Everything</h2>
        <div className="flyer-sitemap-grid">
          {sitemap.map((s, i) => (
            <a key={i} href={s.path} className="flyer-sitemap-item">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="flyer-creator">
        <span>Built with ❤️ by</span>
        <strong>WhiteArts Technologies</strong>
      </div>
      <style>{`
        .flyer-page {
          max-width: 800px; margin: 0 auto; padding: 1.5rem 1.25rem 5rem;
          font-family: var(--font-body); color: var(--text);
        }

        /* Hero */
        .flyer-hero {
          text-align: center; padding: 3rem 1.5rem;
          background: linear-gradient(135deg, rgba(200,150,62,0.1), rgba(26,26,46,0.95));
          border-radius: 24px; margin-bottom: 2rem;
          border: 1px solid rgba(200,150,62,0.15);
        }
        .flyer-hero-logo { height: 64px; margin-bottom: 1rem; }
        .flyer-hero-title {
          font-family: var(--font-head); font-size: 2.5rem; font-weight: 800;
          letter-spacing: 0.1em; color: var(--primary); margin: 0 0 0.5rem;
        }
        .flyer-hero-tagline {
          font-size: 1.1rem; color: var(--text-secondary); margin: 0 0 1.25rem;
        }
        .flyer-hero-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        .flyer-badge {
          padding: 0.35rem 0.85rem; border-radius: 100px; font-size: 0.75rem;
          font-weight: 600; background: rgba(200,150,62,0.12); color: var(--primary);
          border: 1px solid rgba(200,150,62,0.2);
        }

        /* Sections */
        .flyer-section { margin-bottom: 2rem; }
        .flyer-section-title {
          font-family: var(--font-head); font-size: 1.3rem; font-weight: 700;
          text-align: center; margin-bottom: 1.25rem; color: var(--text);
        }

        /* Feature Grid */
        .flyer-feature-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        .flyer-feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem; transition: transform 0.2s, box-shadow 0.2s;
        }
        .flyer-feature-card:hover {
          transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .flyer-feature-icon { font-size: 1.8rem; display: block; margin-bottom: 0.5rem; }
        .flyer-feature-card h3 {
          font-family: var(--font-head); font-size: 0.95rem; font-weight: 700;
          margin: 0 0 0.35rem; color: var(--text);
        }
        .flyer-feature-card p {
          font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0;
        }

        /* CTA Section */
        .flyer-cta-section {
          display: grid; grid-template-columns: auto 1fr; gap: 2rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 2rem; margin-bottom: 2rem;
          align-items: center;
        }
        @media (max-width: 600px) {
          .flyer-cta-section { grid-template-columns: 1fr; text-align: center; }
        }
        .flyer-qr-block { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .flyer-qr-img {
          width: 140px; height: 140px; border-radius: 12px;
          border: 3px solid var(--primary); padding: 6px; background: #fff;
        }
        .flyer-qr-label { text-align: center; }
        .flyer-qr-label strong {
          display: block; font-family: var(--font-head); font-size: 0.8rem;
          letter-spacing: 0.05em; color: var(--text);
        }
        .flyer-qr-label span { font-size: 0.8rem; color: var(--primary); font-weight: 600; }

        .flyer-share-actions h2 {
          font-family: var(--font-head); font-size: 1.2rem; margin: 0 0 0.5rem;
        }
        .flyer-share-caption {
          font-size: 0.82rem; color: var(--text-secondary); line-height: 1.55;
          background: var(--bg-alt); padding: 0.85rem; border-radius: 10px;
          border: 1px solid var(--border); margin-bottom: 1rem;
        }
        .flyer-action-btn {
          width: 100%; margin-bottom: 0.6rem; text-transform: none;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .download-btn { margin-bottom: 0; }

        /* Sitemap */
        .flyer-sitemap-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.6rem;
        }
        .flyer-sitemap-item {
          display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; text-decoration: none; color: var(--text);
          font-size: 0.85rem; font-weight: 500; transition: all 0.2s;
        }
        .flyer-sitemap-item:hover {
          border-color: var(--primary); color: var(--primary);
          background: rgba(200,150,62,0.06);
        }

        /* Creator */
        .flyer-creator {
          text-align: center; padding: 2rem 0 1rem; font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .flyer-creator strong {
          display: block; color: var(--primary); font-size: 0.85rem; margin-top: 0.2rem;
        }
      `}</style>
    </div>
  )
}
