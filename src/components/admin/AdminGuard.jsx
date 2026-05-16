import { Link } from 'react-router-dom'
import { isAdmin } from '../../lib/supabase.js'
import { LockClosedRegular, ProhibitedRegular } from '@fluentui/react-icons'

export default function AdminGuard({ session, profile, children }) {
  if (!session) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-icon"><LockClosedRegular fontSize={48} /></div>
        <h1>Sign In Required</h1>
        <p>You need to be signed in to access the admin panel.</p>
        <Link to="/auth" className="admin-btn admin-btn-primary">Sign In</Link>
      </div>
    )
  }

  if (!isAdmin(profile)) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-icon"><ProhibitedRegular fontSize={48} color="var(--red)" /></div>
        <h1>Access Denied</h1>
        <p>You don't have admin privileges. Contact the site owner.</p>
        <Link to="/" className="admin-btn admin-btn-ghost">Back to Home</Link>
      </div>
    )
  }

  return children
}
