import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { signUp, signIn, signInWithGoogle, resetPassword, updatePassword } from '../lib/supabase.js'
import { PersonRegular, MailRegular, LockClosedRegular, ArrowRightRegular, ShieldCheckmarkRegular, EyeRegular, EyeOffRegular } from '@fluentui/react-icons'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'login'
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    username: localStorage.getItem('geoquiz_player') || '',
  })

  // If mode=reset is in URL, user came from password reset email
  useEffect(() => {
    if (searchParams.get('mode') === 'reset') setMode('reset')
  }, [searchParams])

  const update = (field, val) => setFormData(p => ({ ...p, [field]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'forgot') {
        await resetPassword(formData.email)
        setError('✅ Check your email for a password reset link!')
        return
      }
      if (mode === 'reset') {
        await updatePassword(formData.newPassword)
        setError('✅ Password updated! You can now sign in.')
        setTimeout(() => { setMode('login'); setError(null) }, 2000)
        return
      }
      if (mode === 'signup') {
        await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          avatar: localStorage.getItem('geoquiz_avatar') || '🧭'
        })
        setError('✅ Check your email to verify your account!')
      } else {
        await signIn({ email: formData.email, password: formData.password })
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const isSuccess = error?.startsWith('✅')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo"><img src="/wanda-logo.png" alt="Wanda" className="auth-logo-img" /></Link>
          <h1>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create an account'}
            {mode === 'forgot' && 'Reset password'}
            {mode === 'reset' && 'Set new password'}
          </h1>
          <p>
            {mode === 'login' && 'Continue your journey across Nigeria'}
            {mode === 'signup' && 'Join the community of explorers'}
            {mode === 'forgot' && "Enter your email and we'll send a reset link"}
            {mode === 'reset' && 'Choose a strong new password'}
          </p>
        </div>

        {error && (
          <div className={`auth-alert ${isSuccess ? 'auth-alert-success' : 'auth-alert-error'}`}>
            {error}
          </div>
        )}

        {/* Google Sign In — not for forgot/reset */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <button
              type="button"
              className="auth-submit"
              onClick={handleGoogle}
              disabled={loading}
              style={{ background: '#fff', color: '#333', border: '1px solid var(--border)', marginBottom: '1rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 1rem' }}>or</div>
          </>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label><PersonRegular fontSize={18} /> Username</label>
              <input type="text" placeholder="Choose an explorer name" value={formData.username}
                onChange={e => update('username', e.target.value)} required />
            </div>
          )}

          {mode !== 'reset' && (
            <div className="auth-field">
              <label><MailRegular fontSize={18} /> Email Address</label>
              <input type="email" placeholder="name@example.com" value={formData.email}
                onChange={e => update('email', e.target.value)} required />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="auth-field">
              <label><LockClosedRegular fontSize={18} /> Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={formData.password}
                  onChange={e => update('password', e.target.value)} required
                  style={{ width: '100%', paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showPw ? <EyeOffRegular fontSize={18} /> : <EyeRegular fontSize={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="auth-field">
              <label><LockClosedRegular fontSize={18} /> New Password</label>
              <input type="password" placeholder="Enter new password" value={formData.newPassword}
                onChange={e => update('newPassword', e.target.value)} required minLength={6} />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <button type="button" onClick={() => setMode('forgot')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer' }}>
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
            {!loading && <ArrowRightRegular fontSize={18} />}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && <p>Don't have an account? <button onClick={() => setMode('signup')}>Sign up free</button></p>}
          {mode === 'signup' && <p>Already have an account? <button onClick={() => setMode('login')}>Log in</button></p>}
          {(mode === 'forgot' || mode === 'reset') && <p><button onClick={() => setMode('login')}>Back to login</button></p>}
        </div>

        <div className="auth-security-badge">
          <ShieldCheckmarkRegular fontSize={14} />
          <span>Secured by Supabase Auth</span>
        </div>
      </div>

      <div className="auth-visual">
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <div className="auth-quote">"The world is a book and those who do not travel read only one page."</div>
          <div className="auth-quote-author">— Augustine of Hippo</div>
        </div>
      </div>
    </div>
  )
}
