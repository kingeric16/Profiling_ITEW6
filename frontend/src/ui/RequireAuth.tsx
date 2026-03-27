import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchMe, getCachedUser, getToken, setCachedUser, type Role } from './auth'

export function RequireAuth({ allow }: { allow: Role[] }) {
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>('loading')
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const token = getToken()
    const cached = getCachedUser()
    if (!token) {
      setStatus('guest')
      return
    }
    if (cached?.role) {
      setRole(cached.role)
      setStatus('authed')
    }

    fetchMe()
      .then((me) => {
        if (!me) {
          setStatus('guest')
          return
        }
        setRole(me.user.role)
        // Persist latest user details (same storage as existing token)
        const remember = Boolean(localStorage.getItem('auth_token'))
        setCachedUser(me.user, remember)
        setStatus('authed')
      })
      .catch(() => setStatus('guest'))
  }, [])

  if (status === 'loading') {
    return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>Loading…</div>
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />
  }

  if (role && !allow.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

