import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague,
  DAILY_REWARDS, getRewardsData, claimDailyReward, canClaimToday,
} from '../engine/xp.js'
import {
  signOut, updateProfile, uploadProfileImage, uploadBusinessFile, getFavorites,
  toggleFavorite, supabase
} from '../lib/supabase.js'
import { getExplorationPercent, getCheckIns } from '../engine/exploration.js'
import {
  EditRegular, FireRegular, GamesRegular, TargetRegular, LocationRegular,
  MapRegular, TrophyRegular, CloudRegular, GiftRegular, CheckmarkCircleRegular,
  WeatherSnowflakeRegular, CompassNorthwestRegular, BookRegular, EarthRegular,
  PersonRegular, SettingsRegular, HeartRegular, StoreMicrosoftRegular,
  SignOutRegular, ChevronRightRegular, CameraRegular, DismissRegular,
  NavigationRegular, SaveRegular, ImageRegular, ArrowLeftRegular,
  ShieldCheckmarkRegular, StarRegular, DeleteRegular
} from '@fluentui/react-icons'

const AVATARS = [
  '🎭','🗿','👑','🐚','⚡','🔱','🛡️','🦅','🌀','🌍','🪘','🏺','🌴','🔥','🐆','🐘',
  '🧭','🗺️','🏆','💎','🚀','⭐','🎯','🌟','🏅','🎮',
  '🦁','🐊','🦈','🐉','🌙','🛰️','🎓','🎲','🧩','🎪','🐺','🦊','🐯','🌊',
]

const JOURNEY_STOPS = [
  { level: 1,  name: 'Tafawa Balewa Sq.', color: '#00ff88' },
  { level: 2,  name: 'Third Mainland',    color: '#00d4ff' },
  { level: 3,  name: 'Lekki Toll Gate',   color: '#ff6b35' },
  { level: 4,  name: 'National Theatre',  color: '#a855f7' },
  { level: 5,  name: 'Eko Atlantic',      color: '#00ffd5' },
  { level: 6,  name: 'Badagry Heritage',  color: '#ff3366' },
  { level: 7,  name: 'Ikoyi Club',        color: '#fbbf24' },
  { level: 8,  name: 'Computer Village',  color: '#34d399' },
  { level: 9,  name: 'Makoko',            color: '#60a5fa' },
  { level: 10, name: 'Victoria Island',   color: '#f472b6' },
  { level: 12, name: 'Apapa Wharf',       color: '#a78bfa' },
  { level: 14, name: 'Obalende',          color: '#fb923c' },
  { level: 16, name: 'Ikeja Mall',        color: '#818cf8' },
  { level: 18, name: 'Ajah',              color: '#22d3ee' },
  { level: 20, name: 'Lagos Island',      color: '#facc15' },
  { level: 23, name: 'Banana Island',     color: '#4ade80' },
  { level: 26, name: 'Elegushi Beach',    color: '#38bdf8' },
  { level: 30, name: 'Aso Rock',          color: '#f97316' },
  { level: 35, name: 'Zuma Rock',         color: '#a3e635' },
  { level: 40, name: 'Cross River NP',    color: '#2dd4bf' },
  { level: 45, name: 'Yankari Reserve',   color: '#e879f9' },
  { level: 50, name: 'Grandmaster',       color: '#fbbf24' },
]

const SIDEBAR_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: <EarthRegular /> },
  { id: 'profile', label: 'Profile & Settings', icon: <PersonRegular /> },
  { id: 'journey', label: 'Game Journey', icon: <MapRegular /> },
  { id: 'saved', label: 'Saved Places', icon: <HeartRegular /> },
  { id: 'seller', label: 'Become a Seller', icon: <StoreMicrosoftRegular /> },
  { id: 'account', label: 'Account', icon: <SettingsRegular /> },
]

const CATEGORIES = [
  'restaurants', 'nightlife', 'hotels', 'attractions', 'culture', 'beaches',
  'shopping', 'fitness', 'parks', 'art', 'coworking', 'events'
]

const AREAS = [
  'Victoria Island', 'Lekki', 'Ikoyi', 'Lagos Island', 'Yaba',
  'Ikeja', 'Ajah', 'Surulere', 'Mainland', 'Banana Island'
]

