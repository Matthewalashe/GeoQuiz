import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague,
  DAILY_REWARDS, getRewardsData, claimDailyReward, canClaimToday,
} from '../engine/xp.js'
import {
  signOut, updateProfile, uploadProfileImage, getFavorites,
  toggleFavorite, supabase
} from '../lib/supabase.js'
import { getExplorationPercent, getCheckIns } from '../engine/exploration.js'
import ListBusiness from './ListBusiness.jsx'
import { ProfileImg, nameGradient, initial } from './Header.jsx'
import {
  EditRegular, FireRegular, GamesRegular, TargetRegular, LocationRegular,
  MapRegular, TrophyRegular, CloudRegular, GiftRegular, CheckmarkCircleRegular,
  WeatherSnowflakeRegular, CompassNorthwestRegular, BookRegular, EarthRegular,
  PersonRegular, SettingsRegular, HeartRegular, StoreMicrosoftRegular,
  SignOutRegular, ChevronRightRegular, CameraRegular, DismissRegular,
  NavigationRegular, SaveRegular, ImageRegular, ArrowLeftRegular,
  ShieldCheckmarkRegular, StarRegular, DeleteRegular, CalendarRegular,
  ShareRegular, CopyRegular, PeopleRegular
} from '@fluentui/react-icons'



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
  { id: 'events', label: 'My Events', icon: <CalendarRegular /> },
  { id: 'listings', label: 'My Listings', icon: <StoreMicrosoftRegular /> },
  { id: 'journey', label: 'Game Journey', icon: <MapRegular /> },
  { id: 'saved', label: 'Saved Places', icon: <HeartRegular /> },
  { id: 'seller', label: 'Add New Listing', icon: <EditRegular /> },
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

  // Listen for external tab navigation (from menu drawer)
  useEffect(() => {
    function handleTabSwitch(e) { if (e.detail) setActive(e.detail) }
    window.addEventListener('dashboard-tab', handleTabSwitch)
    return () => window.removeEventListener('dashboard-tab', handleTabSwitch)
  }, [])

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
  const displayAvatar = profile?.avatar_url || null
  const league = getCurrentLeague(displayXP)

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
            <ProfileImg profile={profile} size={40} />
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
          {active === 'listings' && <MyListingsSection session={session} />}
          {active === 'events' && <MyEventsSection session={session} />}
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

  async function pickEmoji() { /* removed — emoji avatars killed */ }

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
          <ProfileImg profile={profile} size={90} />
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
            <h3>Update Profile Photo</h3>
            <button onClick={() => setShowAvatarPicker(false)}><DismissRegular /></button>
          </div>
          <div className="user-avatar-upload-section">
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0 1rem' }}>
              <ProfileImg profile={profile} size={80} />
            </div>
            <button className="user-upload-photo-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ImageRegular fontSize={20} />
              {uploading ? 'Uploading...' : 'Upload New Photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <p className="user-upload-hint">JPG, PNG or WebP, max 5MB</p>
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
  const displayAvatar = profile?.avatar_url || ''
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
                {isCurrent && <div className="db-path-avatar"><ProfileImg profile={profile} size={24} /></div>}
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
function SellerSection() {
  return (
    <div className="user-section">
      <ListBusiness embedded={true} />
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

// ─── MY LISTINGS ─────────────────────────────────────────
function MyListingsSection({ session }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadMyListings() }, [])

  async function loadMyListings() {
    setLoading(true)
    try {
      if (!supabase || !session?.user?.id) return
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('submitted_by', session.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setListings(data || [])
    } catch (e) {
      console.warn('Load my listings:', e.message)
    }
    setLoading(false)
  }

  function startEdit(listing) {
    setEditingId(listing.id)
    setEditForm({
      name: listing.name || '',
      description: listing.description || '',
      phone: listing.phone || '',
      whatsapp: listing.whatsapp || '',
      website: listing.website || '',
      instagram: listing.instagram || '',
      hours: listing.hours || '',
      area: listing.area || '',
      address: listing.address || '',
      trade: listing.trade || '',
      category: listing.category || '',
      subcategory: listing.subcategory || '',
      price_range: listing.price_range || '',
      experience_years: listing.experience_years || '',
      products: (listing.products || []).join(', '),
    })
  }

  async function saveEdit(id) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('business_listings')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          phone: editForm.phone.trim() || null,
          whatsapp: editForm.whatsapp.trim() || null,
          website: editForm.website.trim() || null,
          instagram: editForm.instagram.trim() || null,
          hours: editForm.hours.trim() || null,
          area: editForm.area.trim(),
          address: editForm.address.trim() || null,
          trade: editForm.trade.trim() || null,
          category: editForm.category.trim() || null,
          subcategory: editForm.subcategory.trim() || null,
          price_range: editForm.price_range.trim() || null,
          experience_years: editForm.experience_years ? parseInt(editForm.experience_years) : null,
          products: editForm.products ? editForm.products.split(',').map(s => s.trim()).filter(Boolean) : [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('submitted_by', session.user.id)
      if (error) throw error
      setToast({ msg: 'Listing updated!', type: 'success' })
      setEditingId(null)
      loadMyListings()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSaving(false)
  }

  const statusColors = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' }
  const statusEmoji = { pending: '⏳', approved: '✅', rejected: '❌' }

  return (
    <div className="user-section">
      <div className="user-saved-header">
        <h3><StoreMicrosoftRegular fontSize={20} /> My Business Listings</h3>
        <p className="user-saved-subtitle">Manage your submitted listings. Edit details anytime.</p>
      </div>

      {loading ? (
        <div className="user-empty-state"><p>Loading your listings...</p></div>
      ) : listings.length === 0 ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">🏪</div>
          <h3>No listings yet</h3>
          <p>Submit your business or trade to get discovered by thousands.</p>
          <Link to="/list-your-business/form" className="btn btn-primary">List Your Business</Link>
        </div>
      ) : (
        <div className="my-listings-grid">
          {listings.map(listing => {
            const isEditing = editingId === listing.id
            const photo = listing.logo_url || (Array.isArray(listing.photos) ? listing.photos[0] : null)
            const isHandyman = listing.listing_type === 'handyman'
            return (
              <div key={listing.id} className="my-listing-card">
                <div className="my-listing-header">
                  {photo && (
                    <img src={photo} alt={listing.name} className="my-listing-img"
                      onError={e => { e.target.style.display = 'none' }} />
                  )}
                  {!photo && <div className="my-listing-img-placeholder">{isHandyman ? '🔧' : '🏪'}</div>}
                  <div className="my-listing-meta">
                    <span className="my-listing-status" style={{ color: statusColors[listing.status] || '#888' }}>
                      {statusEmoji[listing.status] || '❓'} {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
                    </span>
                    <span className="my-listing-type">{isHandyman ? '🔧 Handyman' : '🏪 Business'}</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="my-listing-edit-form">
                    <div className="user-edit-field">
                      <label>{isHandyman ? 'Full Name' : 'Business Name'}</label>
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="user-edit-field">
                      <label>Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={500} />
                    </div>
                    {isHandyman && (
                      <>
                        <div className="user-edit-row">
                          <div className="user-edit-field">
                            <label>Trade / Skill</label>
                            <input value={editForm.trade} onChange={e => setEditForm(p => ({ ...p, trade: e.target.value }))} placeholder="e.g. Plumber, Electrician" />
                          </div>
                          <div className="user-edit-field">
                            <label>Years of Experience</label>
                            <input type="number" value={editForm.experience_years} onChange={e => setEditForm(p => ({ ...p, experience_years: e.target.value }))} />
                          </div>
                        </div>
                      </>
                    )}
                    {!isHandyman && (
                      <div className="user-edit-row">
                        <div className="user-edit-field">
                          <label>Category</label>
                          <input value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Restaurant, Hotel" />
                        </div>
                        <div className="user-edit-field">
                          <label>Price Range</label>
                          <input value={editForm.price_range} onChange={e => setEditForm(p => ({ ...p, price_range: e.target.value }))} placeholder="e.g. ₦₦, ₦₦₦" />
                        </div>
                      </div>
                    )}
                    <div className="user-edit-row">
                      <div className="user-edit-field">
                        <label>Phone</label>
                        <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="user-edit-field">
                        <label>WhatsApp</label>
                        <input type="tel" value={editForm.whatsapp} onChange={e => setEditForm(p => ({ ...p, whatsapp: e.target.value }))} />
                      </div>
                    </div>
                    <div className="user-edit-row">
                      <div className="user-edit-field">
                        <label>Website</label>
                        <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
                      </div>
                      <div className="user-edit-field">
                        <label>Instagram</label>
                        <input value={editForm.instagram} onChange={e => setEditForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@handle" />
                      </div>
                    </div>
                    <div className="user-edit-row">
                      <div className="user-edit-field">
                        <label>Area / Location</label>
                        <input value={editForm.area} onChange={e => setEditForm(p => ({ ...p, area: e.target.value }))} />
                      </div>
                      <div className="user-edit-field">
                        <label>Opening Hours</label>
                        <input value={editForm.hours} onChange={e => setEditForm(p => ({ ...p, hours: e.target.value }))} placeholder="e.g. Mon-Sat 9am-6pm" />
                      </div>
                    </div>
                    <div className="user-edit-field">
                      <label>Full Address</label>
                      <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                    </div>
                    {!isHandyman && (
                      <div className="user-edit-field">
                        <label>Products / Services (comma-separated)</label>
                        <input value={editForm.products} onChange={e => setEditForm(p => ({ ...p, products: e.target.value }))} placeholder="e.g. Jollof Rice, Suya, Small Chops" />
                      </div>
                    )}
                    <div className="user-edit-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(listing.id)} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="my-listing-info">
                    <h4 className="my-listing-name">{listing.name}</h4>
                    <p className="my-listing-area">📍 {listing.area}{listing.address ? ` · ${listing.address}` : ''}</p>
                    {listing.trade && <p className="my-listing-trade">🔧 {listing.trade}{listing.experience_years ? ` · ${listing.experience_years}yrs exp` : ''}</p>}
                    {listing.category && <p className="my-listing-trade">📂 {listing.category}</p>}
                    {listing.description && <p className="my-listing-desc">{listing.description}</p>}
                    <div className="my-listing-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(listing)}>
                        <EditRegular fontSize={14} /> Edit
                      </button>
                      <Link to={`/business/${listing.id}`} className="btn btn-sm btn-primary">View Page →</Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link to="/list-your-business/form" className="btn btn-primary">+ Add New Listing</Link>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ─── MY EVENTS ─────────────────────────────────────────
function MyEventsSection({ session }) {
  const navigate = useNavigate()
  const [organized, setOrganized] = useState([])
  const [attending, setAttending] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [viewRsvps, setViewRsvps] = useState(null) // event id
  const [rsvpList, setRsvpList] = useState([])
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!session?.user?.id) return
    loadEvents()
  }, [session])

  async function loadEvents() {
    setLoading(true)
    try {
      const { data: org } = await supabase.from('events')
        .select('*').eq('organizer_id', session.user.id)
        .order('created_at', { ascending: false })
      setOrganized(org || [])

      const { data: rsvps } = await supabase.from('event_rsvps')
        .select('*, events(*)').eq('user_id', session.user.id)
        .neq('status', 'not_interested')
      setAttending((rsvps || []).filter(r => r.events))
    } catch (e) { console.warn('Events load:', e.message) }
    setLoading(false)
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  function toInputDate(d) { return d ? d.substring(0, 10) : '' }
  function toInputTime(d) { return d ? d.substring(11, 16) : '' }

  // ── Edit ──
  function startEditEvent(ev) {
    setEditingId(ev.id)
    setEditForm({
      title: ev.title || '',
      description: ev.description || '',
      about: ev.about || '',
      category: ev.category || '',
      venue_name: ev.venue_name || '',
      venue_address: ev.venue_address || '',
      venue_type: ev.venue_type || 'physical',
      meeting_link: ev.meeting_link || '',
      start_date: toInputDate(ev.start_date),
      start_time: toInputTime(ev.start_date),
      end_date: toInputDate(ev.end_date),
      end_time: toInputTime(ev.end_date),
      is_free: ev.is_free ?? true,
      price: ev.price || '',
      payment_link: ev.payment_link || '',
      visibility: ev.visibility || 'public',
    })
  }

  async function saveEventEdit(id) {
    setSaving(true)
    try {
      const startDT = `${editForm.start_date}T${editForm.start_time || '00:00'}:00`
      const endDT = editForm.end_date ? `${editForm.end_date}T${editForm.end_time || '23:59'}:00` : null
      const { error } = await supabase.from('events').update({
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        about: editForm.about.trim() || null,
        category: editForm.category.trim(),
        venue_name: editForm.venue_name.trim(),
        venue_address: editForm.venue_address.trim() || null,
        venue_type: editForm.venue_type,
        meeting_link: editForm.meeting_link.trim() || null,
        start_date: startDT,
        end_date: endDT,
        is_free: editForm.is_free,
        price: editForm.is_free ? null : parseFloat(editForm.price) || null,
        payment_link: editForm.is_free ? null : editForm.payment_link.trim() || null,
        visibility: editForm.visibility,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('organizer_id', session.user.id)
      if (error) throw error
      setToast({ msg: 'Event updated!', type: 'success' })
      setEditingId(null)
      loadEvents()
    } catch (e) { setToast({ msg: e.message, type: 'error' }) }
    setSaving(false)
  }

  // ── Actions ──
  async function cancelEvent(id) {
    if (!confirm('Cancel this event? Attendees won\'t be notified automatically.')) return
    await supabase.from('events').update({ status: 'cancelled' }).eq('id', id)
    loadEvents()
  }
  async function republishEvent(id) {
    await supabase.from('events').update({ status: 'published' }).eq('id', id)
    loadEvents()
  }
  async function deleteEvent(id) {
    if (!confirm('Permanently delete this event and all RSVPs?')) return
    await supabase.from('event_rsvps').delete().eq('event_id', id)
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  function copyReminder(ev) {
    const url = `visitnaija.online/pass/${ev.slug}`
    const diff = new Date(ev.start_date) - new Date()
    const days = Math.max(0, Math.floor(diff / 86400000))
    const msg = `🎉 ${ev.title} — ${days > 0 ? days + ' days to go!' : 'Happening now!'}\n📅 ${formatDate(ev.start_date)}\n📍 ${ev.venue_name || 'TBA'}\nRSVP: ${url}`
    navigator.clipboard?.writeText(msg)
    setToast({ msg: 'Reminder copied!', type: 'success' })
  }

  // ── RSVP Viewer ──
  async function loadRsvps(eventId) {
    setViewRsvps(eventId)
    setRsvpLoading(true)
    try {
      const { data } = await supabase.from('event_rsvps')
        .select('*, profiles:user_id(full_name, email, username)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      setRsvpList(data || [])
    } catch (e) { console.warn(e) }
    setRsvpLoading(false)
  }

  if (loading) return <div className="de-empty"><div className="ed-spinner" style={{ margin: '0 auto' }} /></div>

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/pass/create')}>
          + Create New Event
        </button>
      </div>

      {/* ── Organized Events ── */}
      <div className="de-section">
        <h3><CalendarRegular fontSize={18} /> Events I'm Organizing ({organized.length})</h3>
        {organized.length === 0 ? (
          <div className="de-empty">You haven't created any events yet</div>
        ) : organized.map(ev => {
          const isEditing = editingId === ev.id
          const showingRsvps = viewRsvps === ev.id

          return (
            <div key={ev.id} className="de-event-card" style={{ cursor: 'default' }}>
              <div className="de-event-top">
                <div>
                  <div className="de-event-title">{ev.title}</div>
                  <div className="de-event-meta">
                    <span>📅 {formatDate(ev.start_date)}</span>
                    <span>{ev.category}</span>
                    <span>{ev.visibility === 'public' ? '🌍 Public' : '🔒 Private'}</span>
                    <span>{ev.is_free ? '🆓 Free' : `₦${Number(ev.price).toLocaleString()}`}</span>
                  </div>
                </div>
                <span className={`de-event-status ${ev.status}`}>{ev.status}</span>
              </div>

              {/* Action buttons */}
              <div className="de-actions">
                <Link to={`/pass/${ev.slug}`} className="btn btn-outline btn-sm">View Event</Link>
                <button className="btn btn-outline btn-sm" onClick={() => isEditing ? setEditingId(null) : startEditEvent(ev)}>
                  <EditRegular fontSize={14} /> {isEditing ? 'Cancel Edit' : 'Edit'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => showingRsvps ? setViewRsvps(null) : loadRsvps(ev.id)}>
                  <PeopleRegular fontSize={14} /> {showingRsvps ? 'Hide RSVPs' : 'RSVPs'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => copyReminder(ev)}>
                  <CopyRegular fontSize={14} /> Reminder
                </button>
                {ev.status === 'published' && (
                  <button className="btn btn-outline btn-sm" onClick={() => cancelEvent(ev.id)} style={{ color: '#f59e0b' }}>Cancel</button>
                )}
                {ev.status === 'cancelled' && (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => republishEvent(ev.id)} style={{ color: '#22c55e' }}>Republish</button>
                    <button className="btn btn-outline btn-sm" onClick={() => deleteEvent(ev.id)} style={{ color: '#ef4444' }}>
                      <DeleteRegular fontSize={14} /> Delete
                    </button>
                  </>
                )}
              </div>

              {/* ── Inline Edit Form ── */}
              {isEditing && (
                <div className="my-listing-edit-form" style={{ marginTop: '0.75rem' }}>
                  <div className="user-edit-field">
                    <label>Event Title</label>
                    <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="user-edit-field">
                    <label>Short Description</label>
                    <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} maxLength={200} />
                  </div>
                  <div className="user-edit-field">
                    <label>About / Details</label>
                    <textarea value={editForm.about} onChange={e => setEditForm(p => ({ ...p, about: e.target.value }))} rows={3} maxLength={1000} />
                  </div>
                  <div className="user-edit-row">
                    <div className="user-edit-field">
                      <label>Category</label>
                      <input value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                    </div>
                    <div className="user-edit-field">
                      <label>Venue Type</label>
                      <select value={editForm.venue_type} onChange={e => setEditForm(p => ({ ...p, venue_type: e.target.value }))} className="ce-select">
                        <option value="physical">Physical</option>
                        <option value="virtual">Virtual</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div className="user-edit-row">
                    <div className="user-edit-field">
                      <label>Venue Name</label>
                      <input value={editForm.venue_name} onChange={e => setEditForm(p => ({ ...p, venue_name: e.target.value }))} />
                    </div>
                    <div className="user-edit-field">
                      <label>Venue Address</label>
                      <input value={editForm.venue_address} onChange={e => setEditForm(p => ({ ...p, venue_address: e.target.value }))} />
                    </div>
                  </div>
                  {(editForm.venue_type === 'virtual' || editForm.venue_type === 'hybrid') && (
                    <div className="user-edit-field">
                      <label>Meeting Link</label>
                      <input value={editForm.meeting_link} onChange={e => setEditForm(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." />
                    </div>
                  )}
                  <div className="user-edit-row">
                    <div className="user-edit-field">
                      <label>Start Date</label>
                      <input type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div className="user-edit-field">
                      <label>Start Time</label>
                      <input type="time" value={editForm.start_time} onChange={e => setEditForm(p => ({ ...p, start_time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="user-edit-row">
                    <div className="user-edit-field">
                      <label>End Date</label>
                      <input type="date" value={editForm.end_date} onChange={e => setEditForm(p => ({ ...p, end_date: e.target.value }))} />
                    </div>
                    <div className="user-edit-field">
                      <label>End Time</label>
                      <input type="time" value={editForm.end_time} onChange={e => setEditForm(p => ({ ...p, end_time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="user-edit-row">
                    <div className="user-edit-field">
                      <label>Pricing</label>
                      <select value={editForm.is_free ? 'free' : 'paid'} onChange={e => setEditForm(p => ({ ...p, is_free: e.target.value === 'free' }))} className="ce-select">
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {!editForm.is_free && (
                      <div className="user-edit-field">
                        <label>Price (₦)</label>
                        <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} />
                      </div>
                    )}
                  </div>
                  {!editForm.is_free && (
                    <div className="user-edit-field">
                      <label>Payment Link</label>
                      <input value={editForm.payment_link} onChange={e => setEditForm(p => ({ ...p, payment_link: e.target.value }))} placeholder="Bank details or WhatsApp link" />
                    </div>
                  )}
                  <div className="user-edit-field">
                    <label>Visibility</label>
                    <select value={editForm.visibility} onChange={e => setEditForm(p => ({ ...p, visibility: e.target.value }))} className="ce-select">
                      <option value="public">Public — visible on Wanda</option>
                      <option value="private">Private — invite link only</option>
                    </select>
                  </div>
                  <div className="user-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => saveEventEdit(ev.id)} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── RSVP Viewer ── */}
              {showingRsvps && (
                <div style={{ marginTop: '0.75rem' }}>
                  {rsvpLoading ? (
                    <div className="de-empty"><div className="ed-spinner" style={{ margin: '0 auto', width: 20, height: 20 }} /></div>
                  ) : rsvpList.length === 0 ? (
                    <div className="de-empty">No RSVPs yet</div>
                  ) : (
                    <div style={{ background: 'var(--bg)', borderRadius: '0.5rem', padding: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {rsvpList.length} total — {rsvpList.filter(r => r.status === 'interested').length} going, {rsvpList.filter(r => r.status === 'maybe').length} maybe
                      </div>
                      {rsvpList.map(r => {
                        const name = r.guest_name || r.profiles?.full_name || r.profiles?.username || 'Anonymous'
                        const contact = r.guest_email || r.profiles?.email || r.guest_phone || '—'
                        return (
                          <div key={r.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)',
                            fontSize: '0.85rem',
                          }}>
                            <div>
                              <div style={{ color: 'var(--text)', fontWeight: 500 }}>{name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {contact}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <span className={`de-rsvp-badge ${r.status === 'interested' ? 'going' : 'maybe'}`}>
                                {r.status === 'interested' ? 'Going' : 'Maybe'}
                              </span>
                              {r.has_paid && <span className="de-rsvp-badge paid">Paid</span>}
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <Link to={`/pass/${ev.slug}/ticket`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                          🎟️ View / Download Ticket
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Attending Events ── */}
      <div className="de-section">
        <h3><PeopleRegular fontSize={18} /> Events I'm Attending ({attending.length})</h3>
        {attending.length === 0 ? (
          <div className="de-empty">You haven't RSVP'd to any events. <Link to="/pass" style={{ color: 'var(--primary)' }}>Browse events →</Link></div>
        ) : attending.map(r => (
          <Link to={`/pass/${r.events.slug}`} key={r.id} className="de-event-card">
            <div className="de-event-top">
              <div>
                <div className="de-event-title">{r.events.title}</div>
                <div className="de-event-meta">
                  <span>📅 {formatDate(r.events.start_date)}</span>
                  <span>{r.events.category}</span>
                </div>
              </div>
              <div>
                <span className={`de-rsvp-badge ${r.status === 'interested' ? 'going' : 'maybe'}`}>
                  {r.status === 'interested' ? '✅ Going' : '🤔 Maybe'}
                </span>
                {r.has_paid && <span className="de-rsvp-badge paid" style={{ marginLeft: 4 }}>💰 Paid</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
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
