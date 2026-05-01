import { useState, useEffect, useCallback } from 'react'
import { fetchPosts, fetchReplies, createPost, toggleLike, reportPost } from '../lib/supabase.js'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'
import {
  HeartRegular,
  HeartFilled,
  ChatRegular,
  ArrowRepeatAllRegular,
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

function PostItem({ post, username, onLike, onReport }) {
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
    if (!replyText.trim() || replying) return
    setReplying(true)
    try {
      const xp = getXPData()
      const newReply = await createPost({
        author: username,
        content: sanitize(replyText),
        parentId: post.id,
        level: getLevel(xp.totalXP),
        avatar: localStorage.getItem('geoquiz_avatar') || '🎭',
      })
      setReplies(prev => [...prev, newReply])
      setReplyText('')
      setShowReplies(true)
    } catch { /* ignore */ }
    setReplying(false)
  }

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
          <button className="x-menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontalRegular fontSize={18} />
          </button>
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
          <button className="x-action x-repost">
            <ArrowRepeatAllRegular fontSize={17} />
          </button>
          <button className={`x-action ${liked ? 'x-liked' : ''}`} onClick={() => onLike(post.id)}>
            {liked ? <HeartFilled fontSize={17} /> : <HeartRegular fontSize={17} />}
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </button>
          <button className="x-action">
            <ShareRegular fontSize={17} />
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
                      <button className={`x-action ${rLiked ? 'x-liked' : ''}`} onClick={() => onLike(r.id)}>
                        {rLiked ? <HeartFilled fontSize={15} /> : <HeartRegular fontSize={15} />}
                        <span>{(r.likes || []).length > 0 ? (r.likes || []).length : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Reply composer */}
            <div className="x-reply-compose">
              <div className="x-avatar x-avatar-sm">{localStorage.getItem('geoquiz_avatar') || '🎭'}</div>
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
          </div>
        )}
      </div>
    </article>
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
        avatar: localStorage.getItem('geoquiz_avatar') || '🎭',
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

  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)

  return (
    <section className="x-feed-page">
      {/* Feed Header */}
      <div className="x-feed-header">
        <h2>Feed</h2>
        <div className="x-feed-tabs">
          <button className="x-feed-tab active">For You</button>
          <button className="x-feed-tab">Following</button>
        </div>
      </div>

      {/* Name gate */}
      {!nameSet ? (
        <div className="x-name-gate">
          <div className="x-avatar" style={{ fontSize: '2rem' }}>🎭</div>
          <h3>Join the Feed</h3>
          <p>Set your display name to start posting</p>
          <div className="x-name-form">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleSetName()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSetName} disabled={username.trim().length < 2}>
              Join
            </button>
          </div>
        </div>
      ) : (
        /* Composer */
        <div className="x-compose">
          <div className="x-compose-avatar">
            <div className="x-avatar">{localStorage.getItem('geoquiz_avatar') || '🎭'}</div>
          </div>
          <div className="x-compose-body">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="What's happening in Lagos?"
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
      )}

      <div className="x-divider" />

      {/* Feed List */}
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
