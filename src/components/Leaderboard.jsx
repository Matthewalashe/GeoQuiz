import { Link } from 'react-router-dom'
import { getLeaderboard } from '../engine/scoring.js'

export default function Leaderboard() {
  const entries = getLeaderboard()

  return (
    <section className="leaderboard">
      <h2>Leaderboard</h2>
      <p className="subtitle">Your top scores across all quiz sessions.</p>

      {entries.length === 0 ? (
        <div className="lb-empty">
          <p>No scores yet. Play a quiz to get on the board!</p>
          <Link to="/play" className="btn btn-primary mt-2">Start Quiz →</Link>
        </div>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Score</th>
              <th>Questions</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td className="rank">{i + 1}</td>
                <td className="lb-score">{entry.score} / {entry.maxScore}</td>
                <td>{entry.questionCount}</td>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="results-actions mt-3">
        <Link to="/play" className="btn btn-primary">Play Again</Link>
        <Link to="/" className="btn btn-outline">Home</Link>
      </div>
    </section>
  )
}