// ─── MAIN DASHBOARD ───────────────────────────────────────
export default function Dashboard({ session: sessionProp, profile: profileProp }) {
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profile, setProfile] = useState(profileProp)
  const [session, setSession] = useState(sessionProp)
  const [loading, setLoading] = useState(!sessionProp)

  // Independently check session from Supabase (don't just rely on prop)
  useEffect(() => {
    if (sessionProp) {
      setSession(sessionProp)
      setLoading(false)
      return
    }
    if (!supabase) { setLoading(false); return }
    
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s)
        // Also fetch profile
        supabase.from('profiles').select('*').eq('id', s.user.id).single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        supabase.from('profiles').select('*').eq('id', s.user.id).single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
    })
    return () => subscription.unsubscribe()
  }, [sessionProp])

  useEffect(() => { if (profileProp) setProfile(profileProp) }, [profileProp])

  // PWA: When user returns from browser (after OAuth), re-check session
  useEffect(() => {
    if (!supabase) return
    function handleResume() {
      if (document.visibilityState !== 'visible') return
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s && !session) {
          console.log('[Dashboard] Session found on resume')
          setSession(s)
          setLoading(false)
          supabase.from('profiles').select('*').eq('id', s.user.id).single()
            .then(({ data }) => { if (data) setProfile(data) })
        }
      })
    }
    document.addEventListener('visibilitychange', handleResume)
    window.addEventListener('focus', handleResume)
    return () => {
      document.removeEventListener('visibilitychange', handleResume)
      window.removeEventListener('focus', handleResume)
    }
  }, [session])

  // Redirect to auth if loading is done and no session
  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true })
    }
  }, [loading, session, navigate])

  if (loading) {
    return (
      <div className="user-layout" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧭</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="user-layout" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Redirecting to login...</p>
      </div>
    )
  }

  const xp = getXPData()
  const displayXP = profile ? (profile.total_xp || 0) : xp.totalXP
  const displayLevel = getLevel(displayXP)
  const displayTitle = getLevelTitle(displayLevel)
  const displayPlayerName = profile ? (profile.username || profile.full_name || session.user?.email?.split('@')[0] || 'Explorer') : 'Explorer'
  const displayAvatar = profile ? (profile.avatar_url || '🧭') : '🧭'
  const league = getCurrentLeague(displayXP)
  const isImageAvatar = displayAvatar && displayAvatar.startsWith('http')

  function handleNav(id) {
    setActive(id)
    setDrawerOpen(false)
  }

  function refreshProfile() {
    if (supabase && session?.user?.id) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    }
  }

  return (
    <div className="user-layout">
      {/* Mobile drawer overlay */}
      {drawerOpen && <div className="user-drawer-overlay" onClick={() => setDrawerOpen(false)} />}

      {/* Sidebar */}
      <aside className={`user-sidebar ${drawerOpen ? 'open' : ''}`}>
        {/* Profile mini card */}
        <div className="user-sidebar-profile" onClick={() => handleNav('profile')}>
          <div className="user-sidebar-avatar">
            {isImageAvatar
              ? <img src={displayAvatar} alt="Avatar" />
              : <span>{displayAvatar}</span>
            }
          </div>
          <div className="user-sidebar-info">
            <div className="user-sidebar-name">{displayPlayerName}</div>
            <div className="user-sidebar-level" style={{ color: league.color }}>
              {league.emoji} Lv.{displayLevel} · {displayTitle.title}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="user-nav">
          {SIDEBAR_SECTIONS.map(s => (
            <button
              key={s.id}
              className={`user-nav-item ${active === s.id ? 'active' : ''}`}
              onClick={() => handleNav(s.id)}
            >
              <span className="user-nav-icon">{s.icon}</span>
              <span className="user-nav-label">{s.label}</span>
              <ChevronRightRegular className="user-nav-arrow" fontSize={14} />
            </button>
          ))}
        </nav>

        {/* Sign out at bottom */}
        <div className="user-sidebar-footer">
          <button className="user-nav-item user-signout-btn" onClick={() => { signOut(); navigate('/') }}>
            <span className="user-nav-icon"><SignOutRegular /></span>
            <span className="user-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="user-main">
        {/* Mobile header */}
        <div className="user-mobile-header">
          <button className="user-menu-btn" onClick={() => setDrawerOpen(true)}>
            <NavigationRegular fontSize={24} />
          </button>
          <h2>{SIDEBAR_SECTIONS.find(s => s.id === active)?.label || 'Dashboard'}</h2>
          <Link to="/" className="user-home-btn">
            <ArrowLeftRegular fontSize={20} />
          </Link>
        </div>

        <div className="user-content">
          {active === 'overview' && <OverviewSection profile={profile} session={session} xp={xp} onNav={handleNav} />}
          {active === 'profile' && <ProfileSection profile={profile} session={session} onRefresh={refreshProfile} />}
          {active === 'journey' && <JourneySection profile={profile} xp={xp} />}
          {active === 'saved' && <SavedSection session={session} />}
          {active === 'seller' && <SellerSection session={session} />}
          {active === 'account' && <AccountSection session={session} profile={profile} />}
        </div>
      </main>
    </div>
  )
}

