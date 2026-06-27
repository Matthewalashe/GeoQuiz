import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ArrowLeftRegular, ArrowDownloadRegular, ShareRegular } from '@fluentui/react-icons'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// Real QR code via QR Server API — returns a Promise
function drawQRCode(ctx, x, y, size, url) {
  return new Promise((resolve) => {
    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'
    qrImg.onload = () => {
      // White rounded background
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(x - 6, y - 6, size + 12, size + 12, 8)
      ctx.fill()
      ctx.drawImage(qrImg, x, y, size, size)
      resolve()
    }
    qrImg.onerror = () => {
      // Fallback: draw URL as text if API fails
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(x - 6, y - 6, size + 12, size + 12, 8)
      ctx.fill()
      ctx.fillStyle = '#1a1a2e'
      ctx.font = '600 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Scan at:', x + size / 2, y + size / 2 - 8)
      ctx.font = '500 9px Inter, sans-serif'
      ctx.fillText(url, x + size / 2, y + size / 2 + 8)
      resolve()
    }
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&margin=0&data=${encodeURIComponent(url)}`
  })
}

// Canvas text wrapping helper
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  let linesDrawn = 0
  for (let i = 0; i < words.length; i++) {
    const test = line + (line ? ' ' : '') + words[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = words[i]
      currentY += lineHeight
      linesDrawn++
      if (linesDrawn >= maxLines - 1) {
        // Last line — join remaining words and truncate
        const remaining = [line, ...words.slice(i + 1)].join(' ')
        if (ctx.measureText(remaining).width > maxWidth) {
          let truncated = remaining
          while (ctx.measureText(truncated + '\u2026').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          ctx.fillText(truncated + '\u2026', x, currentY)
        } else {
          ctx.fillText(remaining, x, currentY)
        }
        return currentY + lineHeight - y
      }
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, currentY)
  return currentY + lineHeight - y
}

export default function EventPass() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [event, setEvent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase?.auth.getSession()
      if (!session?.session) return navigate(`/auth?redirect=/pass/${slug}/ticket`)

      const { data: prof } = await supabase.from('profiles').select('*')
        .eq('id', session.session.user.id).single()
      setProfile(prof)

      const { data: ev } = await supabase.from('events').select('*').eq('slug', slug).single()
      setEvent(ev)
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (!event || !profile || !canvasRef.current) return
    renderPass()
  }, [event, profile])

  function renderPass() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = 400, H = 740
    canvas.width = W * 2
    canvas.height = H * 2
    ctx.scale(2, 2)

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#1a1a2e')
    bg.addColorStop(0.4, '#16213e')
    bg.addColorStop(1, '#0f3460')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle dot pattern overlay
    ctx.fillStyle = 'rgba(200,150,62,0.03)'
    for (let px = 0; px < W; px += 20) {
      for (let py = 0; py < H; py += 20) {
        ctx.beginPath()
        ctx.arc(px, py, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Top holographic stripe
    const holo = ctx.createLinearGradient(0, 0, W, 0)
    holo.addColorStop(0, '#C8963E')
    holo.addColorStop(0.3, '#e8c86a')
    holo.addColorStop(0.5, '#C8963E')
    holo.addColorStop(0.7, '#e8c86a')
    holo.addColorStop(1, '#C8963E')
    ctx.fillStyle = holo
    ctx.fillRect(0, 0, W, 6)

    // Ticket number (top right)
    const ticketNum = `#${(profile?.id || 'guest').slice(0, 6).toUpperCase()}`
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '500 10px "Space Grotesk", Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(ticketNum, W - 24, 24)

    // Event image area (top section)
    const imgH = 170
    if (event.image_url) {
      // Shimmer placeholder while image loads
      const shimmer = ctx.createLinearGradient(20, 20, W - 20, 20)
      shimmer.addColorStop(0, 'rgba(200,150,62,0.08)')
      shimmer.addColorStop(0.5, 'rgba(200,150,62,0.15)')
      shimmer.addColorStop(1, 'rgba(200,150,62,0.08)')
      ctx.fillStyle = shimmer
      ctx.beginPath()
      ctx.roundRect(20, 20, W - 40, imgH, 10)
      ctx.fill()
    }

    const yStart = event.image_url ? 20 + imgH + 20 : 40

    // "WANDA PASS" header
    ctx.fillStyle = '#C8963E'
    ctx.font = '700 11px "Space Grotesk", Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('\u2726  W A N D A   P A S S  \u2726', W / 2, yStart)

    // "ADMIT ONE" decorative text
    ctx.fillStyle = 'rgba(200,150,62,0.12)'
    ctx.font = '700 9px "Space Grotesk", Inter, sans-serif'
    ctx.fillText('A D M I T   O N E', W / 2, yStart + 16)

    // Event title
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 22px "Space Grotesk", Inter, sans-serif'
    ctx.textAlign = 'center'
    const titleH = wrapText(ctx, event.title, W / 2, yStart + 40, W - 60, 28, 2)

    // Category badge
    ctx.fillStyle = 'rgba(200,150,62,0.2)'
    const catText = event.category || 'Event'
    ctx.font = '600 11px Inter, sans-serif'
    const catW = ctx.measureText(catText).width + 24
    const catY = yStart + 24 + titleH + 6
    ctx.beginPath()
    ctx.roundRect((W - catW) / 2, catY, catW, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#C8963E'
    ctx.fillText(catText, W / 2, catY + 16)

    // Dashed separator with notches
    const sep1Y = catY + 40
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(30, sep1Y)
    ctx.lineTo(W - 30, sep1Y)
    ctx.stroke()
    ctx.setLineDash([])
    // Notch circles
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.arc(0, sep1Y, 10, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(W, sep1Y, 10, 0, Math.PI * 2); ctx.fill()

    // Details section
    const detailY = yStart + 116
    ctx.textAlign = 'left'

    // Date
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '500 10px Inter, sans-serif'
    ctx.fillText('DATE', 40, detailY)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 14px Inter, sans-serif'
    ctx.fillText(formatDate(event.start_date), 40, detailY + 18)

    // Time
    if (event.start_time) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = '500 10px Inter, sans-serif'
      ctx.fillText('TIME', W / 2, detailY)
      ctx.fillStyle = '#ffffff'
      ctx.font = '600 14px Inter, sans-serif'
      ctx.fillText(`${event.start_time}${event.end_time ? ' \u2014 ' + event.end_time : ''}`, W / 2, detailY + 18)
    }

    // Venue
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '500 10px Inter, sans-serif'
    ctx.fillText('VENUE', 40, detailY + 46)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 14px Inter, sans-serif'
    const venue = event.venue_type === 'virtual' ? 'Online Event' : (event.venue_name || 'TBA')
    wrapText(ctx, venue, 40, detailY + 64, W / 2 - 50, 16, 2)

    // Price
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '500 10px Inter, sans-serif'
    ctx.fillText('PRICE', W / 2, detailY + 46)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 14px Inter, sans-serif'
    ctx.fillText(event.is_free ? 'FREE \ud83c\udf89' : `\u20a6${Number(event.price).toLocaleString()}`, W / 2, detailY + 64)

    // Dashed separator 2 with notches
    const sep2Y = detailY + 90
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.moveTo(30, sep2Y)
    ctx.lineTo(W - 30, sep2Y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.arc(0, sep2Y, 10, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(W, sep2Y, 10, 0, Math.PI * 2); ctx.fill()

    // Attendee name
    const attendeeY = detailY + 112
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '500 10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ATTENDEE', W / 2, attendeeY)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 18px "Space Grotesk", Inter, sans-serif'
    const attendeeName = profile?.display_name || profile?.full_name || 'Guest'
    ctx.fillText(attendeeName, W / 2, attendeeY + 24)

    // QR Code — real scannable QR linking to event RSVP page
    const qrSize = 130
    const qrX = (W - qrSize) / 2
    const qrY = attendeeY + 44
    const qrUrl = `https://visitnaija.online/pass/${event.slug}`
    drawQRCode(ctx, qrX, qrY, qrSize, qrUrl)

    // Scan instruction
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '400 10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Scan to verify', W / 2, qrY + qrSize + 16)

    // Bottom holographic stripe
    ctx.fillStyle = holo
    ctx.fillRect(0, H - 6, W, 6)

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '400 9px Inter, sans-serif'
    ctx.fillText('visitnaija.online', W / 2, H - 16)

    // Load and draw event image if available
    if (event.image_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(20, 20, W - 40, imgH, 10)
        ctx.clip()
        const imgRatio = img.width / img.height
        const boxRatio = (W - 40) / imgH
        let sw, sh, sx, sy
        if (imgRatio > boxRatio) {
          sh = img.height; sw = sh * boxRatio
          sx = (img.width - sw) / 2; sy = 0
        } else {
          sw = img.width; sh = sw / boxRatio
          sx = 0; sy = (img.height - sh) / 2
        }
        ctx.drawImage(img, sx, sy, sw, sh, 20, 20, W - 40, imgH)
        ctx.restore()
      }
      img.src = event.image_url
    }
  }

  function downloadPass() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `wanda-pass-${event.slug}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  async function sharePass() {
    if (!canvasRef.current) return
    const url = `https://visitnaija.online/pass/${event.slug}`
    const text = `\ud83c\udf9f\ufe0f I'm going to ${event.title}! Join me \ud83d\udc47`
    // Try sharing the canvas image directly
    try {
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'))
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `wanda-pass-${event.slug}.png`, { type: 'image/png' })
        const shareData = { title: event.title, text, url, files: [file] }
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return
        }
      }
    } catch (e) { /* fallback below */ }
    // Fallback: share text + link
    if (navigator.share) {
      navigator.share({ title: event.title, text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`)
    }
  }

  if (loading) return (
    <div className="ed-loading">
      <div className="ed-spinner" />
      <p>Generating your pass...</p>
    </div>
  )

  return (
    <div className="ep-wrapper">
      <div className="ep-header">
        <button className="ce-back" onClick={() => navigate(`/pass/${slug}`)}>
          <ArrowLeftRegular fontSize={18} />
        </button>
        <h2>Your Event Pass</h2>
      </div>
      <div className="ep-canvas-wrap">
        <canvas ref={canvasRef} className="ep-canvas" />
      </div>
      <div className="ep-actions">
        <button className="btn btn-primary ep-download" onClick={downloadPass}>
          <ArrowDownloadRegular fontSize={18} /> Download Pass
        </button>
        <button className="btn btn-outline ep-share" onClick={sharePass}>
          <ShareRegular fontSize={18} /> Share Pass
        </button>
      </div>
      <p className="ep-note">Screenshot or download to save your digital ticket</p>

      <style>{`
        .ep-wrapper {
          max-width: 480px; margin: 0 auto; padding: 1.5rem 1.25rem 6rem;
          font-family: var(--font-body); color: var(--text); animation: ep-fadeIn 0.5s ease;
        }
        @keyframes ep-fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ep-header {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
        }
        .ep-header h2 {
          font-family: var(--font-head); font-size: 1.3rem; font-weight: 700; margin: 0;
        }
        .ep-canvas-wrap {
          display: flex; justify-content: center; margin-bottom: 1.5rem;
          animation: ep-floatIn 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes ep-floatIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ep-canvas {
          width: 100%; max-width: 400px; height: auto;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .ep-actions {
          display: flex; gap: 0.75rem; margin-bottom: 0.75rem;
        }
        .ep-download, .ep-share {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; padding: 0.85rem; font-size: 0.95rem; font-weight: 700;
          font-family: var(--font-head); border-radius: 12px;
        }
        .ep-note {
          text-align: center; font-size: 0.8rem; color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}
