import https from 'https';

var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var FROM_EMAIL = 'Matthew Alashe <onboarding@resend.dev>';
var SITE_URL = 'https://visitnaija.online';

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function postResend(payload) {
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify(payload);
    var opts = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(opts, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString();
        try {
          var parsed = JSON.parse(raw);
          resolve({ ok: res.statusCode < 300, status: res.statusCode, data: parsed });
        } catch(e) {
          resolve({ ok: false, status: res.statusCode, data: { raw: raw } });
        }
      });
    });
    req.on('error', function(e) { reject(e); });
    req.write(body);
    req.end();
  });
}

function buildWelcome(data) {
  var name = esc(data.username || 'Explorer');
  var subj = 'Welcome to Wanda, ' + (data.username || 'Explorer') + '!';
  var html = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif">',
    '<div style="max-width:600px;margin:0 auto;padding:24px 16px">',
    '<div style="background:#1a1a2e;border-radius:16px;border:1px solid rgba(200,150,62,0.2);overflow:hidden">',
    // Header
    '<div style="text-align:center;padding:32px 24px 16px;background:linear-gradient(135deg,rgba(200,150,62,0.15),rgba(26,26,46,0.95))">',
    '<img src="' + SITE_URL + '/wanda-logo.png" alt="Wanda" style="height:48px;margin-bottom:12px">',
    '<h1 style="color:#C8963E;font-size:22px;margin:0 0 4px">Welcome to Wanda!</h1>',
    '<p style="color:#94a3b8;font-size:14px;margin:0">We\'re glad you\'re here, ' + name + '</p>',
    '</div>',
    // Body
    '<div style="padding:28px 24px;color:#e2e8f0;font-size:15px;line-height:1.7">',
    '<p style="margin:0 0 16px">Hello,</p>',
    '<p style="margin:0 0 16px">We built Wanda because we wanted a better way to discover Nigeria. A simple, fast, and beautiful way to explore places, find trusted vendors, shop local, and experience the culture &mdash; all in one app.</p>',
    '<p style="margin:0 0 16px">We\'re just getting started, and having you here means a lot.</p>',
    // Features table
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">',
    _fRow('Explore Lagos', 'Restaurants, hotels, beaches, parks & hidden gems'),
    _fRow('Play Geography Games', '8 game modes: quiz, trivia, word games, puzzles & more'),
    _fRow('Earn XP & Climb Leagues', 'Bronze, Silver, Gold, Diamond &mdash; compete on the leaderboard'),
    _fRow('List Your Business Free', 'Get discovered by thousands of users across Nigeria'),
    _fRow('Events & Wanda Pass', 'Discover events, RSVP, and access exclusive experiences'),
    '</table>',
    '<p style="margin:0 0 8px">Explore freely,</p>',
    '<div><div style="color:#C8963E;font-weight:600">Matthew Alashe</div><div style="color:#94a3b8;font-size:13px">Founder, Wanda</div></div>',
    '</div>',
    // CTA
    '<div style="text-align:center;padding:8px 24px 28px">',
    '<a href="' + SITE_URL + '/explore" style="display:inline-block;background:linear-gradient(135deg,#C8963E,#E8C97A);color:#1a1a2e;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Start Exploring &rarr;</a>',
    '</div>',
    '</div>',
    // Footer
    '<div style="text-align:center;padding:20px 24px">',
    '<p style="color:#64748b;font-size:12px;margin:0 0 4px">Wanda &mdash; Experience Nigeria</p>',
    '<p style="color:#64748b;font-size:12px;margin:0">Built with love by <a href="' + SITE_URL + '" style="color:#C8963E;text-decoration:none">WhiteArts Technologies</a></p>',
    '</div>',
    '</div></body></html>'
  ].join('\n');
  return { subject: subj, html: html };
}

