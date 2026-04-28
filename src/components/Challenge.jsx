import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { fetchLeaderboard } from '../lib/supabase.js'

// Encode/decode challenge config into URL-safe string
export function encodeChallenge(config, score, playerName) {
  const data = {
    s: config.seed || Math.floor(Math.random() * 99999),
    c: config.categories || [],
    d: config.difficulty || 'all',
    n: config.count || 10,
    t: config.timer || 0,
    sc: score,
    p: playerName,
  }
  return btoa(JSON.stringify(data))
}

export function decodeChallenge(encoded) {
  try {
    return JSON.parse(atob(encoded))
  } catch { return null }
}

export default function Challenge() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')
  const challenge = code ? decodeChallenge(code) : null

  if (!challenge) {
    return (
      <section className="challenge-page">
        <h2>Invalid Challenge</h2>
        <p>This challenge link is broken or expired.</p>
        <Link to="/play" className="btn btn-primary">Play a Normal Game</Link>
      </section>
    )
  }

  function acceptChallenge() {
    const config = {
      categories: challenge.c,
      difficulty: challenge.d,
      count: challenge.n,
      timer: challenge.t,
      seed: challenge.s,
      challenge: {
        opponentName: challenge.p,
        opponentScore: challenge.sc,
      },
    }
    navigate('/game', { state: config })
  }

  return (
    <section className="challenge-page">
      <div className="challenge-card card card-accent-top">
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
        <h2>You've Been Challenged!</h2>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
          <strong>{challenge.p || 'A friend'}</strong> scored <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{challenge.sc}</strong> points and dares you to beat them!
        </p>

        <div className="challenge-details">
          <div className="challenge-detail-row">
            <span>📝 Questions</span><strong>{challenge.n}</strong>
          </div>
          <div className="challenge-detail-row">
            <span>🎯 Difficulty</span><strong style={{ textTransform: 'capitalize' }}>{challenge.d}</strong>
          </div>
          {challenge.t > 0 && (
            <div className="challenge-detail-row">
              <span>⏱️ Timer</span><strong>{challenge.t}s per question</strong>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '1rem 0' }}>
          You'll get the exact same questions. May the best geographer win! 🗺️
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={acceptChallenge}>Accept Challenge ⚔️</button>
          <Link to="/play" className="btn btn-outline">Nah, Custom Quiz</Link>
        </div>
      </div>
    </section>
  )
}
