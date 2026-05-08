import { submitScore } from '../lib/supabase.js'

/**
 * Auto-submit a game score to the leaderboard.
 * Call this from any game component on completion.
 */
export async function autoSubmitScore({ gameType, score, maxScore, questionCount = 1 }) {
  const playerName = localStorage.getItem('geoquiz_player')
  if (!playerName) return null // Player hasn't set a name yet

  try {
    return await submitScore({
      playerName,
      score,
      maxScore,
      questionCount,
      categories: [gameType],
      difficulty: 'all',
      avatar: localStorage.getItem('geoquiz_avatar') || '🎭',
      gameType,
    })
  } catch (err) {
    console.error(`[${gameType}] Score submit failed:`, err)
    return null
  }
}