function buildApproval(data) {
  var name = esc(data.name || 'Your listing');
  var isHandyman = data.listingType === 'handyman';
  var typeLabel = isHandyman ? 'handyman profile' : 'business listing';
  var typeIcon = isHandyman ? 'Handyman' : 'Business';
  var subj = 'Your ' + typeLabel + ' "' + (data.name || '') + '" is now live on Wanda!';
  var listingUrl = SITE_URL + '/business/' + (data.listingId || '');

  var html = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif">',
    '<div style="max-width:600px;margin:0 auto;padding:24px 16px">',
    '<div style="background:#1a1a2e;border-radius:16px;border:1px solid rgba(200,150,62,0.2);overflow:hidden">',
    // Header
    '<div style="text-align:center;padding:32px 24px 16px;background:linear-gradient(135deg,rgba(200,150,62,0.15),rgba(26,26,46,0.95))">',
    '<img src="' + SITE_URL + '/wanda-logo.png" alt="Wanda" style="height:48px;margin-bottom:12px">',
    '<div style="display:inline-block;background:rgba(200,150,62,0.15);color:#C8963E;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;border:1px solid rgba(200,150,62,0.25);margin-bottom:12px">' + typeIcon + '</div>',
    '<h1 style="color:#C8963E;font-size:22px;margin:0 0 4px">You\'re Live on Wanda!</h1>',
    '<p style="color:#94a3b8;font-size:14px;margin:0">Your ' + typeLabel + ' has been approved</p>',
    '</div>',
    // Body
    '<div style="padding:28px 24px;color:#e2e8f0;font-size:15px;line-height:1.7">',
    '<p style="margin:0 0 16px">Great news! Your listing has been reviewed and approved by our team.</p>',
    '<div style="background:rgba(200,150,62,0.08);border:1px solid rgba(200,150,62,0.15);border-radius:12px;padding:16px;margin:16px 0;text-align:center">',
    '<h3 style="color:#C8963E;font-size:18px;margin:0 0 4px">' + name + '</h3>',
    '<div style="color:#94a3b8;font-size:13px">' + typeIcon + ' &middot; Now visible to all Wanda users</div>',
    '</div>',
    '<p style="margin:0 0 16px">People across Lagos can now find you when they search on Wanda. Here\'s what else you can do:</p>',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">',
    _fRow('Add Photos', 'Upload photos of your work or business to attract more customers'),
    _fRow('Share Your Profile', 'Send your Wanda listing link to friends and customers'),
    _fRow('Play Games & Earn Rewards', 'Geography quizzes, trivia, puzzles &mdash; earn XP and coins'),
    _fRow('Explore Lagos', 'Discover restaurants, hotels, beaches & hidden gems near you'),
    _fRow('Join the Community', 'Connect with fellow Nigerians &mdash; share tips, post reviews, chat'),
    '</table>',
    '<p style="margin:0 0 16px">Thank you for being part of Wanda. Together, we\'re building a better way to discover Nigeria.</p>',
    '<div><div style="color:#C8963E;font-weight:600">Matthew Alashe</div><div style="color:#94a3b8;font-size:13px">Founder, Wanda</div></div>',
    '</div>',
    // CTA
    '<div style="text-align:center;padding:8px 24px 28px">',
    '<a href="' + listingUrl + '" style="display:inline-block;background:linear-gradient(135deg,#C8963E,#E8C97A);color:#1a1a2e;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">View Your Listing &rarr;</a>',
    '</div>',
    '</div>',
    // Footer
    '<div style="text-align:center;padding:20px 24px">',
    '<p style="color:#64748b;font-size:12px;margin:0 0 4px">Wanda &mdash; Experience Nigeria</p>',
    '<p style="color:#64748b;font-size:12px;margin:0">Built with love by <a href="' + SITE_URL + '" style="color:#C8963E;text-decoration:none">WhiteArts Technologies</a></p>',
    '</div>',
    '</div></body></html>'
  ].join('\n');
  return { subject: subj, html: html };
}

function _fRow(title, desc) {
  return '<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">'
    + '<table cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td style="width:8px;vertical-align:top;padding-right:12px;color:#C8963E;font-weight:bold">&bull;</td>'
    + '<td style="color:#e2e8f0;font-size:14px"><strong style="color:#fff;display:block;margin-bottom:2px">' + esc(title) + '</strong>'
    + '<span style="color:#94a3b8;font-size:13px">' + esc(desc) + '</span></td>'
    + '</tr></table></td></tr>';
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Health check
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      hasKey: !!RESEND_API_KEY,
      from: FROM_EMAIL,
      keyPrefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + '...' : 'NOT_SET'
    });
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  var body = req.body || {};
  var type = body.type;
  var to = body.to;
  var data = body.data || {};

  if (!to || !type) { res.status(400).json({ error: 'Missing: type, to' }); return; }
  if (!RESEND_API_KEY) { res.status(500).json({ error: 'RESEND_API_KEY not set' }); return; }

  var email;
  if (type === 'welcome') {
    email = buildWelcome(data);
  } else if (type === 'listing_approved') {
    email = buildApproval(data);
  } else {
    res.status(400).json({ error: 'Unknown type: ' + type }); return;
  }

  var payload = {
    from: FROM_EMAIL,
    to: [to],
    subject: email.subject,
    html: email.html
  };

  console.log('[send-email] Sending ' + type + ' to ' + to);

  postResend(payload)
    .then(function(result) {
      console.log('[send-email] Resend responded: ' + result.status + ' ' + JSON.stringify(result.data));
      if (result.ok) {
        res.status(200).json({ success: true, id: result.data.id });
      } else {
        res.status(result.status || 500).json({ error: result.data.message || 'Failed', detail: result.data });
      }
    })
    .catch(function(err) {
      console.error('[send-email] Error: ' + err.message);
      res.status(500).json({ error: err.message });
    });
}
