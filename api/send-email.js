/**
 * Vercel Serverless Function — Send branded Wanda emails via Resend API
 * POST /api/send-email
 * GET  /api/send-email  → health check
 * Body: { type: 'welcome' | 'listing_approved', to: string, data: object }
 */

const https = require('https')

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
// Resend free tier only allows sending from onboarding@resend.dev unless domain is verified.
// Once visitnaija.online is verified in Resend dashboard, change to: 'Matthew Alashe <hello@visitnaija.online>'
const FROM_EMAIL = 'Matthew Alashe <onboarding@resend.dev>'
const SITE_URL = 'https://visitnaija.online'

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sendResendEmail(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, data: parsed })
          } else {
            resolve({ ok: false, status: res.statusCode, data: parsed })
          }
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, data: { raw: data } })
        }
      })
    })
    req.on('error', (e) => reject(e))
    req.write(body)
    req.end()
  })
}

function baseTemplate(content, preheader) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>Wanda</title>'
    + (preheader ? '<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">' + escapeHtml(preheader) + '</span>' : '')
    + '<style>'
    + 'body{margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}'
    + '.wrapper{max-width:600px;margin:0 auto;padding:24px 16px}'
    + '.card{background:#1a1a2e;border-radius:16px;border:1px solid rgba(200,150,62,0.2);overflow:hidden}'
    + '.header{text-align:center;padding:32px 24px 16px;background:linear-gradient(135deg,rgba(200,150,62,0.15),rgba(26,26,46,0.95))}'
    + '.logo{height:48px;margin-bottom:12px}'
    + '.header h1{color:#C8963E;font-size:22px;font-weight:700;margin:0 0 4px}'
    + '.header p{color:#94a3b8;font-size:14px;margin:0}'
    + '.body{padding:28px 24px;color:#e2e8f0;font-size:15px;line-height:1.7}'
    + '.body p{margin:0 0 16px}'
    + '.sig .nm{color:#C8963E;font-weight:600}'
    + '.sig .ti{color:#94a3b8;font-size:13px}'
    + '.cta-wrap{text-align:center;padding:8px 24px 28px}'
    + '.cta{display:inline-block;background:linear-gradient(135deg,#C8963E,#E8C97A);color:#1a1a2e;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px}'
    + '.ftr{text-align:center;padding:20px 24px;border-top:1px solid rgba(255,255,255,0.05)}'
    + '.ftr p{color:#64748b;font-size:12px;margin:0 0 4px}'
    + '.ftr a{color:#C8963E;text-decoration:none}'
    + '.badge{display:inline-block;background:rgba(200,150,62,0.15);color:#C8963E;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;border:1px solid rgba(200,150,62,0.25);margin-bottom:12px}'
    + '.lc{background:rgba(200,150,62,0.08);border:1px solid rgba(200,150,62,0.15);border-radius:12px;padding:16px;margin:16px 0;text-align:center}'
    + '.lc h3{color:#C8963E;font-size:18px;margin:0 0 4px}'
    + '.lc .tp{color:#94a3b8;font-size:13px}'
    + '</style></head><body>'
    + '<div class="wrapper"><div class="card">'
    + content
    + '</div>'
    + '<div class="ftr"><p>Wanda \u2014 Experience Nigeria</p>'
    + '<p>Built with \u2764\ufe0f by <a href="' + SITE_URL + '">WhiteArts Technologies</a></p>'
    + '</div></div></body></html>'
}

function featureRow(emoji, title, desc, isLast) {
  var border = isLast ? '' : 'border-bottom:1px solid rgba(255,255,255,0.05);'
  return '<tr><td style="padding:10px 0;' + border + '">'
    + '<table cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td style="font-size:20px;width:28px;text-align:center;vertical-align:top;padding-right:12px">' + emoji + '</td>'
    + '<td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">' + escapeHtml(title) + '</strong>'
    + '<span style="color:#94a3b8;font-size:13px">' + escapeHtml(desc) + '</span></td>'
    + '</tr></table></td></tr>'
}

