import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, getCurrentLeague } from '../engine/xp.js'
import { signOut, isAdmin } from '../lib/supabase.js'
import { getUnreadCount, subscribeToNotifications } from '../lib/push.js'

import {
  HomeRegular, CompassNorthwestRegular, PlayCircleRegular,
  TicketDiagonalRegular, AlertRegular,
  WeatherSunnyRegular, WeatherMoonRegular,
  SettingsRegular, MapRegular, HeartRegular, StoreMicrosoftRegular,
  GiftRegular, PersonRegular, TrophyRegular, SignOutRegular,
  PeopleRegular, NavigationRegular, DismissRegular,
  WrenchRegular, StarRegular, DataBarVerticalRegular,
} from '@fluentui/react-icons'

/** Generate a consistent gradient from a string (username) */
function nameGradient(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1},70%,55%), hsl(${h2},80%,45%))`
}

/** Get first letter of name, uppercase */
function initial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

/** Profile image or first-letter fallback */
function ProfileImg({ profile, size = 36, className = '' }) {
  const url = profile?.avatar_url
  const isImage = url && url.startsWith('http')
  const name = profile?.username || profile?.full_name || profile?.email || '?'
  if (isImage) {
    return <img src={url} alt="" className={`pi-img ${className}`} style={{ width: size, height: size }} />
  }
  return (
    <div className={`pi-initial ${className}`} style={{ width: size, height: size, background: nameGradient(name) }}>
      {initial(name)}
    </div>
  )
}

const MENU_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <DataBarVerticalRegular />, section: 'main' },
  { to: '/dashboard', label: 'Profile & Settings', icon: <PersonRegular />, hash: 'profile', section: 'main' },
  { to: '/dashboard', label: 'Game Journey', icon: <MapRegular />, hash: 'journey', section: 'main' },
  { to: '/dashboard', label: 'Saved Places', icon: <HeartRegular />, hash: 'saved', section: 'main' },
  { to: '/list-your-business', label: 'Become a Seller', icon: <StoreMicrosoftRegular />, section: 'discover' },
  { to: '/discovery', label: 'Discovery', icon: <CompassNorthwestRegular />, section: 'discover' },
  { to: '/deals', label: 'Deals', icon: <GiftRegular />, section: 'discover' },
  { to: '/handymen', label: 'Handymen & Artisans', icon: <WrenchRegular />, section: 'discover' },
  { to: '/community', label: 'Community', icon: <PeopleRegular />, section: 'discover' },
  { to: '/leaderboard', label: 'Leaderboard', icon: <TrophyRegular />, section: 'discover' },
  { to: '/rewards', label: 'Rewards', icon: <StarRegular />, section: 'discover' },
]

export default function Header({ theme, toggleTheme, session, profile, unreadNotifs = 0 }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [localUnread, setLocalUnread] = useState(unreadNotifs)
  const drawerRef = useRef(null)

  const xp = getXPData()
  const displayXP = profile ? profile.total_xp : xp.totalXP
  const level = getLevel(displayXP)
  const progress = getLevelProgress(displayXP)
  const title = getLevelTitle(level)
  const admin = isAdmin(profile)
  const streak = profile?.streak_days || xp.streakDays || 0

  // Fetch unread count on mount
  useEffect(() => {
    if (session?.user?.id) {
      getUnreadCount().then(c => setLocalUnread(c))
    }
  }, [session?.user?.id, pathname])

  // Real-time notification subscription
  useEffect(() => {
    if (!session?.user?.id) return
    const channel = subscribeToNotifications(session.user.id, () => {
      setLocalUnread(prev => prev + 1)
    })
    return () => { if (channel) channel.unsubscribe() }
  }, [session?.user?.id])

  // Sync prop
  useEffect(() => { setLocalUnread(unreadNotifs) }, [unreadNotifs])

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close drawer on ESC
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [menuOpen])

  function handleMenuNav(item) {
    setMenuOpen(false)
    if (item.hash) {
      navigate(item.to)
      // Set active tab after navigation via custom event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboard-tab', { detail: item.hash }))
      }, 100)
    } else {
      navigate(item.to)
    }
  }

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const displayName = profile?.username || profile?.full_name || 'Explorer'

  return (
    <>
      {/* ═══ TOP HEADER ═══ */}
      <header className="header">
        {/* Left: Logo always */}
        <Link to="/" className="header-logo">
          <img src="/wanda-logo.png" alt="Wanda" className="header-logo-img" />
        </Link>

        {/* Desktop nav links */}
        <nav className="header-nav desktop-nav">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/explore" className={pathname.startsWith('/explore') ? 'active' : ''}>Explore</Link>
          <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Games</Link>
          <Link to="/pass" className={pathname === '/pass' ? 'active' : ''}>Pass</Link>
          <Link to="/deals" className={pathname === '/deals' ? 'active' : ''}>Deals</Link>
          <Link to="/list-your-business" className={pathname === '/list-your-business' ? 'active' : ''}>List Business</Link>
          {admin && <Link to="/admin" className={pathname === '/admin' ? 'active' : ''} style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SettingsRegular fontSize={16} /> CMS</Link>}
        </nav>

        {/* Right: Menu button only */}
        <div className="header-right">
          {session ? (
            <button className="header-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <NavigationRegular fontSize={22} />
            </button>
          ) : (
            <Link to="/auth" className="header-signin">Sign In</Link>
          )}
        </div>
      </header>

      {/* ═══ SLIDE-OUT MENU DRAWER ═══ */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
      <div className={`menu-drawer ${menuOpen ? 'open' : ''}`} ref={drawerRef}>
        <button className="menu-close" onClick={() => setMenuOpen(false)}><DismissRegular fontSize={20} /></button>

        {/* Profile card */}
        <div className="menu-profile" onClick={() => handleMenuNav({ to: '/dashboard' })}>
          <ProfileImg profile={profile} size={48} className="menu-avatar" />
          <div className="menu-profile-info">
            <div className="menu-name">{displayName}</div>
            <div className="menu-meta">
              Level {level} · {streak > 0 ? `🔥 ${streak}-day streak` : title.title}
            </div>
            <div className="menu-xp-bar">
              <div className="menu-xp-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Level + Theme row */}
        <div className="menu-extras">
          <Link to="/dashboard" className="menu-level-badge" onClick={() => setMenuOpen(false)}>
            <span className="menu-level-num">Lv.{level}</span>
            <div className="menu-level-bar"><div className="menu-level-fill" style={{ width: `${progress * 100}%` }} /></div>
            <span className="menu-level-title">{title.emoji} {title.title}</span>
          </Link>
          <button className="menu-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <WeatherSunnyRegular fontSize={18} /> : <WeatherMoonRegular fontSize={18} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="menu-divider" />

        {/* Nav sections */}
        <div className="menu-section">
          {MENU_ITEMS.filter(i => i.section === 'main').map(item => (
            <button key={item.label} className={`menu-item ${pathname === item.to ? 'active' : ''}`} onClick={() => handleMenuNav(item)}>
              <span className="menu-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="menu-divider" />

        <div className="menu-section">
          {MENU_ITEMS.filter(i => i.section === 'discover').map(item => (
            <button key={item.label} className={`menu-item ${pathname === item.to ? 'active' : ''}`} onClick={() => handleMenuNav(item)}>
              <span className="menu-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {admin && (
          <>
            <div className="menu-divider" />
            <div className="menu-section">
              <button className={`menu-item ${pathname === '/admin' ? 'active' : ''}`} onClick={() => handleMenuNav({ to: '/admin' })}>
                <span className="menu-item-icon"><SettingsRegular /></span>
                CMS Admin
              </button>
            </div>
          </>
        )}

        <div className="menu-divider" />
        <div className="menu-section">
          <button className="menu-item menu-signout" onClick={handleSignOut}>
            <span className="menu-item-icon"><SignOutRegular /></span>
            Sign Out
          </button>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM TAB BAR — 5 flat tabs ═══ */}
      <nav className="mobile-tab-bar">
        <Link to="/" className={`tab-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="tab-icon"><HomeRegular fontSize={22} /></span>
          <span className="tab-label">Home</span>
        </Link>
        <Link to="/explore" className={`tab-item ${pathname.startsWith('/explore') ? 'active' : ''}`}>
          <span className="tab-icon"><CompassNorthwestRegular fontSize={22} /></span>
          <span className="tab-label">Explore</span>
        </Link>
        <Link to="/play" className={`tab-item ${pathname === '/play' ? 'active' : ''}`}>
          <span className="tab-icon"><PlayCircleRegular fontSize={22} /></span>
          <span className="tab-label">Games</span>
        </Link>
        <Link to="/pass" className={`tab-item ${pathname === '/pass' ? 'active' : ''}`}>
          <span className="tab-icon"><TicketDiagonalRegular fontSize={22} /></span>
          <span className="tab-label">Pass</span>
        </Link>
        <Link to="/notifications" className={`tab-item ${pathname === '/notifications' ? 'active' : ''}`}>
          <span className="tab-icon tab-notif-wrap">
            <AlertRegular fontSize={22} />
            {localUnread > 0 && <span className="tab-notif-badge">{localUnread > 9 ? '9+' : localUnread}</span>}
          </span>
          <span className="tab-label">Alerts</span>
        </Link>
      </nav>
    </>
  )
}

// Export ProfileImg for reuse
export { ProfileImg, nameGradient, initial }
