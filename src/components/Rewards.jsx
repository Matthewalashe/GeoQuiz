import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague, getNextLeague, getXPToNextLeague, LEAGUE_TIERS,
  DAILY_REWARDS, getRewardsData, claimDailyReward, canClaimToday,
} from '../engine/xp.js'
import { fetchLeaguePeers, supabase } from '../lib/supabase.js'
import {
  getBalance, purchaseItem, hasPurchased, canAfford,
  getStoreByCategory, setActiveItem, getActiveItem,
} from '../engine/coinEconomy.js'

export default function Rewards({ session, profile }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('rewards') // rewards | league | store
  const [loading, setLoading] = useState(!session)
  const [checkedSession, setCheckedSession] = useState(session)

  // If no session prop, independently check auth
  useEffect(() => {
    if (session) { setCheckedSession(session); setLoading(false); return }
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) setCheckedSession(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [session])

  // ─── AUTH GATE ──────────────────────────────────────────
  if (loading) {
    return (
      <section className="rewards-page" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading rewards...</p>
        </div>
      </section>
    )
  }

  if (!checkedSession) {
    return (
      <section className="rewards-page" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sign In to Earn Rewards</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Create an account or sign in to claim daily rewards, track your streak, compete in leagues, and save your scores across devices.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn btn-primary" style={{ minWidth: 140 }}>Sign In</Link>
            <Link to="/auth?mode=signup" className="btn btn-outline" style={{ minWidth: 140 }}>Create Account</Link>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <div>🔥 Daily streak rewards — up to 7 days</div>
            <div>🏆 Compete in league leaderboards</div>
            <div>📊 Track your XP and level progress</div>
          </div>
        </div>
      </section>
    )
  }

  // ─── AUTHENTICATED REWARDS ──────────────────────────────
  return <RewardsContent session={checkedSession} profile={profile} navigate={navigate} tab={tab} setTab={setTab} />
}

function RewardsContent({ session, profile, navigate, tab, setTab }) {
  const [xp, setXP] = useState(getXPData)
  const [rewards, setRewards] = useState(getRewardsData)
  const [canClaim, setCanClaim] = useState(canClaimToday)
  const [claimResult, setClaimResult] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const [confettiBits] = useState(() => Array.from({ length: 30 }, () => ({
    x: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
  })))

  // Prefer Supabase profile data over localStorage
  const displayXP = profile?.total_xp ?? xp.totalXP
  const level = getLevel(displayXP)
  const title = getLevelTitle(level)
  const league = getCurrentLeague(displayXP)
  const nextLeague = getNextLeague(displayXP)
  const xpToNext = getXPToNextLeague(displayXP)
  const playerName = profile?.username || profile?.full_name || session?.user?.email?.split('@')[0] || 'Explorer'
  const displayAvatar = profile?.avatar_url || '🧭'
  const [peers, setPeers] = useState([])

  // Fetch real league peers from Supabase
  useEffect(() => {
    const nextLg = getNextLeague(displayXP)
    const minXP = league.minXP
    const maxXP = nextLg ? nextLg.minXP - 1 : 999999
    fetchLeaguePeers(Math.max(0, minXP - 500), maxXP + 500, 20).then(data => {
      const withPlayer = data.map(p => ({
        ...p,
        isPlayer: p.id === session?.user?.id,
      }))
      const hasPlayer = withPlayer.some(p => p.isPlayer)
      if (!hasPlayer) {
        withPlayer.push({ id: session?.user?.id, name: playerName, avatar: displayAvatar, xp: displayXP, level, isPlayer: true })
      }
      withPlayer.sort((a, b) => (b.xp || 0) - (a.xp || 0))
      setPeers(withPlayer)
    }).catch(() => setPeers([{ name: playerName, avatar: displayAvatar, xp: displayXP, isPlayer: true }]))
  }, [displayXP])

  function handleClaim() {
    const result = claimDailyReward()
    if (!result.alreadyClaimed) {
      setClaimResult(result)
      setCanClaim(false)
      setXP(getXPData())
      setRewards(getRewardsData())
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    }
  }

  return (
    <section className="rewards-page">
      {/* Confetti burst */}
      {showConfetti && (
        <div className="rw-confetti">
          {confettiBits.map((bit, i) => (
            <span key={i} className="rw-confetti-bit" style={{
              '--x': bit.x,
              '--delay': bit.delay,
              '--color': ['#00ff88', '#fbbf24', '#8b5cf6', '#00d4ff', '#ff6b35', '#ef4444'][i % 6],
            }} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="rw-tabs">
        <button className={`rw-tab ${tab === 'rewards' ? 'active' : ''}`} onClick={() => setTab('rewards')}>
          🎁 Rewards
        </button>
        <button className={`rw-tab ${tab === 'store' ? 'active' : ''}`} onClick={() => setTab('store')}>
          🪙 Store
        </button>
        <button className={`rw-tab ${tab === 'league' ? 'active' : ''}`} onClick={() => setTab('league')}>
          {league.emoji} Leagues
        </button>
      </div>

      {/* ═══ DAILY REWARDS TAB ═══ */}
      {tab === 'rewards' && (
        <div className="rw-rewards">
          <div className="rw-streak-banner">
            <span className="rw-streak-fire">🔥</span>
            <div>
              <div className="rw-streak-count">{xp.streakDays || 0} Day Streak</div>
              <div className="rw-streak-sub">
                {xp.streakFreezes > 0 && <span>❄️ {xp.streakFreezes} freeze{xp.streakFreezes > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>

          {/* 7-day reward calendar */}
          <div className="rw-calendar">
            {DAILY_REWARDS.map((r, i) => {
              const dayNum = i + 1
              const claimed = rewards.claimedDays?.includes(dayNum)
              const isToday = rewards.currentDay === dayNum || (rewards.currentDay === 0 && dayNum === 1)
              const isNext = !claimed && dayNum === (rewards.currentDay || 0) + 1
              return (
                <div key={i} className={`rw-day ${claimed ? 'claimed' : ''} ${isToday && canClaim ? 'today' : ''} ${isNext ? 'next' : ''}`}>
                  <div className="rw-day-num">Day {dayNum}</div>
                  <div className="rw-day-emoji">{r.emoji}</div>
                  <div className="rw-day-label">{r.label}</div>
                  {claimed && <div className="rw-day-check">✓</div>}
                </div>
              )
            })}
          </div>

          {/* Claim button */}
          {canClaim ? (
            <button className="rw-claim-btn" onClick={handleClaim}>
              Claim Today's Reward 🎁
            </button>
          ) : (
            <div className="rw-claimed-msg">
              {claimResult ? (
                <div className="rw-claim-result">
                  <span className="rw-claim-emoji">{claimResult.reward.emoji}</span>
                  <span>{claimResult.reward.label} claimed!</span>
                  {claimResult.xpAwarded > 0 && <span className="rw-claim-xp">+{claimResult.xpAwarded} XP</span>}
                </div>
              ) : (
                <p>✅ Today's reward claimed! Come back tomorrow.</p>
              )}
            </div>
          )}

          {/* XP progress */}
          <div className="rw-xp-card">
            <div className="rw-xp-top">
              <span>{title.emoji} Lv.{level} {title.title}</span>
              <span>{displayXP} XP</span>
            </div>
            <div className="rw-xp-bar"><div className="rw-xp-fill" style={{ width: `${getLevelProgress(displayXP) * 100}%` }} /></div>
            <div className="rw-xp-bot">{getXPToNextLevel(displayXP)} XP to Level {level + 1}</div>
          </div>
        </div>
      )}

      {/* ═══ LEAGUES TAB ═══ */}
      {tab === 'league' && (
        <div className="rw-league">
          {/* Current league badge */}
          <div className="rw-league-badge" style={{ borderColor: league.color, boxShadow: `0 0 20px ${league.color}30` }}>
            <span className="rw-lb-emoji">{league.emoji}</span>
            <h3 className="rw-lb-name" style={{ color: league.color }}>{league.name} League</h3>
            {nextLeague && (
              <p className="rw-lb-progress">
                {xpToNext} XP to {nextLeague.emoji} {nextLeague.name}
              </p>
            )}
            {!nextLeague && <p className="rw-lb-progress">🏆 You've reached the top!</p>}
          </div>

          {/* League tiers */}
          <div className="rw-tiers">
            {LEAGUE_TIERS.map(t => {
              const isActive = t.id === league.id
              const isReached = displayXP >= t.minXP
              return (
                <div key={t.id} className={`rw-tier ${isActive ? 'active' : ''} ${isReached ? 'reached' : ''}`}>
                  <span className="rw-tier-emoji">{t.emoji}</span>
                  <span className="rw-tier-name">{t.name}</span>
                  <span className="rw-tier-xp">{t.minXP.toLocaleString()} XP</span>
                  {isActive && <span className="rw-tier-you">YOU</span>}
                </div>
              )
            })}
          </div>

          {/* Weekly leaderboard */}
          <h4 className="rw-lb-title">Weekly Leaderboard</h4>
          <div className="rw-lb-list">
            {peers.slice(0, 15).map((p, i) => (
              <div key={i} className={`rw-lb-row ${p.isPlayer ? 'is-you' : ''} ${i < 10 ? 'promote' : ''}`}>
                <span className="rw-lb-rank">{i + 1}</span>
                <span className="rw-lb-avatar">{p.avatar && p.avatar.startsWith('http') ? <img src={p.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.outerHTML = '🧭' }} /> : (p.avatar || '🧭')}</span>
                <span className="rw-lb-pname">{p.name}{p.isPlayer ? ' (You)' : ''}</span>
                <span className="rw-lb-pxp">{p.xp} XP</span>
                {i < 10 && <span className="rw-lb-badge">▲</span>}
              </div>
            ))}
          </div>
          <p className="rw-lb-note">Top 10 promote · Bottom 5 demote · Resets Monday</p>

          {/* Motivational nudge */}
          {nextLeague && (
            <div className="rw-nudge">
              <span>🎯</span> Play {Math.ceil(xpToNext / 150)} more games to reach {nextLeague.emoji} {nextLeague.name}!
            </div>
          )}
        </div>
      )}

      {/* ═══ STORE TAB ═══ */}
      {tab === 'store' && <StoreTab />}

      <div className="rw-actions">
        <button className="btn btn-primary" onClick={() => navigate('/play')}>Play Now</button>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Profile</button>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// STORE TAB COMPONENT
// ═══════════════════════════════════════════
function StoreTab() {
  const [balance, setBalance] = useState(getBalance)
  const [filter, setFilter] = useState('all')
  const [purchasing, setPurchasing] = useState(null) // item being confirmed
  const [lastPurchase, setLastPurchase] = useState(null)
  const catalog = getStoreByCategory()

  const categories = [
    { id: 'all', label: 'All', emoji: '🏪' },
    { id: 'theme', label: 'Themes', emoji: '🎨' },
    { id: 'powerup', label: 'Power-ups', emoji: '⚡' },
    { id: 'badge', label: 'Badges', emoji: '🏅' },
  ]

  const items = filter === 'all'
    ? Object.values(catalog).flat()
    : catalog[filter] || []

  function handlePurchase(item) {
    if (hasPurchased(item.id)) return
    if (!canAfford(item.price)) return
    setPurchasing(item)
  }

  function confirmPurchase() {
    if (!purchasing) return
    const result = purchaseItem(purchasing.id, purchasing.price)
    if (result.success) {
      setBalance(result.balance)
      setLastPurchase(purchasing)
      setTimeout(() => setLastPurchase(null), 3000)
    }
    setPurchasing(null)
  }

  function handleEquip(item) {
    if (item.category === 'theme') setActiveItem('theme', item.id)
    else if (item.category === 'badge') setActiveItem('badge', item.id)
    setBalance(getBalance()) // trigger re-render
  }

  return (
    <div className="st-store">
      {/* Balance bar */}
      <div className="st-balance glass">
        <span className="st-balance-icon">🪙</span>
        <span className="st-balance-amount">{balance.toLocaleString()}</span>
        <span className="st-balance-label">coins</span>
      </div>

      {/* How to earn */}
      <div className="st-earn-tips">
        <span>Earn coins: </span>
        <span className="st-tip">🎮 Play games</span>
        <span className="st-tip">🔥 Daily streaks</span>
        <span className="st-tip">🏆 Achievements</span>
      </div>

      {/* Category filter */}
      <div className="st-filters">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`st-filter ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="st-grid">
        {items.map(item => {
          const owned = hasPurchased(item.id)
          const affordable = canAfford(item.price)
          const active = getActiveItem(item.category) === item.id

          return (
            <div key={item.id} className={`st-card glass ${owned ? 'st-card-owned' : ''} ${active ? 'st-card-active' : ''}`}>
              {/* Preview for themes */}
              {item.preview && (
                <div className="st-card-preview" style={{ background: item.preview }} />
              )}

              <div className="st-card-emoji">{item.emoji}</div>
              <div className="st-card-name">{item.name}</div>
              <div className="st-card-desc">{item.description}</div>

              {item.consumable && <div className="st-card-uses">{item.uses} uses</div>}

              {owned ? (
                <div className="st-card-actions">
                  {item.category !== 'powerup' && (
                    <button
                      className={`st-btn ${active ? 'st-btn-equipped' : 'st-btn-equip'}`}
                      onClick={() => handleEquip(item)}
                    >
                      {active ? '✓ Equipped' : 'Equip'}
                    </button>
                  )}
                  {item.category === 'powerup' && (
                    <span className="st-owned-label">✓ Owned</span>
                  )}
                </div>
              ) : (
                <button
                  className={`st-btn st-btn-buy ${!affordable ? 'st-btn-locked' : ''}`}
                  onClick={() => handlePurchase(item)}
                  disabled={!affordable}
                >
                  🪙 {item.price}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Purchase confirmation modal */}
      {purchasing && (
        <div className="st-modal-overlay" onClick={() => setPurchasing(null)}>
          <div className="st-modal glass" onClick={e => e.stopPropagation()}>
            <div className="st-modal-emoji">{purchasing.emoji}</div>
            <h3 className="st-modal-title">Buy {purchasing.name}?</h3>
            <p className="st-modal-desc">{purchasing.description}</p>
            <div className="st-modal-price">
              <span>🪙 {purchasing.price} coins</span>
              <span className="st-modal-after">Balance after: {balance - purchasing.price}</span>
            </div>
            <div className="st-modal-actions">
              <button className="st-btn st-btn-confirm" onClick={confirmPurchase}>Buy Now</button>
              <button className="st-btn st-btn-cancel" onClick={() => setPurchasing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase success toast */}
      {lastPurchase && (
        <div className="st-toast">
          ✅ {lastPurchase.emoji} {lastPurchase.name} purchased!
        </div>
      )}
    </div>
  )
}