function welcomeEmail(data) {
  var username = escapeHtml(data.username || 'Explorer')
  var subject = 'Welcome to Wanda, ' + (data.username || 'Explorer') + '! \ud83c\udf89'

  var features = '<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    + featureRow('\ud83d\uddfa\ufe0f', 'Explore Lagos', 'Restaurants, hotels, beaches, parks & hidden gems', false)
    + featureRow('\ud83c\udfae', 'Play Geography Games', '8 game modes \u2014 quiz, trivia, word games, puzzles & more', false)
    + featureRow('\ud83c\udfc6', 'Earn XP & Climb Leagues', 'Bronze \u2192 Silver \u2192 Gold \u2192 Diamond \u2014 compete on the leaderboard', false)
    + featureRow('\ud83d\udccd', 'List Your Business Free', 'Get discovered by thousands of users across Nigeria', false)
    + featureRow('\ud83c\udf9f\ufe0f', 'Events & Wanda Pass', 'Discover events, RSVP, and access exclusive experiences', true)
    + '</table>'

  var html = baseTemplate(
    '<div class="header">'
    + '<img src="' + SITE_URL + '/wanda-logo.png" alt="Wanda" class="logo">'
    + '<h1>Welcome to Wanda! \ud83c\udf89</h1>'
    + '<p>We\'re glad you\'re here, ' + username + '</p>'
    + '</div>'
    + '<div class="body">'
    + '<p>Hello,</p>'
    + '<p>We built Wanda because we wanted a better way to discover Nigeria. A simple, fast, and beautiful way to explore places, find trusted vendors, shop local, and experience the culture \u2014 all in one app.</p>'
    + '<p>We\'re just getting started, and having you here means a lot.</p>'
    + '<div style="margin:24px 0">' + features + '</div>'
    + '<p>Explore freely,</p>'
    + '<div class="sig"><div class="nm">Matthew Alashe</div><div class="ti">Founder, Wanda</div></div>'
    + '</div>'
    + '<div class="cta-wrap"><a href="' + SITE_URL + '/explore" class="cta">Start Exploring \u2192</a></div>',
    'A better way to discover Nigeria \u2014 explore, play, connect.'
  )

  return { subject: subject, html: html }
}

function approvalEmail(data) {
  var name = escapeHtml(data.name || 'Your listing')
  var listingType = data.listingType === 'handyman' ? '\ud83d\udd27 Handyman' : '\ud83d\udccd Business'
  var typeLabel = data.listingType === 'handyman' ? 'handyman profile' : 'business listing'
  var subject = 'Your ' + typeLabel + ' "' + (data.name || '') + '" is now live on Wanda! \u2705'
  var listingUrl = SITE_URL + '/business/' + (data.listingId || '')

  var features = '<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    + featureRow('\ud83d\udcf8', 'Add Photos', 'Upload photos of your work or business to attract more customers', false)
    + featureRow('\ud83d\udce4', 'Share Your Profile', 'Send your Wanda listing link to friends and customers', false)
    + featureRow('\ud83c\udfae', 'Play Games & Earn Rewards', 'Geography quizzes, trivia, puzzles \u2014 earn XP and coins', false)
    + featureRow('\ud83d\uddfa\ufe0f', 'Explore Lagos', 'Discover restaurants, hotels, beaches & hidden gems near you', false)
    + featureRow('\ud83d\udcac', 'Join the Community', 'Connect with fellow Nigerians \u2014 share tips, post reviews, chat', true)
    + '</table>'

  var html = baseTemplate(
    '<div class="header">'
    + '<img src="' + SITE_URL + '/wanda-logo.png" alt="Wanda" class="logo">'
    + '<span class="badge">' + listingType + '</span>'
    + '<h1>You\'re Live on Wanda! \u2705</h1>'
    + '<p>Your ' + typeLabel + ' has been approved</p>'
    + '</div>'
    + '<div class="body">'
    + '<p>Great news! Your listing has been reviewed and approved by our team.</p>'
    + '<div class="lc"><h3>' + name + '</h3><div class="tp">' + listingType + ' \u00b7 Now visible to all Wanda users</div></div>'
    + '<p>People across Lagos can now find you when they search on Wanda. Here\'s what else you can do:</p>'
    + '<div style="margin:24px 0">' + features + '</div>'
    + '<p>Thank you for being part of Wanda. Together, we\'re building a better way to discover Nigeria.</p>'
    + '<div class="sig"><div class="nm">Matthew Alashe</div><div class="ti">Founder, Wanda</div></div>'
    + '</div>'
    + '<div class="cta-wrap"><a href="' + listingUrl + '" class="cta">View Your Listing \u2192</a></div>',
    'Great news \u2014 "' + (data.name || '') + '" has been approved and is visible to thousands of users.'
  )

  return { subject: subject, html: html }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasKey: !!RESEND_API_KEY,
      from: FROM_EMAIL,
      keyPrefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 6) + '...' : 'NOT_SET',
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    var body = req.body || {}
    var type = body.type
    var to = body.to
    var data = body.data || {}

    if (!to || !type) {
      return res.status(400).json({ error: 'Missing required fields: type, to' })
    }

    if (!RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY not set in environment')
      return res.status(500).json({ error: 'Email service not configured — RESEND_API_KEY missing' })
    }

    var email
    if (type === 'welcome') {
      email = welcomeEmail(data)
    } else if (type === 'listing_approved') {
      email = approvalEmail(data)
    } else {
      return res.status(400).json({ error: 'Unknown email type: ' + type })
    }

    var payload = {
      from: FROM_EMAIL,
      to: [to],
      subject: email.subject,
      html: email.html,
    }

    console.log('[send-email] Sending', type, 'email to', to)

    var result = await sendResendEmail(payload)

    console.log('[send-email] Resend response:', JSON.stringify(result.data))

    if (!result.ok) {
      return res.status(result.status || 500).json({
        error: result.data.message || 'Email send failed',
        statusCode: result.data.statusCode,
        detail: result.data,
      })
    }

    return res.status(200).json({ success: true, id: result.data.id })
  } catch (err) {
    console.error('[send-email] Caught error:', err.message, err.stack)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
