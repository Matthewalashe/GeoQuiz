import { useState, useEffect, useCallback } from 'react'
import { fetchPosts, fetchReplies, createPost, toggleLike, reportPost } from '../lib/supabase.js'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'

// Basic content filter — blocks obvious slurs/spam
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
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function PostItem({ post, username, onLike, onReply, onReport }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)

  const liked = (post.likes || []).includes(username)
  const likeCount = (post.likes || []).length
  const title = getLevelTitle(post.level || 1)

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
    if (!replyText.trim() || replying) return
    setReplying(true)
    try {
      const xp = getXPData()
      const newReply = await createPost({
        author: username,
        content: sanitize(replyText),
        parentId: post.id,
        level: getLevel(xp.totalXP),
      })
      setReplies(prev => [...prev, newReply])
      setReplyText('')
      setShowReplies(true)
    } catch { /* ignore */ }
    setReplying(false)
  }

  return (
    <div className="feed-post">
      <div className="feed-post-header">
        <div className="feed-author">
          <span className="feed-avatar">{title.emoji}</span>
          <span className="feed-name">{post.author}</span>
          <span className="feed-level">Lv.{post.level || 1}</span>
        </div>
        <span className="feed-time">{timeAgo(post.created_at)}</span>
      </div>

      <div className="feed-content">{post.content}</div>

      <div className="feed-actions">
        <button
          className={`feed-action-btn ${liked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
        </button>
        <button className="feed-action-btn" onClick={handleToggleReplies}>
          💬 {showReplies ? 'Hide' : 'Reply'}
        </button>
        <button className="feed-action-btn feed-report" onClick={() => onReport(post.id)}>
          🚩
        </button>
      </div>

      {showReplies && (
        <div className="feed-replies">
          {loadingReplies && <div className="feed-loading">Loading...</div>}
          {replies.map(r => {
            const rTitle = getLevelTitle(r.level || 1)
            const rLiked = (r.likes || []).includes(username)
            return (
              <div key={r.id} className="feed-reply">
                <div className="feed-post-header">
                  <div className="feed-author">
                    <span className="feed-avatar">{rTitle.emoji}</span>
                    <span className="feed-name">{r.author}</span>
                    <span className="feed-level">Lv.{r.level || 1}</span>
                  </div>
                  <span className="feed-time">{timeAgo(r.created_at)}</span>
                </div>
                <div className="feed-content">{r.content}</div>
                <div className="feed-actions">
                  <button
                    className={`feed-action-btn ${rLiked ? 'liked' : ''}`}
                    onClick={() => onLike(r.id)}
                  >
                    {rLiked ? '❤️' : '🤍'} {(r.likes || []).length > 0 ? (r.likes || []).length : ''}
                  </button>
                  <button className="feed-action-btn feed-report" onClick={() => onReport(r.id)}>🚩</button>
                </div>
              </div>
            )
          })}
          <div className="feed-reply-box">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              maxLength={500}
              onKeyDown={e => e.key === 'Enter' && handleReply()}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleReply}
              disabled={!replyText.trim() || replying}
            >
              {replying ? '...' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Community() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [username, setUsername] = useState(() => localStorage.getItem('geoquiz_player') || '')
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('geoquiz_player'))
  const [lastPostTime, setLastPostTime] = useState(0)

  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchPosts(30)
      setPosts(data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  function handleSetName() {
    if (username.trim().length < 2) return
    localStorage.setItem('geoquiz_player', username.trim())
    setNameSet(true)
  }

  async function handlePost() {
    if (!newPost.trim() || posting) return
    // Rate limit: 15 seconds between posts
    if (Date.now() - lastPostTime < 15000) {
      alert('Please wait a moment before posting again.')
      return
    }
    setPosting(true)
    try {
      const xp = getXPData()
      const post = await createPost({
        author: username,
        content: sanitize(newPost),
        level: getLevel(xp.totalXP),
      })
      setPosts(prev => [post, ...prev])
      setNewPost('')
      setLastPostTime(Date.now())
    } catch { /* ignore */ }
    setPosting(false)
  }

  async function handleLike(postId) {
    if (!username) return
    try {
      await toggleLike(postId, username)
      // Optimistic update
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
    if (!confirm('Report this post as inappropriate?')) return
    try {
      await reportPost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch { /* ignore */ }
  }

  return (
    <section className="community">
      <h2>💬 Community</h2>
      <p className="community-subtitle">
        Chat with fellow explorers, share tips, and flex your scores
      </p>

      {/* Name gate */}
      {!nameSet ? (
        <div className="feed-name-gate card card-accent-top">
          <h3>Set Your Display Name</h3>
          <p>Choose a name to join the conversation</p>
          <div className="feed-name-form">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleSetName()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSetName} disabled={username.trim().length < 2}>
              Join Chat
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* New post */}
          <div className="feed-compose">
            <div className="feed-compose-header">
              <span className="feed-avatar">{getLevelTitle(getLevel(getXPData().totalXP)).emoji}</span>
              <span className="feed-compose-name">{username}</span>
            </div>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="What's on your mind? Share a tip, brag about your score, or ask a question..."
              maxLength={500}
              rows={3}
            />
            <div className="feed-compose-footer">
              <span className="feed-char-count">{newPost.length}/500</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
              >
                {posting ? 'Posting...' : '📤 Post'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Feed */}
      {loading ? (
        <div className="feed-loading">Loading community posts...</div>
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">💬</div>
          <p>No posts yet — be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map(p => (
            <PostItem
              key={p.id}
              post={p}
              username={username}
              onLike={handleLike}
              onReply={() => {}}
              onReport={handleReport}
            />
          ))}
        </div>
      )}

      <div className="feed-guidelines">
        <strong>Community Guidelines:</strong> Be respectful. No spam, hate speech, or inappropriate content.
        Posts that violate guidelines will be removed. 🇳🇬
      </div>
    </section>
  )
}