// ─── OVERVIEW ─────────────────────────────────────────────
function OverviewSection({ profile, session, xp, onNav }) {
  const displayXP = profile ? (profile.total_xp || 0) : xp.totalXP
  const displayLevel = getLevel(displayXP)
  const displayStreak = profile ? (profile.streak_days || 0) : (xp.streakDays || 0)
  const progress = getLevelProgress(displayXP)
  const xpToNext = getXPToNextLevel(displayXP)
  const league = getCurrentLeague(displayXP)
  const exploredPct = getExplorationPercent()
  const checkIns = getCheckIns()
  const [sessions] = useState(() => JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]'))
  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  return (
    <div className="user-section">
      {/* XP Progress */}
      <div className="db-xp-card">
        <div className="db-xp-header">
          <span className="db-xp-label">Level {displayLevel} → {displayLevel + 1}</span>
          <span className="db-xp-value">{displayXP.toLocaleString()} XP</span>
        </div>
        <div className="db-xp-track">
          <div className="db-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="db-xp-footer">
          <span>{Math.round(progress * 100)}% complete</span>
          <span>{xpToNext} XP to next level</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="db-stats-grid">
        <div className="db-stat-card"><span className="db-stat-icon"><FireRegular /></span><span className="db-stat-val">{displayStreak}</span><span className="db-stat-lbl">Day Streak</span></div>
        <div className="db-stat-card"><span className="db-stat-icon"><GamesRegular /></span><span className="db-stat-val">{totalGames}</span><span className="db-stat-lbl">Games Played</span></div>
        <div className="db-stat-card"><span className="db-stat-icon"><TargetRegular /></span><span className="db-stat-val">{avgPct}%</span><span className="db-stat-lbl">Avg Score</span></div>
        <div className="db-stat-card"><span className="db-stat-icon"><LocationRegular /></span><span className="db-stat-val">{checkIns.length}</span><span className="db-stat-lbl">Check-ins</span></div>
        <div className="db-stat-card"><span className="db-stat-icon"><MapRegular /></span><span className="db-stat-val">{exploredPct}%</span><span className="db-stat-lbl">Explored</span></div>
        <div className="db-stat-card"><span className="db-stat-icon"><TrophyRegular /></span><span className="db-stat-val">{league.emoji}</span><span className="db-stat-lbl">{league.name}</span></div>
      </div>

      {/* Quick Actions */}
      <div className="user-quick-actions">
        <h3>Quick Actions</h3>
        <div className="user-actions-grid">
          <Link to="/play" className="user-action-card"><GamesRegular fontSize={24} /><span>Play Now</span></Link>
          <Link to="/explore" className="user-action-card"><CompassNorthwestRegular fontSize={24} /><span>Explore</span></Link>
          <Link to="/deals" className="user-action-card"><GiftRegular fontSize={24} /><span>Deals</span></Link>
          <Link to="/discovery" className="user-action-card"><MapRegular fontSize={24} /><span>Discovery</span></Link>
          <button onClick={() => onNav('saved')} className="user-action-card"><HeartRegular fontSize={24} /><span>Saved</span></button>
          <button onClick={() => onNav('journey')} className="user-action-card"><TrophyRegular fontSize={24} /><span>Journey</span></button>
        </div>
      </div>
    </div>
  )
}

