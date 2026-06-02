import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase, signIn, resetPassword, updatePassword, ensureProfile } from '../lib/supabase.js'
import { playButtonTap, playStepComplete, vibrateTap } from '../engine/audio.js'
import SignUpOnboarding from './SignUpOnboarding.jsx'
import {
  PersonRegular, MailRegular, LockClosedRegular, ArrowRightRegular,
  ShieldCheckmarkRegular, EyeRegular, EyeOffRegular,
  CheckmarkCircleRegular
} from '@fluentui/react-icons'

// App version — visible on auth page so we can verify PWA received the update
const APP_VERSION = 'v4.0'

// Google Client ID for in-app sign-in (no browser redirect)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'login'
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authSession, setAuthSession] = useState(null)
  const [googleReady, setGoogleReady] = useState(false)
  const googleBtnRef = useRef(null)
  const gisInitialized = useRef(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
    username: localStorage.getItem('geoquiz_player') || '',
  })

  useEffect(() => {
    if (searchParams.get('mode') === 'reset') setMode('reset')
  }, [searchParams])

  const goToDashboard = useCallback(async (user) => {
    try {
      if (user) await ensureProfile(user)
    } catch (err) {
      console.warn('[Auth] ensureProfile failed:', err)
    }
    const redirectTo = searchParams.get('redirect')
    navigate(redirectTo || '/dashboard', { replace: true })
  }, [navigate, searchParams])

  // Check if already logged in on mount
  useEffect(() => {
    if (!supabase) return
    let subscription
    try {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          await goToDashboard(session.user)
        }
      }).catch(err => console.warn('[Auth] getSession error:', err))
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'PASSWORD_RECOVERY') {
            // User clicked reset link in email — show the reset form
            setMode('reset')
            setSuccess('Enter your new password below.')
            setLoading(false)
            return
          }
          if ((event === 'SIGNED_IN') && session?.user) {
            await goToDashboard(session.user)
            setLoading(false)
          }
        } catch (err) {
          console.warn('[Auth] onAuthStateChange error:', err)
        }
      })
      subscription = data?.subscription
    } catch (err) {
      console.warn('[Auth] Setup error:', err)
    }
    return () => { if (subscription) subscription.unsubscribe() }
  }, [goToDashboard])

  // ─── GOOGLE IDENTITY SERVICES ──────────────────────────
  // Loads Google's JS and renders sign-in button INSIDE the app
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gisInitialized.current) return
    gisInitialized.current = true

    function loadGIS() {
      try {
        if (window.google?.accounts?.id) {
          setupGoogleButton()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          try { setupGoogleButton() } catch (err) { console.warn('[Auth] Google setup error:', err) }
        }
        script.onerror = () => console.warn('[Auth] Google Identity Services failed to load')
        document.head.appendChild(script)
      } catch (err) {
        console.warn('[Auth] GIS load error:', err)
      }
    }

    function setupGoogleButton() {
      if (!window.google?.accounts?.id) return
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          ux_mode: 'popup',
        })
        setGoogleReady(true)
        renderButton()
      } catch (err) {
        console.warn('[Auth] Google initialize error:', err)
      }
    }

    loadGIS()
  }, [])

  function renderButton() {
    try {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: Math.min(googleBtnRef.current.offsetWidth || 320, 400),
      })
    } catch (err) {
      console.warn('[Auth] renderButton error:', err)
    }
  }

  // Re-render when mode changes or ref becomes available
  useEffect(() => {
    if (googleReady && (mode === 'login' || mode === 'signup')) {
      // Small delay to ensure ref is mounted
      setTimeout(renderButton, 100)
    }
  }, [mode, googleReady])

  // Google credential callback — no browser involved
  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      setError('Google sign-in was cancelled.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // signInWithIdToken: verifies Google token server-side, creates user
      // ALL happens in-app, zero browser involvement
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
      if (authError) throw authError

      if (data?.user) {
        await ensureProfile(data.user)
        playStepComplete()
        vibrateTap()
        const wasOnboarded = localStorage.getItem('wanda_onboarded')
        if (!wasOnboarded) {
          setShowOnboarding(true)
          setLoading(false)
        } else {
          navigate(searchParams.get('redirect') || '/dashboard', { replace: true })
        }
      }
    } catch (err) {
      console.error('[Auth] Google error:', err)
      setError('Google sign-in failed. Please use email/password instead.')
      setLoading(false)
    }
  }

  // ─── GUARDS ────────────────────────────────────────────
  if (!supabase) {
    return (
      <div className="auth-page">
        <div className="auth-card glass glass-glow">
          <div className="auth-header">
            <Link to="/" className="auth-logo"><img src="/wanda-logo.png" alt="Wanda" className="auth-logo-img" /></Link>
            <h1>Coming Soon</h1>
            <p>Authentication is being set up.</p>
          </div>
          <Link to="/" className="auth-submit" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </div>
    )
  }

  // ─── HELPERS ───────────────────────────────────────────
  const update = (field, val) => setFormData(p => ({ ...p, [field]: val }))

  function friendlyError(msg) {
    if (!msg) return 'Something went wrong. Please try again.'
    const m = msg.toLowerCase()
    if (m.includes('weak_password') || m.includes('password should contain')) return 'Password must include: uppercase (A-Z), lowercase (a-z), number (0-9), and special character (!@#$%).'
    if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password. If you signed up with Google, use the Google button above.'
    if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists')) return 'This email is already registered. Try signing in instead.'
    if (m.includes('password should be') || m.includes('at least')) return 'Password must be at least 6 characters.'
    if (m.includes('rate limit') || m.includes('too many') || m.includes('exceeded') || m.includes('security purposes')) return 'Too many attempts. Please wait a minute and try again.'
    if (m.includes('email not confirmed')) return 'Please wait a moment and try again — your account is being confirmed.'
    if (m.includes('user not found')) return 'No account found with this email. Try signing up instead.'
    if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) return 'Network error. Check your connection.'
    if (m.includes('duplicate')) return 'This email is already registered. Try signing in instead.'
    return msg
  }

  // ─── EMAIL SIGN UP ─────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    playButtonTap()

    const { email, password, username } = formData
    const avatar = localStorage.getItem('geoquiz_avatar') || '🧭'

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username || email.split('@')[0], full_name: '', avatar_url: avatar } }
      })

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already') || signUpError.message?.toLowerCase().includes('exists')) {
          try {
            const result = await signIn({ email, password })
            if (result?.user) await ensureProfile(result.user)
            playStepComplete(); vibrateTap()
            navigate('/dashboard', { replace: true })
            return
          } catch { throw new Error('This email is already registered. Use "Sign In" or reset your password.') }
        }
        throw signUpError
      }

      playStepComplete(); vibrateTap()

      if (data?.session?.user) {
        await ensureProfile(data.session.user)
        const wasOnboarded = localStorage.getItem('wanda_onboarded')
        if (!wasOnboarded) { setAuthSession(data.session); setShowOnboarding(true); setLoading(false) }
        else navigate('/dashboard', { replace: true })
        return
      }

      if (data?.user) {
        await new Promise(r => setTimeout(r, 800))
        try {
          const result = await signIn({ email, password })
          if (result?.user) await ensureProfile(result.user)
          const wasOnboarded = localStorage.getItem('wanda_onboarded')
          if (!wasOnboarded) { setAuthSession({ user: result.user }); setShowOnboarding(true); setLoading(false) }
          else navigate(searchParams.get('redirect') || '/dashboard', { replace: true })
          return
        } catch {
          await new Promise(r => setTimeout(r, 1200))
          try {
            const result = await signIn({ email, password })
            if (result?.user) await ensureProfile(result.user)
            navigate('/dashboard', { replace: true })
            return
          } catch {
            setSuccess('Account created! Please sign in with your credentials.')
            setMode('login'); setLoading(false)
          }
        }
      }
    } catch (err) { setError(friendlyError(err.message)); setLoading(false) }
  }

  // ─── EMAIL SIGN IN ─────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    playButtonTap()

    try {
      const result = await signIn({ email: formData.email, password: formData.password })
      if (result?.user) await ensureProfile(result.user)
      playStepComplete(); vibrateTap()
      navigate(searchParams.get('redirect') || '/dashboard', { replace: true })
    } catch (err) {
      const msg = err.message?.toLowerCase() || ''
      if (msg.includes('email not confirmed')) {
        try {
          await supabase.auth.signUp({ email: formData.email, password: formData.password })
          await new Promise(r => setTimeout(r, 800))
          const result = await signIn({ email: formData.email, password: formData.password })
          if (result?.user) await ensureProfile(result.user)
          playStepComplete(); vibrateTap()
          navigate(searchParams.get('redirect') || '/dashboard', { replace: true })
          return
        } catch { setError('Your email needs confirmation. Please try again.') }
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. If you signed up with Google, please use the "Continue with Google" button above.')
      } else { setError(friendlyError(err.message)) }
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null); playButtonTap()
    try {
      await resetPassword(formData.email)
      setSuccess('Check your email for a password reset link!')
    } catch (err) { setError(friendlyError(err.message)) }
    finally { setLoading(false) }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null); playButtonTap()
    try {
      await updatePassword(formData.newPassword)
      setSuccess('Password updated!')
      setTimeout(() => { setMode('login'); setSuccess(null) }, 2000)
    } catch (err) { setError(friendlyError(err.message)) }
    finally { setLoading(false) }
  }

  function handleSubmit(e) {
    if (mode === 'signup') return handleSignUp(e)
    if (mode === 'login') return handleSignIn(e)
    if (mode === 'forgot') return handleForgotPassword(e)
    if (mode === 'reset') return handleResetPassword(e)
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false)
    localStorage.setItem('wanda_onboarded', '1')
    const redirectTo = searchParams.get('redirect')
    navigate(redirectTo || '/dashboard', { replace: true })
  }

  if (showOnboarding) {
    return <SignUpOnboarding username={formData.username} session={authSession} onComplete={handleOnboardingComplete} />
  }

  // ─── RENDER ────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card glass glass-glow">
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

        {success && (
          <div className="auth-alert auth-alert-success">
            <CheckmarkCircleRegular style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            {success}
          </div>
        )}

        {error && <div className="auth-alert auth-alert-error">{error}</div>}

        {/* GOOGLE SIGN-IN — in-app only, NO browser opens */}
        {(mode === 'login' || mode === 'signup') && GOOGLE_CLIENT_ID && (
          <>
            <div
              ref={googleBtnRef}
              className="auth-google-container"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '44px',
                margin: '0.5rem 0',
              }}
            >
              {!googleReady && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Loading Google sign-in...
                </span>
              )}
            </div>
            <div className="auth-divider"><span>or use email</span></div>
          </>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label><PersonRegular fontSize={16} /> Username</label>
              <input type="text" placeholder="Choose a name" value={formData.username}
                onChange={e => update('username', e.target.value)} required minLength={2} />
            </div>
          )}

          {mode !== 'reset' && (
            <div className="auth-field">
              <label><MailRegular fontSize={16} /> Email</label>
              <input type="email" placeholder="name@example.com" value={formData.email}
                onChange={e => update('email', e.target.value)} required />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="auth-field">
              <label><LockClosedRegular fontSize={16} /> Password</label>
              <div className="auth-pw-wrap">
                <input type={showPw ? 'text' : 'password'} placeholder="Aa1! (upper, lower, number, symbol)" value={formData.password}
                  onChange={e => update('password', e.target.value)} required minLength={6} />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? <EyeOffRegular fontSize={18} /> : <EyeRegular fontSize={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="auth-field">
              <label><LockClosedRegular fontSize={16} /> New Password</label>
              <input type="password" placeholder="Enter new password" value={formData.newPassword}
                onChange={e => update('newPassword', e.target.value)} required minLength={6} />
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-forgot-row">
              <button type="button" onClick={() => { setMode('forgot'); setError(null); setSuccess(null) }} className="auth-link-btn">Forgot password?</button>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' :
             mode === 'login' ? 'Sign In' :
             mode === 'signup' ? 'Create Account' :
             mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
            {!loading && <ArrowRightRegular fontSize={18} />}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && <p>Don't have an account? <button onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}>Sign up free</button></p>}
          {mode === 'signup' && <p>Already have an account? <button onClick={() => { setMode('login'); setError(null); setSuccess(null) }}>Log in</button></p>}
          {(mode === 'forgot' || mode === 'reset') && <p><button onClick={() => { setMode('login'); setError(null); setSuccess(null) }}>Back to login</button></p>}
        </div>

        <div className="auth-security-badge">
          <ShieldCheckmarkRegular fontSize={14} />
          <span>Wanda {APP_VERSION}</span>
        </div>
      </div>

      <div className="auth-visual">
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <img src="/wanda-logo.png" alt="" style={{ height: 56, marginBottom: '1.5rem', filter: 'brightness(10)' }} />
          <div className="auth-quote">"The world is a book and those who do not travel read only one page."</div>
          <div className="auth-quote-author">— Augustine of Hippo</div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
            <span>🗺️ Explore Nigeria</span>
            <span>🏆 Earn Rewards</span>
            <span>🤝 Community</span>
          </div>
        </div>
      </div>
    </div>
  )
}
