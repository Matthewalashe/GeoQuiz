import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAMPAIGN_CHAPTERS, getCampaignProgress } from '../data/campaign.js'
import { MAP_SKINS, getActiveSkin, setActiveSkin, isSkinUnlocked } from '../data/map-skins.js'
import { getXPData } from '../engine/xp.js'

export default function StoryMode() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('campaign') // campaign | skins
  const [selectedChapter, setSelectedChapter] = useState(null)
  const progress = getCampaignProgress()
  const xp = getXPData()
  const [activeSkinId, setActiveSkinId] = useState(getActiveSkin)

  function selectSkin(id) {
    setActiveSkin(id)
    setActiveSkinId(id)
  }

  // ── Chapter Detail View ──
  if (selectedChapter) {
    const ch = CAMPAIGN_CHAPTERS.find(c => c.id === selectedChapter)
    const prog = progress.chapters.find(c => c.id === selectedChapter)
    const totalStars = prog.stages.reduce((s, st) => s + st.stars, 0)
    const maxStars = ch.stages.length * 3

    return (
      <section className="story-page">
        <button className="gh-back" onClick={() => setSelectedChapter(null)}>← Chapters</button>

        {/* Chapter Hero */}
        <div className="sm-ch-hero" style={{ borderColor: ch.color }}>
          <span className="sm-ch-icon">{ch.icon}</span>
          <h2 className="sm-ch-title" style={{ color: ch.color }}>{ch.title}</h2>
          <p className="sm-ch-sub">{ch.subtitle}</p>
          <div className="sm-ch-stars">{totalStars}/{maxStars} ⭐</div>
        </div>

        {/* Intro */}
        <div className="sm-intro">
          <p>{ch.intro}</p>
        </div>

        {/* Stages — Candy Crush path */}
        <div className="sm-path">
          {ch.stages.map((stage, i) => {
            const sp = prog.stages[i]
            const isLocked = i > 0 && !prog.stages[i - 1].completed
            return (
              <div key={stage.id} className="sm-stage-wrap">
                {i > 0 && <div className={`sm-wire ${sp.completed ? 'done' : ''}`} style={sp.completed ? { background: ch.color } : {}} />}
                <button
                  className={`sm-stage ${sp.completed ? 'done' : ''} ${isLocked ? 'locked' : ''}`}
                  style={sp.completed ? { borderColor: ch.color, boxShadow: `0 0 12px ${ch.color}40` } : {}}
                  onClick={() => {
                    if (!isLocked) {
                      // Navigate to quiz with this chapter's category
                      navigate(`/game?category=${ch.categoryFilter}&count=${stage.questions}&campaign=${ch.id}&stage=${stage.id}`)
                    }
                  }}
                  disabled={isLocked}
                >
                  {isLocked ? '🔒' : sp.completed ? '✓' : stage.id}
                </button>
                <div className="sm-stage-name">{stage.name}</div>
                <div className="sm-stage-stars">
                  {[1, 2, 3].map(s => (
                    <span key={s} className={sp.stars >= s ? 'star-filled' : 'star-empty'}>★</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Fun Facts */}
        <div className="sm-facts">
          <h4 className="sm-facts-title">📚 Did You Know?</h4>
          {ch.facts.map((f, i) => (
            <div key={i} className="sm-fact">{f}</div>
          ))}
        </div>

        {/* Badge */}
        {prog.badgeEarned && (
          <div className="sm-badge-earned" style={{ borderColor: ch.color }}>
            <span className="sm-badge-icon">{ch.badgeEmoji}</span>
            <span>{ch.title} — Badge Earned!</span>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="story-page">
      {/* Tabs */}
      <div className="rw-tabs">
        <button className={`rw-tab ${tab === 'campaign' ? 'active' : ''}`} onClick={() => setTab('campaign')}>📖 Story Mode</button>
        <button className={`rw-tab ${tab === 'skins' ? 'active' : ''}`} onClick={() => setTab('skins')}>🗺️ Map Skins</button>
      </div>

      {/* ═══ CAMPAIGN TAB ═══ */}
      {tab === 'campaign' && (
        <div className="sm-campaign">
          <div className="sm-header">
            <h2 className="sm-main-title">Story Mode</h2>
            <p className="sm-main-sub">Complete chapters to earn badges and unlock map skins</p>
            <div className="sm-total-stars">⭐ {progress.totalStars} total stars</div>
          </div>

          <div className="sm-chapters">
            {CAMPAIGN_CHAPTERS.map((ch, i) => {
              const prog_ch = progress.chapters[i]
              const isLocked = !prog_ch.unlocked
              const stagesDone = prog_ch.stages.filter(s => s.completed).length
              const stars = prog_ch.stages.reduce((s, st) => s + st.stars, 0)

              return (
                <button
                  key={ch.id}
                  className={`sm-ch-card ${isLocked ? 'locked' : ''} ${prog_ch.completed ? 'completed' : ''}`}
                  style={!isLocked ? { borderColor: ch.color } : {}}
                  onClick={() => !isLocked && setSelectedChapter(ch.id)}
                  disabled={isLocked}
                >
                  <div className="sm-ch-card-icon" style={{ background: isLocked ? 'var(--border)' : ch.color }}>
                    {isLocked ? '🔒' : ch.icon}
                  </div>
                  <div className="sm-ch-card-body">
                    <div className="sm-ch-card-week">Week {ch.week}</div>
                    <div className="sm-ch-card-name">{ch.title}</div>
                    <div className="sm-ch-card-progress">
                      {isLocked ? 'Locked' : prog_ch.completed ? '✓ Completed' : `${stagesDone}/${ch.stages.length} stages · ${stars}⭐`}
                    </div>
                  </div>
                  {prog_ch.badgeEarned && <span className="sm-ch-badge">{ch.badgeEmoji}</span>}
                  {!isLocked && !prog_ch.completed && <span className="sm-ch-arrow">→</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ MAP SKINS TAB ═══ */}
      {tab === 'skins' && (
        <div className="sm-skins">
          <div className="sm-header">
            <h2 className="sm-main-title">Map Skins</h2>
            <p className="sm-main-sub">Customize your gameplay map appearance</p>
          </div>

          <div className="sm-skin-grid">
            {MAP_SKINS.map(skin => {
              const unlocked = isSkinUnlocked(skin, xp)
              const isActive = activeSkinId === skin.id

              return (
                <button
                  key={skin.id}
                  className={`sm-skin-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => unlocked && selectSkin(skin.id)}
                  disabled={!unlocked}
                >
                  <div className="sm-skin-preview" style={skin.filter ? { filter: skin.filter } : {}}>
                    <span className="sm-skin-emoji">{skin.emoji}</span>
                  </div>
                  <div className="sm-skin-name">{skin.name}</div>
                  <div className="sm-skin-unlock">
                    {unlocked ? (isActive ? '✓ Active' : 'Tap to use') : `🔒 ${skin.unlockLabel}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="rw-actions">
        <button className="btn btn-primary" onClick={() => navigate('/play')}>Play Now</button>
        <button className="btn btn-outline" onClick={() => navigate('/rewards')}>Rewards</button>
      </div>
    </section>
  )
}
