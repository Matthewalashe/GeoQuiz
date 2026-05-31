import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts, fetchReplies, createPost, toggleLike, reportPost, supabase } from '../lib/supabase.js'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'
import {
  HeartRegular,
  HeartFilled,
  ChatRegular,
  ShareRegular,
  MoreHorizontalRegular,
  CheckmarkCircleRegular,
  FlagRegular,
  SendRegular
} from '@fluentui/react-icons'

// Basic content filter
const BLOCKED = /\b(fuck|shit|ass|bitch|nigga|nigger|dick|pussy|cock|cunt|bastard|damn|idiot|stupid|kill|die)\b/gi
const URL_PATTERN = /(https?:\/\/[^\s]+)/gi

function sanitize(text) {
  let clean = text.replace(BLOCKED, '***')
  clean = clean.replace(URL_PATTERN, '[link removed]')
  return clean.trim().slice(0, 500)
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function PostItem({ post, username, userId, profile, isAuthenticated, onLike, onReport }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const liked = (post.likes || []).includes(username)
  const likeCount = (post.likes || []).length
  const replyCount = post.reply_count || 0
  const title = getLevelTitle(post.level || 1)
  const isVerified = (post.level || 1) >= 10

  async function handleToggleReplies() {
    if (!showReplies) {
      setLoadingReplies(true)
      try {
        const data = await fetchReplies(post.id)
        setReplies(data)
      } catch { /* ignore */ }
      setLoadingReplies(false)
    }
    setShowReplies(!showReplies)
  }

  async function handleReply() {
    if (!isAuthenticated || !replyText.trim() || replying) return
    setReplying(true)
    try {
      const displayXP = profile?.total_xp ?? getXPData().totalXP
      const newReply = await createPost({
        author: username,
        content: sanitize(replyText),
        parentId: post.id,
        level: getLevel(displayXP),
        avatar: profile?.avatar_url || '🧭',
      })
      setReplies(prev => [...prev, newReply])
      setReplyText('')
      setShowReplies(true)
    } catch { /* ignore */ }
    setReplying(false)
  }

  function handleShare(post) {
    const shareData = {
      title: `${post.author} on GeoQuiz`,
      text: post.content,
      url: window.location.origin + '/community',
    }
    if (navigator.share) {
      navigator.share(shareData).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${post.content}\n\n— ${post.author} on GeoQuiz\n${shareData.url}`)
        .then(() => alert('Copied to clipboard!'))
        .catch(() => {})
    }
  }

  const displayAvatar = profile?.avatar_url || '🧭'

  return (
    <article className="x-post">
      {/* Avatar column */}
      <div className="x-post-avatar-col">
        <div className="x-avatar">{post.avatar || title.emoji}</div>
        {showReplies && replies.length > 0 && <div className="x-thread-line" />}
      </div>

      {/* Content column */}
      <div className="x-post-content-col">
        {/* Header row */}
        <div className="x-post-header">
          <div className="x-post-author">
            <span className="x-name">{post.author}</span>
            {isVerified && <CheckmarkCircleRegular fontSize={14} className="x-verified" />}
            <span className="x-handle">Lv.{post.level || 1}</span>
            <span className="x-dot">·</span>
            <span className="x-time">{timeAgo(post.created_at)}</span>
          </div>
          {isAuthenticated && (
            <button className="x-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontalRegular fontSize={18} />
            </button>
          )}
          {showMenu && (
            <div className="x-dropdown">
              <button onClick={() => { onReport(post.id); setShowMenu(false) }}>
                <FlagRegular fontSize={16} /> Report post
              </button>
            </div>
          )}
        </div>

        {/* Post body */}
        <div className="x-post-body">{post.content}</div>

        {/* Action bar */}
        <div className="x-actions">
          <button className="x-action" onClick={handleToggleReplies}>
            <ChatRegular fontSize={17} />
            <span>{replyCount > 0 ? replyCount : ''}</span>
          </button>
          <button className={`x-action ${liked ? 'x-liked' : ''}`} onClick={() => isAuthenticated ? onLike(post.id) : null} style={!isAuthenticated ? { opacity: 0.5, cursor: 'default' } : {}}>
            {liked ? <HeartFilled fontSize={17} /> : <HeartRegular fontSize={17} />}
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </button>
          <button className="x-action" onClick={() => handleShare(post)}>
            <ShareRegular fontSize={17} />
            <span>{(post.shares || 0) > 0 ? post.shares : ''}</span>
          </button>
        </div>

        {/* Replies thread */}
        {showReplies && (
          <div className="x-replies">
            {loadingReplies && <div className="x-loading">Loading...</div>}
            {replies.map(r => {
              const rTitle = getLevelTitle(r.level || 1)
              const rLiked = (r.likes || []).includes(username)
              const rVerified = (r.level || 1) >= 10
              return (
                <div key={r.id} className="x-reply">
                  <div className="x-post-avatar-col">
                    <div className="x-avatar x-avatar-sm">{r.avatar || rTitle.emoji}</div>
                  </div>
                  <div className="x-post-content-col">
                    <div className="x-post-header">
                      <div className="x-post-author">
                        <span className="x-name">{r.author}</span>
                        {rVerified && <CheckmarkCircleRegular fontSize={12} className="x-verified" />}
                        <span className="x-handle">Lv.{r.level || 1}</span>
                        <span className="x-dot">·</span>
                        <span className="x-time">{timeAgo(r.created_at)}</span>
                      </div>
                    </div>
                    <div className="x-post-body x-reply-body">{r.content}</div>
                    <div className="x-actions x-actions-sm">
                      <button className={`x-action ${rLiked ? 'x-liked' : ''}`} onClick={() => isAuthenticated ? onLike(r.id) : null} style={!isAuthenticated ? { opacity: 0.5, cursor: 'default' } : {}}>
                        {rLiked ? <HeartFilled fontSize={15} /> : <HeartRegular fontSize={15} />}
                        <span>{(r.likes || []).length > 0 ? (r.likes || []).length : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Reply composer — only for authenticated users */}
            {isAuthenticated ? (
              <div className="x-reply-compose">
                <div className="x-avatar x-avatar-sm">{displayAvatar}</div>
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Post your reply"
                  maxLength={500}
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                  className="x-reply-input"
                />
                <button
                  className="x-reply-send"
                  onClick={handleReply}
                  disabled={!replyText.trim() || replying}
                >
                  <SendRegular fontSize={18} />
                </button>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Link to="/auth" style={{ color: 'var(--primary)' }}>Sign in</Link> to reply
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default function Community({ session, profile }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [lastPostTime, setLastPostTime] = useState(0)
  const [checkedSession, setCheckedSession] = useState(session)
  const [checkedProfile, setCheckedProfile] = useState(profile)

  // If no session prop, independently check auth
  useEffect(() => {
    if (session) { setCheckedSession(session); return }
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setCheckedSession(s)
        // Fetch profile
        supabase.from('profiles').select('*').eq('id', s.user.id).single()
          .then(({ data }) => { if (data) setCheckedProfile(data) })
      }
    }).catch(() => {})
  }, [session])

  useEffect(() => { if (profile) setCheckedProfile(profile) }, [profile])

  const isAuthenticated = !!checkedSession
  const username = checkedProfile?.username || checkedProfile?.full_name || checkedSession?.user?.email?.split('@')[0] || ''
  const displayAvatar = checkedProfile?.avatar_url || '🧭'

  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchPosts(30)
      setPosts(data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  async function handlePost() {
    if (!isAuthenticated || !newPost.trim() || posting) return
    if (Date.now() - lastPostTime < 15000) {
      alert('Please wait a moment before posting again.')
      return
    }
    setPosting(true)
    try {
      const displayXP = checkedProfile?.total_xp ?? getXPData().totalXP
      const post = await createPost({
        author: username,
        content: sanitize(newPost),
        level: getLevel(displayXP),
        avatar: displayAvatar,
      })
      setPosts(prev => [post, ...prev])
      setNewPost('')
      setLastPostTime(Date.now())
    } catch { /* ignore */ }
    setPosting(false)
  }

  async function handleLike(postId) {
    if (!isAuthenticated || !username) return
    try {
      await toggleLike(postId, username)
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const likes = [...(p.likes || [])]
          const idx = likes.indexOf(username)
          if (idx >= 0) likes.splice(idx, 1)
          else likes.push(username)
          return { ...p, likes }
        }
        return p
      }))
    } catch { /* ignore */ }
  }

  async function handleReport(postId) {
    if (!isAuthenticated) return
    if (!confirm('Report this post as inappropriate?')) return
    try {
      await reportPost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch { /* ignore */ }
  }


  return (
    <section className="x-feed-page">
      {/* Feed Header */}
      <div className="x-feed-header">
        <h2>Feed</h2>
      </div>

      {/* Auth-gated composer / sign-in prompt */}
      {isAuthenticated ? (
        <div className="x-compose">
          <div className="x-compose-avatar">
            <div className="x-avatar">{displayAvatar}</div>
          </div>
          <div className="x-compose-body">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="How far? 🇳🇬"
              maxLength={500}
              rows={3}
            />
            <div className="x-compose-footer">
              <span className="x-char-count">{newPost.length}/500</span>
              <button
                className="x-post-btn"
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="x-name-gate">
          <div className="x-avatar" style={{ fontSize: '2rem' }}>🎭</div>
          <h3>Join the Conversation</h3>
          <p>Sign in to post, react, and reply to the community feed.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
            <Link to="/auth?mode=signup" className="btn btn-outline btn-sm">Create Account</Link>
          </div>
        </div>
      )}

      <div className="x-divider" />

      {/* Feed List — visible to everyone */}
      {loading ? (
        <div className="x-empty">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="x-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎭</div>
          <p>No posts yet — be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="x-feed-list">
          {posts.map(p => (
            <PostItem
              key={p.id}
              post={p}
              username={username}
              userId={checkedSession?.user?.id}
              profile={checkedProfile}
              isAuthenticated={isAuthenticated}
              onLike={handleLike}
              onReport={handleReport}
            />
          ))}
        </div>
      )}

      <div className="x-guidelines">
        <strong>Community Guidelines:</strong> Be respectful. No spam, hate speech, or inappropriate content. 🇳🇬
      </div>
    </section>
  )
}
