import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span className="dot" />
        GeoQuiz
      </Link>
      <nav className="header-nav">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Play</Link>
        <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
        <Link to="/about" className={pathname === '/about' ? 'active' : ''}>About</Link>
      </nav>
    </header>
  )
}