// ─── PROFILE & SETTINGS ──────────────────────────────────
function ProfileSection({ profile, session, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [selectedCats, setSelectedCats] = useState(() => {
    try { return JSON.parse(profile?.preferences || '{}').categories || [] } catch { return [] }
  })
  const [selectedAreas, setSelectedAreas] = useState(() => {
    try { return JSON.parse(profile?.preferences || '{}').areas || [] } catch { return [] }
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  const isImageAvatar = profile?.avatar_url?.startsWith('http')
  const displayAvatar = profile?.avatar_url || '🧭'

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await updateProfile(session.user.id, {
        username: formData.username,
        full_name: formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}`.trim() : formData.full_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
      })
      setToast({ msg: 'Profile updated!', type: 'success' })
      setEditing(false)
      onRefresh()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSaving(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: 'Image must be under 5MB', type: 'error' })
      return
    }
    setUploading(true)
    try {
      await uploadProfileImage(session.user.id, file)
      setToast({ msg: 'Profile picture updated!', type: 'success' })
      setShowAvatarPicker(false)
      onRefresh()
    } catch (e) {
      setToast({ msg: 'Upload failed: ' + e.message, type: 'error' })
    }
    setUploading(false)
  }

  async function pickEmoji(emoji) {
    try {
      await updateProfile(session.user.id, { avatar_url: emoji })
      localStorage.setItem('geoquiz_avatar', emoji)
      setShowAvatarPicker(false)
      onRefresh()
      setToast({ msg: 'Avatar updated!', type: 'success' })
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  async function savePreferences() {
    setSavingPrefs(true)
    try {
      const preferences = JSON.stringify({ categories: selectedCats, areas: selectedAreas })
      await updateProfile(session.user.id, { preferences })
      setToast({ msg: 'Preferences saved!', type: 'success' })
      onRefresh()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSavingPrefs(false)
  }

  return (
    <div className="user-section">
      <div className="user-profile-card">
        <div className="user-avatar-large" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          {isImageAvatar
            ? <img src={displayAvatar} alt="Avatar" />
            : <span className="user-avatar-emoji">{displayAvatar}</span>
          }
          <div className="user-avatar-edit-badge"><CameraRegular fontSize={16} /></div>
        </div>
        <div className="user-profile-name-area">
          {editing ? (
            <div className="user-edit-form">
              <div className="user-edit-field">
                <label>Username</label>
                <input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} maxLength={20} placeholder="Your display name" />
              </div>
              <div className="user-edit-row">
                <div className="user-edit-field">
                  <label>First Name</label>
                  <input value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
                </div>
                <div className="user-edit-field">
                  <label>Last Name</label>
                  <input value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
                </div>
              </div>
              <div className="user-edit-field">
                <label>Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+234..." />
              </div>
              <div className="user-edit-field">
                <label>Location</label>
                <input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="City, State" />
              </div>
              <div className="user-edit-field">
                <label>Bio</label>
                <textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={3} maxLength={200} />
              </div>
              <div className="user-edit-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h2>{profile?.username || session.user?.email?.split('@')[0] || 'Explorer'}</h2>
              {profile?.full_name && <p className="user-profile-fullname">{profile.full_name}</p>}
              <p className="user-profile-email">{session.user.email}</p>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditing(true); setFormData({ username: profile?.username || '', full_name: profile?.full_name || '', first_name: profile?.first_name || '', last_name: profile?.last_name || '', phone: profile?.phone || '', bio: profile?.bio || '', location: profile?.location || '' }) }}>
                <EditRegular fontSize={14} /> Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {showAvatarPicker && (
        <div className="user-avatar-picker-card">
          <div className="user-avatar-picker-header">
            <h3>Choose Avatar</h3>
            <button onClick={() => setShowAvatarPicker(false)}><DismissRegular /></button>
          </div>
          <div className="user-avatar-upload-section">
            <button className="user-upload-photo-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ImageRegular fontSize={20} />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <p className="user-upload-hint">JPG, PNG or WebP, max 5MB</p>
          </div>
          <div className="user-avatar-divider"><span>or pick an emoji</span></div>
          <div className="user-emoji-grid">
            {AVATARS.map(a => (
              <button key={a} className={`user-emoji-opt ${a === displayAvatar ? 'selected' : ''}`} onClick={() => pickEmoji(a)}>{a}</button>
            ))}
          </div>
        </div>
      )}

      <div className="user-prefs-card">
        <h3><StarRegular fontSize={18} /> Your Preferences</h3>
        <p className="user-prefs-subtitle">Help us personalize your experience</p>
        <div className="user-prefs-section">
          <h4>Favorite Categories</h4>
          <div className="user-prefs-chips">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`user-pref-chip ${selectedCats.includes(cat) ? 'active' : ''}`} onClick={() => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="user-prefs-section">
          <h4>Preferred Areas</h4>
          <div className="user-prefs-chips">
            {AREAS.map(area => (
              <button key={area} className={`user-pref-chip ${selectedAreas.includes(area) ? 'active' : ''}`} onClick={() => setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}>
                {area}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={savePreferences} disabled={savingPrefs} style={{ marginTop: '1rem' }}>
          <SaveRegular fontSize={16} /> {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ─── GAME JOURNEY ─────────────────────────────────────────
function JourneySection({ profile, xp }) {
  const displayXP = profile ? (profile.total_xp || 0) : xp.totalXP
  const displayLevel = getLevel(displayXP)
  const displayAvatar = profile?.avatar_url || localStorage.getItem('geoquiz_avatar') || '🧭'
  const exploredPct = getExplorationPercent()
  const checkIns = getCheckIns()

  const [rewards, setRewards] = useState(getRewardsData)
  const [canClaim, setCanClaim] = useState(canClaimToday)
  const [claimResult, setClaimResult] = useState(null)

  function handleClaim() {
    const result = claimDailyReward()
    if (!result.alreadyClaimed) {
      setClaimResult(result)
      setCanClaim(false)
      setRewards(getRewardsData())
    }
  }

  const currentStopIdx = JOURNEY_STOPS.reduce((acc, stop, i) => (displayLevel >= stop.level ? i : acc), 0)
  const nextStop = JOURNEY_STOPS[currentStopIdx + 1] || null

  return (
    <div className="user-section">
      <div className="user-journey-card">
        <h3><FireRegular fontSize={18} style={{ color: '#f97316' }} /> Streak & Daily Rewards</h3>
        <div className="db-streak-banner">
          <div className="db-streak-fire">
            <span style={{ color: '#f97316' }}><FireRegular fontSize={40} /></span>
            <div>
              <div className="db-streak-count">{xp.streakDays || 0}</div>
              <div className="db-streak-label">Day Streak</div>
            </div>
          </div>
          {xp.streakFreezes > 0 && (
            <div className="db-streak-freeze"><WeatherSnowflakeRegular /> {xp.streakFreezes} freeze{xp.streakFreezes > 1 ? 's' : ''} left</div>
          )}
        </div>
        <div className="rw-calendar db-cal">
          {DAILY_REWARDS.map((r, i) => {
            const dayNum = i + 1
            const claimed = rewards.claimedDays?.includes(dayNum)
            const isNext = !claimed && dayNum === (rewards.currentDay || 0) + 1
            return (
              <div key={i} className={`rw-day ${claimed ? 'claimed' : ''} ${isNext && canClaim ? 'today' : ''} ${isNext ? 'next' : ''}`}>
                <div className="rw-day-num">Day {dayNum}</div>
                <div className="rw-day-emoji">{r.emoji}</div>
                <div className="rw-day-label">{r.label}</div>
                {claimed && <div className="rw-day-check">✓</div>}
              </div>
            )
          })}
        </div>
        {canClaim ? (
          <button className="rw-claim-btn db-claim-btn" onClick={handleClaim}>Claim Today's Reward <GiftRegular fontSize={18} /></button>
        ) : (
          <div className="rw-claimed-msg">
            {claimResult ? (
              <div className="rw-claim-result">
                <span className="rw-claim-emoji">{claimResult.reward.emoji}</span>
                <span>{claimResult.reward.label} claimed!</span>
                {claimResult.xpAwarded > 0 && <span className="rw-claim-xp">+{claimResult.xpAwarded} XP</span>}
              </div>
            ) : (
              <p><CheckmarkCircleRegular style={{ color: 'var(--green)', verticalAlign: 'middle' }} /> Today's reward claimed!</p>
            )}
          </div>
        )}
      </div>

      {exploredPct > 0 && (
        <div className="db-explore-bar-wrap">
          <div className="db-explore-label">
            <span><EarthRegular style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Lagos Exploration</span>
            <span className="db-explore-pct">{exploredPct}%</span>
          </div>
          <div className="db-explore-track">
            <div className="db-explore-fill" style={{ width: `${exploredPct}%` }} />
          </div>
        </div>
      )}

      <div className="user-journey-card">
        <div className="db-path-header">
          <div><h3 className="db-path-title">Exploration Path</h3><p className="db-path-subtitle">Your journey across Lagos</p></div>
          <div className="db-path-count">{currentStopIdx + 1} / {JOURNEY_STOPS.length}</div>
        </div>
        <div className="db-path-stepper">
          {JOURNEY_STOPS.map((stop, idx) => {
            const reached = displayLevel >= stop.level
            const isCurrent = idx === currentStopIdx
            return (
              <div key={idx} className={`db-path-step ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="db-path-marker">{stop.level}</div>
                <div className="db-path-content">
                  <div className="db-path-name">{stop.name}</div>
                  <div className="db-path-meta">
                    {reached ? <span style={{ color: 'var(--green)' }}>✓ Explored</span> : <span>🔒 Locked</span>}
                    {isCurrent && <span className="db-path-xp-tag">Next: {nextStop ? nextStop.name : 'Max!'}</span>}
                  </div>
                </div>
                {isCurrent && <div className="db-path-avatar">{displayAvatar.startsWith('http') ? '📍' : displayAvatar}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {checkIns.length > 0 && (
        <div className="user-journey-card">
          <h3><LocationRegular style={{ color: 'var(--primary)' }} /> Recent Check-ins</h3>
          <div className="db-checkin-list">
            {checkIns.slice(-8).reverse().map((c, i) => (
              <div key={i} className="db-checkin-row">
                <span className="db-checkin-name">{c.name}</span>
                <span className="db-checkin-area">{c.area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="user-journey-actions">
        <Link to="/achievements" className="btn btn-outline">🏆 Achievements</Link>
        <Link to="/leaderboard" className="btn btn-outline">📊 Leaderboard</Link>
        <Link to="/rewards" className="btn btn-outline">🎁 Full Rewards</Link>
      </div>
    </div>
  )
}

// ─── SAVED PLACES ────────────────────────────────────────
function SavedSection({ session }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFavorites() }, [])

  async function loadFavorites() {
    setLoading(true)
    try {
      const data = await getFavorites(session?.user?.id)
      setFavorites(data)
    } catch (e) { console.warn('Could not load favorites:', e.message) }
    setLoading(false)
  }

  async function removeFavorite(listingId) {
    try {
      await toggleFavorite(session?.user?.id, listingId)
      loadFavorites()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="user-section">
      <div className="user-saved-header">
        <h3><HeartRegular fontSize={20} /> Your Saved Places</h3>
        <p className="user-saved-subtitle">Places you've saved from Explore. Tap the heart on any listing to save it here.</p>
      </div>
      {loading ? (
        <div className="user-empty-state"><p>Loading...</p></div>
      ) : favorites.length === 0 ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">💫</div>
          <h3>No saved places yet</h3>
          <p>Browse listings and tap the ❤️ to save your favorites here.</p>
          <Link to="/explore" className="btn btn-primary">Explore Lagos</Link>
        </div>
      ) : (
        <div className="user-saved-grid">
          {favorites.map(fav => (
            <div key={fav.listing_id || fav.id} className="user-saved-card">
              <div className="user-saved-img">
                {fav.listing_photo
                  ? <img src={fav.listing_photo} alt={fav.listing_name} onError={e => { e.target.style.display = 'none' }} />
                  : <div className="user-saved-placeholder">📍</div>
                }
              </div>
              <div className="user-saved-info">
                <h4>{fav.listing_name || fav.listing_id}</h4>
                <p>{fav.listing_area && `📍 ${fav.listing_area}`} {fav.listing_category && `· ${fav.listing_category}`}</p>
              </div>
              <div className="user-saved-actions">
                <Link to={`/explore/${fav.listing_id}`} className="btn btn-sm btn-primary">View</Link>
                <button className="btn btn-sm btn-outline" onClick={() => removeFavorite(fav.listing_id)}><DeleteRegular fontSize={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BECOME A SELLER ─────────────────────────────────────
function SellerSection({ session }) {
  const [step, setStep] = useState('onboarding')
  const [form, setForm] = useState({ name: '', category: '', subcategory: '', area: '', address: '', phone: '', whatsapp: '', website: '', instagram: '', hours: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')
  const CATS = ['restaurant','hotel','attraction','nightlife','park','culture','experience','shopping','event','heritage','market','beach','art']
  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  // Logo state
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const logoInputRef = useRef(null)

  // Photos state (up to 5)
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const photoInputRef = useRef(null)

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }
  function removeLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }
  function handlePhotosSelect(e) {
    const files = Array.from(e.target.files || [])
    if (photoFiles.length + files.length > 5) { setError('Maximum 5 photos allowed'); return }
    const valid = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { setError('Each photo must be under 5MB'); return false }
      if (!f.type.startsWith('image/')) { setError('Only image files allowed'); return false }
      return true
    })
    setPhotoFiles(prev => [...prev, ...valid])
    setPhotoPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
    setError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }
  function removePhoto(idx) {
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setUploadProgress('')
    try {
      let logoUrl = ''
      let photoUrls = []

      if (logoFile) {
        setUploadProgress('Uploading logo...')
        try { logoUrl = await uploadBusinessFile(logoFile, 'logo') } catch (ue) { console.warn('Logo upload failed:', ue.message) }
      }
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          setUploadProgress(`Uploading photo ${i + 1} of ${photoFiles.length}...`)
          try { photoUrls.push(await uploadBusinessFile(photoFiles[i], 'photo')) } catch (ue) { console.warn(`Photo ${i+1} upload failed:`, ue.message) }
        }
      }

      setUploadProgress('Submitting listing...')
      const { error: err } = await supabase.from('business_listings').insert([{
        ...form,
        logo_url: logoUrl || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending',
        submitted_by: session?.user?.id
      }])
      if (err) throw err
      setStep('submitted')
    } catch (e) {
      console.error('Listing submission error:', e)
      setError(e.message || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
    setUploadProgress('')
  }

  function resetForm() {
    setForm({ name: '', category: '', subcategory: '', area: '', address: '', phone: '', whatsapp: '', website: '', instagram: '', hours: '', description: '' })
    removeLogo()
    setPhotoFiles([])
    setPhotoPreviews([])
  }

  if (step === 'onboarding') {
    return (
      <div className="user-section">
        <div className="seller-onboarding">
          <div className="seller-hero-card">
            <div className="seller-hero-emoji">🏪</div>
            <h2>List Your Business on Wanda</h2>
            <p>Reach thousands of explorers discovering Lagos every day.</p>
          </div>
          <div className="seller-benefits-grid">
            <div className="seller-benefit"><div className="seller-benefit-icon">📍</div><h4>Get Discovered</h4><p>Your business appears on our interactive map and Explore feed.</p></div>
            <div className="seller-benefit"><div className="seller-benefit-icon">🎯</div><h4>Targeted Audience</h4><p>Connect with users actively looking for experiences in your area.</p></div>
            <div className="seller-benefit"><div className="seller-benefit-icon">🤝</div><h4>Deals & Partnerships</h4><p>Run exclusive deals and gamified promotions to drive foot traffic.</p></div>
            <div className="seller-benefit"><div className="seller-benefit-icon">📊</div><h4>Free to Start</h4><p>List your business for free during our early access period.</p></div>
          </div>
          <div className="seller-steps-card">
            <h3>How it Works</h3>
            <div className="seller-steps">
              <div className="seller-step"><span className="seller-step-num">1</span><div><strong>Submit your listing</strong><p>Fill out your business details and upload photos.</p></div></div>
              <div className="seller-step"><span className="seller-step-num">2</span><div><strong>We review & approve</strong><p>Our team reviews within 24-48 hours.</p></div></div>
              <div className="seller-step"><span className="seller-step-num">3</span><div><strong>Go live!</strong><p>Once approved, your listing appears instantly.</p></div></div>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setStep('form')} style={{ width: '100%', marginTop: '1.5rem' }}>Get Started — List My Business</button>
        </div>
      </div>
    )
  }

  if (step === 'submitted') {
    return (
      <div className="user-section">
        <div className="user-empty-state" style={{ paddingTop: '3rem' }}>
          <div className="user-empty-icon">🎉</div>
          <h3>Listing Submitted!</h3>
          <p>We'll review your submission and get back to you within 24-48 hours.</p>
          <button className="btn btn-outline" onClick={() => { setStep('onboarding'); resetForm() }}>Submit Another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-section">
      <div className="seller-form-header">
        <button className="btn btn-outline btn-sm" onClick={() => setStep('onboarding')}><ArrowLeftRegular fontSize={14} /> Back</button>
        <h3>List Your Business</h3>
      </div>
      {error && <div className="auth-alert auth-alert-error">{error}</div>}
      <form className="seller-form" onSubmit={handleSubmit}>
        <div className="seller-form-grid">
          <div className="seller-field full"><label>Business Name *</label><input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Nok by Alara" /></div>
          <div className="seller-field"><label>Category *</label><select required value={form.category} onChange={e => update('category', e.target.value)}><option value="">Select...</option>{CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></div>
          <div className="seller-field"><label>Subcategory</label><input value={form.subcategory} onChange={e => update('subcategory', e.target.value)} placeholder="e.g. Fine Dining" /></div>
          <div className="seller-field"><label>Area *</label><input required value={form.area} onChange={e => update('area', e.target.value)} placeholder="e.g. Victoria Island" /></div>
          <div className="seller-field"><label>Address</label><input value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Adeola Odeku St" /></div>
          <div className="seller-field"><label>Phone</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+234..." /></div>
          <div className="seller-field"><label>WhatsApp</label><input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="+234..." /></div>
          <div className="seller-field"><label>Website</label><input type="url" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." /></div>
          <div className="seller-field"><label>Instagram</label><input value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@handle" /></div>
          <div className="seller-field"><label>Hours</label><input value={form.hours} onChange={e => update('hours', e.target.value)} placeholder="Mon-Sat: 9am-10pm" /></div>
          <div className="seller-field full"><label>Description</label><textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us about your business..." /></div>
        </div>

        {/* Logo & Photo Upload */}
        <div className="seller-upload-section">
          <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Logo & Photos</h4>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 500 }}>Business Logo</label>
            <div className="lb-upload-zone" onClick={() => !logoPreview && logoInputRef.current?.click()} style={{ padding: '0.75rem', minHeight: 'auto' }}>
              {logoPreview ? (
                <div className="lb-logo-preview">
                  <img src={logoPreview} alt="Logo" />
                  <button type="button" className="lb-remove-btn" onClick={e => { e.stopPropagation(); removeLogo() }}>✕</button>
                </div>
              ) : (
                <div className="lb-upload-placeholder" style={{ padding: '0.5rem' }}>
                  <span className="lb-upload-icon">🏷️</span>
                  <span>Upload logo</span>
                  <span className="lb-upload-hint">JPG, PNG or WebP · Max 5MB</span>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 500 }}>Business Photos <span style={{ opacity: 0.6 }}>(up to 5)</span></label>
            <div className="lb-photos-grid">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="lb-photo-thumb">
                  <img src={preview} alt={`Photo ${i + 1}`} />
                  <button type="button" className="lb-remove-btn" onClick={() => removePhoto(i)}>✕</button>
                </div>
              ))}
              {photoFiles.length < 5 && (
                <div className="lb-photo-add" onClick={() => photoInputRef.current?.click()}>
                  <span className="lb-photo-add-icon">📸</span>
                  <span className="lb-photo-add-label">Add</span>
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotosSelect} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {uploadProgress && (
          <div className="lb-progress">
            <div className="lb-spinner-small" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%', marginTop: '1.5rem' }}>{submitting ? 'Submitting...' : 'Submit Listing for Review'}</button>
      </form>
    </div>
  )
}

// ─── ACCOUNT ─────────────────────────────────────────────
function AccountSection({ session, profile }) {
  const navigate = useNavigate()
  return (
    <div className="user-section">
      <div className="user-account-card">
        <h3><ShieldCheckmarkRegular fontSize={18} /> Account Details</h3>
        <div className="user-account-rows">
          <div className="user-account-row"><span className="user-account-label">Email</span><span className="user-account-value">{session?.user?.email}</span></div>
          <div className="user-account-row"><span className="user-account-label">Role</span><span className="user-account-value">{profile?.role || 'user'}</span></div>
          <div className="user-account-row"><span className="user-account-label">Member Since</span><span className="user-account-value">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>
      <div className="user-account-actions">
        <Link to="/auth?mode=reset" className="btn btn-outline" style={{ width: '100%' }}>Change Password</Link>
        <button className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef444444' }} onClick={() => { signOut(); navigate('/') }}>
          <SignOutRegular fontSize={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}

// ─── TOAST ───────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`user-toast user-toast-${type}`}>
      {type === 'success' ? <CheckmarkCircleRegular style={{ verticalAlign: 'middle' }} /> : '⚠️'} {msg}
    </div>
  )
}
