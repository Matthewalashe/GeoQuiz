import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getNotifications, markRead, markAllRead, deleteNotification, requestPushPermission, pushSupported } from '../lib/push.js'
import {
  CheckmarkCircleRegular, DeleteRegular, AlertRegular,
} from '@fluentui/react-icons'

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

function groupByDate(items) {
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const groups = { today: [], yesterday: [], earlier: [] }
  items.forEach(n => {
    const d = new Date(n.created_at); d.setHours(0,0,0,0)
    if (d.getTime() === today.getTime()) groups.today.push(n)
    else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(n)
    else groups.earlier.push(n)
  })
  return groups
}

export default function Notifications({ session }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [pushStatus, setPushStatus] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getNotifications(100)
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (pushSupported()) setPushStatus(Notification.permission)
  }, [])

  async function handleMarkAll() {
    if (!session?.user?.id) return
    await markAllRead(session.user.id)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleTap(n) {
    if (!n.read) {
      await markRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.link) navigate(n.link)
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    await deleteNotification(id)
    setItems(prev => prev.filter(n => n.id !== id))
  }

  async function handleEnablePush() {
    const result = await requestPushPermission()
    setPushStatus(result)
  }

  const unread = items.filter(n => !n.read).length
  const groups = groupByDate(items)

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h1 className="notif-title">Notifications</h1>
          {unread > 0 && <span className="notif-unread-count">{unread} unread</span>}
        </div>
        {unread > 0 && (
          <button className="notif-mark-all" onClick={handleMarkAll}>
            <CheckmarkCircleRegular fontSize={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Push permission banner */}
      {pushStatus === 'default' && (
        <button className="notif-push-banner" onClick={handleEnablePush}>
          <AlertRegular fontSize={18} />
          <div>
            <strong>Enable push notifications</strong>
            <span>Get notified about streaks, rewards, and deals</span>
          </div>
        </button>
      )}

      {loading ? (
        <div className="notif-loading">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="notif-skeleton">
              <div className="notif-skel-icon" />
              <div className="notif-skel-lines">
                <div className="notif-skel-line" style={{ width: '70%' }} />
                <div className="notif-skel-line" style={{ width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">🎉</div>
          <h3>You're all caught up!</h3>
          <p>No new notifications. Go explore Lagos!</p>
          <Link to="/explore" className="notif-explore-btn">Explore →</Link>
        </div>
      ) : (
        <div className="notif-list">
          {groups.today.length > 0 && (
            <>
              <div className="notif-group-label">Today</div>
              {groups.today.map(n => (
                <NotifItem key={n.id} n={n} onTap={handleTap} onDelete={handleDelete} />
              ))}
            </>
          )}
          {groups.yesterday.length > 0 && (
            <>
              <div className="notif-group-label">Yesterday</div>
              {groups.yesterday.map(n => (
                <NotifItem key={n.id} n={n} onTap={handleTap} onDelete={handleDelete} />
              ))}
            </>
          )}
          {groups.earlier.length > 0 && (
            <>
              <div className="notif-group-label">Earlier</div>
              {groups.earlier.map(n => (
                <NotifItem key={n.id} n={n} onTap={handleTap} onDelete={handleDelete} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NotifItem({ n, onTap, onDelete }) {
  return (
    <div className={`notif-item ${n.read ? '' : 'notif-unread'}`} onClick={() => onTap(n)}>
      <div className="notif-icon">{n.icon || '🔔'}</div>
      <div className="notif-content">
        <div className="notif-item-title">{n.title}</div>
        <div className="notif-item-body">{n.body}</div>
        <div className="notif-item-time">{timeAgo(n.created_at)}</div>
      </div>
      {!n.read && <div className="notif-dot" />}
      <button className="notif-delete" onClick={e => onDelete(e, n.id)} aria-label="Delete">
        <DeleteRegular fontSize={14} />
      </button>
    </div>
  )
}
