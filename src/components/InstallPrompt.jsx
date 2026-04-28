import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    const dismissed = localStorage.getItem('pwa_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa_dismissed', Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="install-banner">
      <div className="install-content">
        <span className="install-icon">📱</span>
        <div>
          <strong>Install GeoQuiz</strong>
          <p>Add to home screen for the best experience</p>
        </div>
      </div>
      <div className="install-actions">
        <button className="btn btn-primary btn-sm" onClick={install}>Install</button>
        <button className="btn-dismiss" onClick={dismiss}>Not now</button>
      </div>
    </div>
  )
}
