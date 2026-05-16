import { Link } from 'react-router-dom'
import { isAdmin } from '../../lib/supabase.js'
import { LockClosedRegular, ProhibitedRegular, ArrowRightRegular } from '@fluentui/react-icons'

export default function AdminGuard({ session, profile, children }) {
  if (!session) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-icon"><LockClosedRegular fontSize={48} /></div>
        <h1>Admin Sign In</h1>
        <p>Sign in with your admin account to access the CMS dashboard.</p>
        <Link to="/auth" className="admin-btn admin-btn-primary">
          Sign In <ArrowRightRegular fontSize={16} />
        </Link>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          After signing in, navigate back to <code>/admin</code> to access the dashboard.
        </p>
      </div>
    )
  }

  if (!isAdmin(profile)) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-icon"><ProhibitedRegular fontSize={48} color="var(--red)" /></div>
        <h1>Access Denied</h1>
        <p>Your account ({session?.user?.email}) does not have admin privileges.</p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', maxWidth: '400px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>How to get admin access:</strong>
          <ol style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: 1.8 }}>
            <li>Go to Supabase SQL Editor</li>
            <li>Run the <code>migration-cms.sql</code> script</li>
            <li>It will set <code>donghinny91@gmail.com</code> as admin</li>
            <li>Sign out and sign back in</li>
          </ol>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Link to="/" className="admin-btn admin-btn-ghost">Home</Link>
          <Link to="/auth" className="admin-btn admin-btn-ghost" onClick={() => { import('../../lib/supabase.js').then(m => m.signOut()) }}>
            Sign Out & Switch Account
          </Link>
        </div>
      </div>
    )
  }

  return children
}
