import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitioning, setTransitioning] = useState(false)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      setTransitioning(true)
      // Fade out
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitioning(false)
      }, 250)
      return () => clearTimeout(timer)
    } else {
      setDisplayChildren(children)
    }
  }, [children, location.pathname])

  return (
    <div className={`page-transition ${transitioning ? 'page-exit' : 'page-enter'}`}>
      {displayChildren}
    </div>
  )
}
