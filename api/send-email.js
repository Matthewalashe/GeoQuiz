/**
 * Vercel Serverless Function — Send branded Wanda emails via Resend API
 * POST /api/send-email
 * Body: { type: 'welcome' | 'listing_approved', to: string, data: object }
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'Matthew Alashe <hello@visitnaija.online>'
const SITE_URL = 'https://visitnaija.online'

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function baseTemplate(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Wanda</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background: #0f0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #1a1a2e; border-radius: 16px; border: 1px solid rgba(200,150,62,0.2); overflow: hidden; }
    .header { text-align: center; padding: 32px 24px 16px; background: linear-gradient(135deg, rgba(200,150,62,0.15), rgba(26,26,46,0.95)); }
    .logo { height: 48px; margin-bottom: 12px; }
    .header h1 { color: #C8963E; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .header p { color: #94a3b8; font-size: 14px; margin: 0; }
    .body { padding: 28px 24px; color: #e2e8f0; font-size: 15px; line-height: 1.7; }
    .body p { margin: 0 0 16px; }
    .body strong { color: #C8963E; }
    .signature { margin-top: 8px; }
    .signature .name { color: #C8963E; font-weight: 600; }
    .signature .title { color: #94a3b8; font-size: 13px; }
    .features { margin: 24px 0; }
    .feature { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .feature:last-child { border-bottom: none; }
    .feature .icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; }
    .feature .text { color: #e2e8f0; font-size: 14px; }
    .feature .text strong { display: block; color: #fff; margin-bottom: 2px; }
    .feature .text span { color: #94a3b8; font-size: 13px; }
    .cta-wrap { text-align: center; padding: 8px 24px 28px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #C8963E, #E8C97A); color: #1a1a2e; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .footer { text-align: center; padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer p { color: #64748b; font-size: 12px; margin: 0 0 4px; }
    .footer a { color: #C8963E; text-decoration: none; }
    .badge { display: inline-block; background: rgba(200,150,62,0.15); color: #C8963E; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; border: 1px solid rgba(200,150,62,0.25); margin-bottom: 12px; }
    .listing-card { background: rgba(200,150,62,0.08); border: 1px solid rgba(200,150,62,0.15); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
    .listing-card h3 { color: #C8963E; font-size: 18px; margin: 0 0 4px; }
    .listing-card .type { color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>Wanda — Experience Nigeria</p>
      <p>Built with ❤️ by <a href="${SITE_URL}">WhiteArts Technologies</a></p>
    </div>
  </div>
</body>
</html>`
}

function welcomeEmail(data) {
  const username = escapeHtml(data.username || 'Explorer')
  const subject = `Welcome to Wanda, ${data.username || 'Explorer'}! 🎉`
  const preheader = 'A better way to discover Nigeria — explore, play, connect.'

  const html = baseTemplate(`
    <div class="header">
      <img src="${SITE_URL}/wanda-logo.png" alt="Wanda" class="logo">
      <h1>Welcome to Wanda! 🎉</h1>
      <p>We're glad you're here, ${username}</p>
    </div>
    <div class="body">
      <p>Hello,</p>
      <p>We built Wanda because we wanted a better way to discover Nigeria. A simple, fast, and beautiful way to explore places, find trusted vendors, shop local, and experience the culture — all in one app.</p>
      <p>We're just getting started, and having you here means a lot.</p>

      <div class="features">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🗺️</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Explore Lagos</strong><span style="color:#94a3b8;font-size:13px">Restaurants, hotels, beaches, parks & hidden gems</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🎮</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Play Geography Games</strong><span style="color:#94a3b8;font-size:13px">8 game modes — quiz, trivia, word games, puzzles & more</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🏆</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Earn XP & Climb Leagues</strong><span style="color:#94a3b8;font-size:13px">Bronze → Silver → Gold → Diamond — compete on the leaderboard</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">📍</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">List Your Business Free</strong><span style="color:#94a3b8;font-size:13px">Get discovered by thousands of users across Nigeria</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🎟️</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Events & Wanda Pass</strong><span style="color:#94a3b8;font-size:13px">Discover events, RSVP, and access exclusive experiences</span></td>
              </tr></table>
            </td>
          </tr>
        </table>
      </div>

      <p>Explore freely,</p>
      <div class="signature">
        <div class="name">Matthew Alashe</div>
        <div class="title">Founder, Wanda</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${SITE_URL}/explore" class="cta">Start Exploring →</a>
    </div>
  `, preheader)

  return { subject, html }
}

function approvalEmail(data) {
  const name = escapeHtml(data.name || 'Your listing')
  const listingType = data.listingType === 'handyman' ? '🔧 Handyman' : '📍 Business'
  const typeLabel = data.listingType === 'handyman' ? 'handyman profile' : 'business listing'
  const subject = `Your ${typeLabel} "${data.name}" is now live on Wanda! ✅`
  const preheader = `Great news — "${data.name}" has been approved and is visible to thousands of users.`
  const listingUrl = `${SITE_URL}/business/${data.listingId || ''}`

  const html = baseTemplate(`
    <div class="header">
      <img src="${SITE_URL}/wanda-logo.png" alt="Wanda" class="logo">
      <span class="badge">${listingType}</span>
      <h1>You're Live on Wanda! ✅</h1>
      <p>Your ${typeLabel} has been approved</p>
    </div>
    <div class="body">
      <p>Great news! Your listing has been reviewed and approved by our team.</p>

      <div class="listing-card">
        <h3>${name}</h3>
        <div class="type">${listingType} · Now visible to all Wanda users</div>
      </div>

      <p>People across Lagos can now find you when they search on Wanda. Here's what else you can do:</p>

      <div class="features">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">📸</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Add Photos</strong><span style="color:#94a3b8;font-size:13px">Upload photos of your work or business to attract more customers</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">📤</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Share Your Profile</strong><span style="color:#94a3b8;font-size:13px">Send your Wanda listing link to friends and customers</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🎮</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Play Games & Earn Rewards</strong><span style="color:#94a3b8;font-size:13px">Geography quizzes, trivia, puzzles — earn XP and coins</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">🗺️</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Explore Lagos</strong><span style="color:#94a3b8;font-size:13px">Discover restaurants, hotels, beaches & hidden gems near you</span></td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">💬</td>
                <td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">Join the Community</strong><span style="color:#94a3b8;font-size:13px">Connect with fellow Nigerians — share tips, post reviews, chat</span></td>
              </tr></table>
            </td>
          </tr>
        </table>
      </div>

      <p>Thank you for being part of Wanda. Together, we're building a better way to discover Nigeria.</p>
      <div class="signature">
        <div class="name">Matthew Alashe</div>
        <div class="title">Founder, Wanda</div>
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${listingUrl}" class="cta">View Your Listing →</a>
    </div>
  `, preheader)

  return { subject, html }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, to, data } = req.body || {}

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields: type, to' })
  }

  if (!RESEND_API_KEY) {
    console.warn('[send-email] RESEND_API_KEY not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  let email
  try {
    if (type === 'welcome') {
      email = welcomeEmail(data || {})
    } else if (type === 'listing_approved') {
      email = approvalEmail(data || {})
    } else {
      return res.status(400).json({ error: `Unknown email type: ${type}` })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: email.subject,
        html: email.html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[send-email] Resend error:', result)
      return res.status(response.status).json({ error: result.message || 'Email send failed' })
    }

    return res.status(200).json({ success: true, id: result.id })
  } catch (err) {
    console.error('[send-email] Error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
